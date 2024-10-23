// src/test/setup-env.ts
import type { ImportMetaEnv } from '@types/vite/client';

declare global {
  namespace NodeJS {
    interface Global {
      import: {
        meta: {
          env: ImportMetaEnv & {
            VITE_FIREBASE_API_KEY: string;
            VITE_FIREBASE_AUTH_DOMAIN: string;
            VITE_FIREBASE_PROJECT_ID: string;
            VITE_FIREBASE_STORAGE_BUCKET: string;
            VITE_FIREBASE_MESSAGING_SENDER_ID: string;
            VITE_FIREBASE_APP_ID: string;
            VITE_OPENAI_API_KEY: string;
            VITE_INTERVIEW_ASSISTANT_ID: string;
            VITE_REPORT_ASSISTANT_ID: string;
          };
          url: string;
        };
      };
    }
  }
}

// Set environment variables
process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
process.env.VITE_FIREBASE_APP_ID = 'test-app-id';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.VITE_INTERVIEW_ASSISTANT_ID = 'test-interview-assistant-id';
process.env.VITE_REPORT_ASSISTANT_ID = 'test-report-assistant-id';

// Mock import.meta
const mockImportMeta = {
  meta: {
    env: process.env as ImportMetaEnv,
    url: 'http://localhost:3000'
  }
};

(global as any).import = mockImportMeta;