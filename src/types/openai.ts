// src/types/openai.ts
export type MessageContentText = {
    type: 'text';
    text: {
      value: string;
      annotations?: Array<any>;
    };
  };
  
  export type MessageContentImage = {
    type: 'image_file';
    image_file: {
      file_id: string;
    };
  };
  
  export type MessageContent = MessageContentText | MessageContentImage;
  
  // Add other OpenAI-related types
  export type ThreadMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: MessageContent[];
    created_at: number;
    thread_id: string;
    run_id?: string;
  };
  
  // src/types/chat.ts
  export interface Message {
    role: 'user' | 'assistant';
    content: string;
    questionNumber?: number;
    timestamp?: number;
  }
  
  export interface InterviewData {
    threadId: string;
    isComplete: boolean;
    createdAt: Date;
    lastUpdated: Date;
    messages: Message[];
    userId: string;
    answeredQuestions: number[];
    currentQuestionNumber: number;
    progress: number;
  }