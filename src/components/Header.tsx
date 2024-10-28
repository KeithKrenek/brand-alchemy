import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import whiteLogo from '../assets/white-logo.png';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="bg-dark-gray text-bone p-2">
      <div className="container mx-auto flex justify-between items-center h-6">
        <Link to="/" className="text-2xl font-bold h-full flex items-center">
        <img src={whiteLogo} alt="Brand Alchemy Formulation" className="h-full w-auto object-contain" />
          {/* Brand Alchemy Formulation */}
        </Link>
        <nav>
          {user ? (
            <span>{user.email}</span>
          ) : (
            <Link to="/auth" className="hover:underline">
              Login / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;