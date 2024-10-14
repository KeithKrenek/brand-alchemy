import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Zap size={24} />
          <span className="text-xl font-bold">Elementsist</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;