import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import OpenAI from 'openai';
import { FileDown, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { generatePDF } from '../utils/pdfGenerator';

const Report: React.FC = () => {
  const [report, setReport] = useState('');
  const [brandName, setBrandName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const renderers = {
    h1: ({children}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-black">{children}</h1>,
    h2: ({children}) => <h2 className="text-2xl font-semibold mt-6 mb-3 text-black">{children}</h2>,
    p: ({children}) => <p className="mb-4 text-dark-gray">{children}</p>,
    ul: ({children}) => <ul className="list-disc pl-5 mb-4 text-dark-gray">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal pl-5 mb-4 text-dark-gray">{children}</ol>,
    li: ({children}) => <li className="mb-2">{children}</li>,
    hr: () => <hr className="my-8 border-t border-gray-300" />,
  };

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    const checkInterviewAndGenerateReport = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }
    
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          console.error('User document does not exist');
          toast.error('User profile not found. Please log out and log in again.');
          navigate('/');
          return;
        }
    
        const userData = userDoc.data();
    
        if (!userData || !userData.hasCompletedInterview) {
          toast.error('You have not completed an interview yet.');
          navigate('/');
          return;
        }

        const interviewId = userData.interviewId;
        const interviewRef = doc(db, 'interviews', interviewId);
        const interviewSnap = await getDoc(interviewRef);

        if (interviewSnap.exists()) {
          const interviewData = interviewSnap.data();
          if (interviewData.isComplete) {
            if (interviewData.report) {
              setReport(interviewData.report);
              setBrandName(interviewData.brandName || 'Your Brand');
              setIsLoading(false);
            } else {
              await generateFullReport(interviewData.threadId, interviewId);
            }
          } else {
            setError('Interview is not complete');
          }
        } else {
          setError('Interview not found');
        }
      } catch (error) {
        console.error('Error checking interview:', error);
        setError('Failed to load interview data');
      } finally {
        setIsLoading(false);
      }
    };

    checkInterviewAndGenerateReport();
  }, [navigate]);

  const generateFullReport = async (threadId: string, interviewId: string) => {
    setIsLoading(true);
    try {
      const sections = [
        "The Current Situation",
        "Recommendations",
        "Target Audience",
        "Keywords",
        "The Formula"
      ];

      let fullReport = '';
      let brandName = 'Your Brand';

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        setProgress((i / sections.length) * 100);

        const sectionPrompt = `Generate the "${section}" section of the Brand Audit Report based on the interview summary. Follow the instructions for this section as outlined in your system prompt. Ensure the content is comprehensive and detailed.`;

        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: sectionPrompt
        });

        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: import.meta.env.VITE_REPORT_ASSISTANT_ID
        });

        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        while (runStatus.status !== 'completed') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }

        const reportMessages = await openai.beta.threads.messages.list(threadId);
        const reportMessage = reportMessages.data.find(message => 
          message.role === 'assistant' && message.run_id === run.id
        );

        if (reportMessage && reportMessage.content[0].type === 'text') {
          // fullReport += `# ${section}\n\n${reportMessage.content[0].text.value}\n\n`;
          fullReport += `${reportMessage.content[0].text.value}\n\n\n\n`;
          
          // Extract brand name from the first section
          // if (i === 0) {
          //   const match = reportMessage.content[0].text.value.match(/^([^:]+):/);
          //   if (match) {
          //     brandName = match[1].trim();
          //   }
          // }
        } else {
          throw new Error(`Failed to generate ${section} section`);
        }
      }

      setReport(fullReport);
      setBrandName(brandName);
      setError(null);

      // Save the generated report
      const interviewRef = doc(db, 'interviews', interviewId);
      await updateDoc(interviewRef, { report: fullReport, brandName: brandName });

    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // useEffect(() => {
  //   loadCustomFont();
  // }, []);

  // const loadCustomFont = () => {
  //   const doc = new jsPDF();
  //   doc.addFileToVFS('CustomFont.ttf', customFont);
  //   doc.addFont('CustomFont.ttf', 'CustomFont', 'normal');
  // };

  const downloadPDF = async () => {
    setIsPdfLoading(true);
    try {
      await generatePDF({
        title: 'Elementsist Brand Alchemy Report',
        brandName,
        report
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-4xl font-extrabold mb-6 text-black">Your Brand Alchemy Report</h1>
      {/* <h2 className="text-2xl font-bold mb-4 text-black">{brandName}</h2> */}
      {isLoading ? (
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 mb-4 mx-auto" />
          <p>Generating your report... {Math.round(progress)}% complete</p>
        </div>
      ) : (
        <>
          <button
            onClick={downloadPDF}
            disabled={isPdfLoading}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-dark-gray transition duration-300 flex items-center mb-6 disabled:bg-neutral-gray"
          >
            {isPdfLoading ? <Loader className="animate-spin mr-2" /> : <FileDown className="mr-2" />}
            {isPdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral-gray">
            <ReactMarkdown 
              className="prose max-w-none"
              components={renderers}
            >
              {report}
            </ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;