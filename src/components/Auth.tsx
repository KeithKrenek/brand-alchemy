// @ts-nocheck
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, AuthError, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, try to sign in
      try {
        const signInResult = await signInWithEmailAndPassword(auth, email, password);
        await handleSuccessfulAuth(signInResult.user);
      } catch (signInError) {
        // If sign in fails, create a new account
        const signUpResult = await createUserWithEmailAndPassword(auth, email, password);
        await handleSuccessfulAuth(signUpResult.user);
        toast.success('Welcome! New account created');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const authError = error as AuthError;
      let errorMessage = 'An error occurred. Please try again.';
      
      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Please choose a stronger password (at least 6 characters).';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        default:
          errorMessage = 'Failed to authenticate. Please check your email and password.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulAuth = async (user: any) => {
    try {
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          hasCompletedInterview: false,
          interviewId: null
        });
        toast.success('Account connected successfully');
        navigate('/');
      } else {
        // Handle existing user
        const userData = userDoc.data();
        if (userData.hasCompletedInterview && userData.interviewId) {
          // Check if the interview still exists
          const interviewDoc = await getDoc(doc(db, 'interviews', userData.interviewId));
          if (interviewDoc.exists()) {
            navigate(`/report/${userData.interviewId}`);
          } else {
            // Reset user's interview status if interview doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              ...userData,
              hasCompletedInterview: false,
              interviewId: null
            });
            navigate('/');
          }
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error handling authentication:', error);
      toast.error('Error setting up account. Please try again.');
    }
  };

  const handleSocialLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulAuth(result.user);
    } catch (error) {
      console.error('Social login error:', error);
      toast.error('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-black">Elementsist</h1>
      
      {/* Email/Password Form */}
      <form onSubmit={handleAuth} className="space-y-4">
        <h2 className="text-2xl font-normal mb-4 text-black">Welcome</h2>
        <div>
          <label className="block text-dark-gray text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-dark-gray text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-dark-gray mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-dark-gray"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <button
            className="w-full bg-black hover:bg-dark-gray text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Loading...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative mt-6 mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleSocialLogin(new GoogleAuthProvider())}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-gray transition duration-300 disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M21.35 12.04c0-.79-.07-1.54-.19-2.27H12v4.51h5.24c-.23 1.13-.9 2.09-1.92 2.73v2.27h3.12c1.82-1.68 2.87-4.16 2.87-7.24z"
            />
            <path
              fill="#34A853"
              d="M12 21c2.61 0 4.79-.86 6.39-2.32l-3.12-2.27c-.86.58-1.97.92-3.27.92-2.51 0-4.64-1.69-5.4-3.96H3.42v2.34C5.02 18.87 8.29 21 12 21z"
            />
            <path
              fill="#FBBC05"
              d="M6.6 13.37c-.19-.58-.3-1.19-.3-1.82 0-.63.11-1.24.3-1.82V7.39H3.42C2.52 9.09 2 11 2 13s.52 3.91 1.42 5.61l3.18-2.24z"
            />
            <path
              fill="#EA4335"
              d="M12 6.45c1.41 0 2.68.49 3.68 1.45l2.77-2.77C16.85 3.64 14.67 2.78 12 2.78 8.29 2.78 5.02 4.91 3.42 8.09l3.18 2.24c.76-2.27 2.89-3.96 5.4-3.96z"
            />
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={() => handleSocialLogin(new FacebookAuthProvider())}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] transition duration-300 disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Sign in with Facebook
        </button>
      </div>

      {/* Sign Out Button (if user is logged in) */}
      {auth.currentUser && (
        <button
          className="mt-4 w-full bg-desert-sand hover:bg-champagne text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      )}
    </div>
  );
};

export default Auth;