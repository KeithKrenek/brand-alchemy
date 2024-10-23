// src/setupTests.ts
import '@testing-library/jest-dom';
import React from 'react';
import type { ReactNode } from 'react';

// Mock OpenAI
jest.mock('openai', () => ({
  default: class OpenAIMock {
    beta = {
      threads: {
        create: jest.fn().mockResolvedValue({ id: 'mock-thread-id' }),
        messages: {
          create: jest.fn().mockResolvedValue({}),
          list: jest.fn().mockResolvedValue({
            data: [{
              role: 'assistant',
              content: [{ type: 'text', text: { value: 'Mock response' } }]
            }]
          }),
        },
        runs: {
          create: jest.fn().mockResolvedValue({ id: 'mock-run-id' }),
          retrieve: jest.fn().mockResolvedValue({ status: 'completed' }),
        },
      },
    };
  }
}));

// Mock Firebase Auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
};

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  FacebookAuthProvider: jest.fn().mockImplementation(() => ({})),
}));

// Mock Firestore
const mockFirestore = {
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  doc: mockFirestore.doc,
  getDoc: mockFirestore.getDoc,
  setDoc: mockFirestore.setDoc,
  updateDoc: mockFirestore.updateDoc,
  collection: mockFirestore.collection,
  addDoc: mockFirestore.addDoc,
}));

// Mock React Router
const mockNavigate = jest.fn();

// Create mock components
const MockLink = ({ children, to }: { children: ReactNode; to: string }) => (
  React.createElement('a', { href: to }, children)
);

const MockBrowserRouter = ({ children }: { children: ReactNode }) => (
  React.createElement('div', null, children)
);

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  Link: MockLink,
  BrowserRouter: MockBrowserRouter,
}));

// Export mocks for use in tests
export {
  mockAuth,
  mockFirestore,
  mockNavigate,
};