// src/test/vite-env-mock.ts
interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_INTERVIEW_ASSISTANT_ID: string;
    readonly VITE_REPORT_ASSISTANT_ID: string;
  }
  
  export const mockViteEnv: ImportMetaEnv = {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
    VITE_FIREBASE_PROJECT_ID: 'test-project-id',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_INTERVIEW_ASSISTANT_ID: 'test-interview-assistant-id',
    VITE_REPORT_ASSISTANT_ID: 'test-report-assistant-id'
  };
  
  if (process.env.NODE_ENV === 'test') {
    Object.assign(process.env, mockViteEnv);
  }