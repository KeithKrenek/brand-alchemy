// src/test/test-types.d.ts
/// <reference types="vite/client" />

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
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  declare global {
    interface Window {
      env: ImportMetaEnv;
    }
  }