// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TOTAL_QUESTIONS = 35;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messageListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [lastQuestionAsked, setLastQuestionAsked] = useState<number>(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const scrollToBottom = () => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(scrollToBottom, [messages]);

  // Focus the textarea when the component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus the textarea when the Assistant stops typing
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);
  

  useEffect(() => {
    const initializeChat = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            email: auth.currentUser.email,
            hasCompletedInterview: false,
            interviewId: null
          });
        }
      
        const userData = userDoc.data();
        const storedInterviewId = localStorage.getItem('interviewId');
        
        if (userData && userData.hasCompletedInterview && userData.interviewId) {
          navigate(`/report/${userData.interviewId}`);
          return;
        }
        
        if (storedInterviewId) {
          await resumeInterview(storedInterviewId);
        } else if (userData && userData.interviewId) {
          await resumeInterview(userData.interviewId);
        } else {
          await createNewInterview();
        }
      } catch (error) {
        console.error('Error in initializeChat:', error);
        toast.error('Failed to initialize chat. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };
  
    initializeChat();
  }, [navigate]);

  const createNewInterview = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated');
        toast.error('Please log in to start a new interview.');
        navigate('/auth');
        return;
      }
  
      console.log('Creating new OpenAI thread...');
      const thread = await openai.beta.threads.create();
      setThreadId(thread.id);
      
      console.log('Adding new interview document to Firestore...');
      const interviewRef = await addDoc(collection(db, 'interviews'), {
        threadId: thread.id,
        isComplete: false,
        createdAt: new Date(),
        lastUpdated: new Date(),
        messages: [],
        userId: user.uid
      });
      setInterviewId(interviewRef.id);
      localStorage.setItem('interviewId', interviewRef.id);
      
      console.log('Updating user document in Firestore...');
      await updateDoc(doc(db, 'users', user.uid), {
        interviewId: interviewRef.id,
        hasCompletedInterview: false
      });
  
      console.log('Sending initial message...');
      await sendInitialMessage(thread.id);
      
      // toast.success('New interview started');
      console.log('New interview started');
    } catch (error) {
      console.error('Error creating new interview:', error);
      toast.error('Failed to start a new interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resumeInterview = async (interviewId: string) => {
    setIsLoading(true);
    try {
      const interviewRef = doc(db, 'interviews', interviewId);
      const interviewSnap = await getDoc(interviewRef);
      if (interviewSnap.exists()) {
        const interviewData = interviewSnap.data();
        setThreadId(interviewData.threadId);
        setInterviewId(interviewId);
        
        // Load and set previous messages
        const previousMessages = interviewData.messages || [];
        setMessages(previousMessages);
        
        // Update question count based on previous messages
        const userMessageCount = previousMessages.filter((msg: { role: string; }) => msg.role === 'user').length;
        setQuestionCount(userMessageCount);
  
        // Trigger the Assistant to continue the interview
        await continueInterview(interviewData.threadId);
  
        // toast.success('Interview resumed successfully');
        console.log('Interview resumed successfully');
      } else {
        throw new Error('Interview not found');
      }
    } catch (error) {
      console.error('Error resuming interview:', error);
      toast.error('Failed to resume the interview. Please try again or start a new one.');
      // Instead of automatically starting a new interview, we'll let the user decide
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  const continueInterview = async (threadId: string, retryCount = 0) => {
    try {
      setIsTyping(true);
  
      // Check for any active runs and cancel them if they exist
      const activeRuns = await openai.beta.threads.runs.list(threadId);
      for (const run of activeRuns.data) {
        if (run.status === 'in_progress') {
          await openai.beta.threads.runs.cancel(threadId, run.id);
        }
      }
  
      // Only send the continuation message if we're not at the start of the interview
      if (lastQuestionAsked >= 0) {
        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: "Please continue the interview from where we left off."
        });
      }
  
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_INTERVIEW_ASSISTANT_ID
      });
  
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
  
      const messagesResponse = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = messagesResponse.data[0];
  
      if (assistantMessage && assistantMessage.role === 'assistant' && assistantMessage.content[0].type === 'text') {
        const newMessage: Message = {
          role: 'assistant',
          content: assistantMessage.content[0].text.value
        };
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, newMessage];
          updateInterviewMessages(updatedMessages);
          return updatedMessages;
        });
        setLastQuestionAsked(prev => prev + 1);
      } else {
        console.error('Unexpected message format:', assistantMessage);
        throw new Error('Unexpected message format from assistant');
      }
    } catch (error) {
      console.error('Error continuing interview:', error);
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await continueInterview(threadId, retryCount + 1);
      } else {
        toast.error('Failed to continue the interview. Please try again.');
      }
    } finally {
      setIsTyping(false);
    }
  };
  
  const updateInterviewMessages = async (newMessages: Message[]) => {
    if (interviewId) {
      try {
        const interviewRef = doc(db, 'interviews', interviewId);
        await updateDoc(interviewRef, {
          messages: newMessages,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error updating interview messages:', error);
        toast.error('Failed to save your message. Please try again.');
      }
    }
  };

  const checkInterviewComplete = async (threadId: string): Promise<boolean> => {
    try {
      if (questionCount < TOTAL_QUESTIONS) {
        console.log('Not all questions answered yet, interview incomplete');
        return false;
      }
  
      console.log('Checking if interview is complete...');
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: 'Is the interview complete?'
      });
  
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_INTERVIEW_ASSISTANT_ID
      });
  
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
  
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
  
      if (lastMessage.role === 'assistant') {
        const response = lastMessage.content[0].text.value.toLowerCase();
        const isComplete = response.includes('yes') && questionCount >= TOTAL_QUESTIONS;
        console.log('Interview complete status:', isComplete);
        return isComplete;
      }
    } catch (error) {
      console.error('Error checking interview completion:', error);
      toast.error('Failed to check if the interview is complete. Please continue.');
    }
    return false;
  };

  const sendMessage = async () => {
    if (input.trim() === '' || !threadId || !interviewId) return;
  
    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateInterviewMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
  
    try {
      setIsTyping(true);
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: input
      });
  
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_INTERVIEW_ASSISTANT_ID
      });
  
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
  
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
  
      if (lastMessage.role === 'assistant') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: lastMessage.content[0].text.value
        };
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);
        updateInterviewMessages(newMessages);
        setQuestionCount(prevCount => prevCount + 1);
      }
  
      const isComplete = await checkInterviewComplete(threadId);
      if (isComplete) {
        console.log('Interview complete, updating Firestore...');
        await updateDoc(doc(db, 'interviews', interviewId), {
          isComplete: true
        });
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          hasCompletedInterview: true,
          interviewId: interviewId
        });
        localStorage.removeItem('interviewId');
        toast.success('Interview completed! Generating your report...');

        // New Step: Save the brand name
        await saveBrandNameAfterInterview(threadId, interviewId);

        console.log('Navigating to report page...');
        navigate(`/report/${interviewId}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send your message. Please try again.');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      // Focus on the input after sending a message
      inputRef.current?.focus();
    }
  };

  // New function to ask for the brand name and save it in Firestore
  const saveBrandNameAfterInterview = async (threadId: string, interviewId: string) => {
    try {
      // Ask the assistant what the brand's name is
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: 'What is the brand name? Please respond only with the brand name. Do not add extra punctuation, letters, or words.',
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_INTERVIEW_ASSISTANT_ID,
      });

      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant') {
        const brandName = lastMessage.content[0].text.value;
        console.log('Brand name:', brandName);

        // Save the brand name in Firestore
        await updateDoc(doc(db, 'interviews', interviewId), {
          brandName: brandName,
        });

        // toast.success('Brand name saved successfully!');
      }
    } catch (error) {
      console.error('Error saving brand name:', error);
      toast.error('Failed to save the brand name. Please try again.');
    }
  };

  const sendInitialMessage = async (threadId: string) => {
    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: "Hello, I'm ready to start the interview about my brand."
      });
  
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_INTERVIEW_ASSISTANT_ID
      });
  
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
  
      const messagesResponse = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = messagesResponse.data[0];
  
      if (assistantMessage && assistantMessage.role === 'assistant' && assistantMessage.content[0].type === 'text') {
        const newMessage: Message = {
          role: 'assistant',
          content: assistantMessage.content[0].text.value
        };
        setMessages([newMessage]);
        updateInterviewMessages([newMessage]);
      }
    } catch (error) {
      console.error('Error sending initial message:', error);
      throw error;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline
      if (!isLoading) {
        sendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex-grow overflow-hidden p-6 bg-white-smoke">
        <div className="mb-4">
          <ProgressBar current={lastQuestionAsked + 1} total={TOTAL_QUESTIONS} />
        </div>
        <div 
          ref={messageListRef}
          className="h-full overflow-y-auto pr-4 pb-4 space-y-4"
        >
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                isLast={index === messages.length - 1} 
              />
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-neutral-gray italic"
            >
              Assistant is typing...
            </motion.div>
          )}
        </div>
      </main>
      <footer className="bg-white p-4 shadow-md">
        <div className="flex items-center max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow p-3 border border-neutral-gray rounded-l-lg focus:outline-none focus:ring-2 focus:ring-dark-gray resize-none h-24"
            placeholder="Type your message..."
            disabled={isLoading}
            // rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-dark-gray text-bone p-3 rounded-r-lg hover:bg-dark-gray transition duration-300 disabled:bg-neutral-gray focus:outline-none focus:ring-2 focus:ring-dark-gray h-24"
          >
            {isLoading ? <Loader className="animate-spin" /> : <Send />}
          </button>
        </div>
      </footer>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message; isLast: boolean }> = ({ message, isLast }) => {
  const formattedContent = message.role === 'assistant'
    ? message.content.replace(/([^?.!]*\?)/g, '<strong>$1</strong>')
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mb-4 ${message.role === 'user' ? 'text-left' : 'text-left'}`}
    >
      <span
        className={`inline-block p-3 rounded-lg ${
          message.role === 'user'
            ? 'bg-dark-gray text-bone'
            : 'bg-bone text-dark-gray'
        } ${isLast && message.role === 'assistant' ? 'animate-pulse' : ''}`}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </motion.div>
  );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-full bg-taupe-gray rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className="bg-desert-sand h-2.5 rounded-full" 
        style={{ width: `${percentage}%` }}
      ></div>
      {/* <div className="text-center mt-2 text-sm text-gray-600">
        Question {current} of {total}
      </div> */}
    </div>
  );
};

export default Chat;
