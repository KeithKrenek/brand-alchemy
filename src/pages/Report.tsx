import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import { FileDown, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Report: React.FC = () => {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    const checkSessionAndGenerateReport = async () => {
      if (!sessionId) return;

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        if (sessionData.isComplete) {
          generateReport(sessionData.threadId);
        } else {
          navigate('/');
        }
      } else {
        console.error('Session not found');
        navigate('/');
      }
    };

    checkSessionAndGenerateReport();
  }, [sessionId, navigate]);

  // ... rest of the Report component code remains the same
};

export default Report;