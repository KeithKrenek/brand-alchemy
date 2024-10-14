import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Elementsist</h1>
      <p className="text-xl mb-8">Your AI-powered brand consultant</p>
      <img
        src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        alt="Branding concept"
        className="rounded-lg shadow-lg mb-8 mx-auto"
      />
      <Link
        to="/chat"
        className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold inline-flex items-center hover:bg-blue-700 transition duration-300"
      >
        Start Your Brand Consultation <ArrowRight className="ml-2" />
      </Link>
    </div>
  );
};

export default Home;