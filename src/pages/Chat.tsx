import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const navigate = useNavigate();

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      const storedSessionId = localStorage.getItem('sessionId');
      if (storedSessionId) {
        await resumeSession(storedSessionId);
      } else {
        await createNewSession();
      }
    };
    initializeChat();
  }, []);

  const createNewSession = async () => {
    const thread = await openai.beta.threads.create();
    setThreadId(thread.id);
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      threadId: thread.id,
      isComplete: false,
      createdAt: new Date(),
      lastUpdated: new Date(),
      messages: []
    });
    setSessionId(sessionRef.id);
    localStorage.setItem('sessionId', sessionRef.id);
    await sendInitialMessage(thread.id);
  };

  const resumeSession = async (sessionId: string) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      setThreadId(sessionData.threadId);
      setSessionId(sessionId);
      setMessages(sessionData.messages);
    } else {
      await createNewSession();
    }
  };

  const sendInitialMessage = async (threadId: string) => {
    setIsLoading(true);
    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: "Let's start the interview"
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: 'asst_EswpfkynmB7zeHE9cp6akEAm'
      });

      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = messages.data[0];

      if (assistantMessage.role === 'assistant') {
        const newMessage = {
          role: 'assistant',
          content: assistantMessage.content[0].text.value
        };
        setMessages([newMessage]);
        updateSessionMessages([newMessage]);
      }
    } catch (error) {
      console.error('Error sending initial message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionMessages = async (newMessages: Message[]) => {
    if (sessionId) {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        messages: newMessages,
        lastUpdated: new Date()
      });
    }
  };

  const checkInterviewComplete = async (threadId: string): Promise<boolean> => {
    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: 'Is the interview complete?'
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: 'asst_EswpfkynmB7zeHE9cp6akEAm'
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
        return response.includes('yes');
      }
    } catch (error) {
      console.error('Error checking interview completion:', error);
    }
    return false;
  };

  const sendMessage = async () => {
    if (input.trim() === '' || !threadId || !sessionId) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateSessionMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: input
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: 'asst_EswpfkynmB7zeHE9cp6akEAm'
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
        updateSessionMessages(newMessages);
      }

      const isComplete = await checkInterviewComplete(threadId);
      if (isComplete) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          isComplete: true
        });
        localStorage.removeItem('sessionId');
        navigate(`/report/${sessionId}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-4 text-center">Elementsist Brand Consultation</h1>
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-white rounded-lg shadow">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-grow mr-2 p-2 border rounded-lg"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          {isLoading ? <Loader className="animate-spin" /> : <Send />}
        </button>
      </div>
    </div>
  );
};

export default Chat;