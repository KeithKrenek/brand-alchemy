import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="bg-dark-gray text-bone p-2">
      <div className="container mx-auto flex justify-between items-center h-6">
        <Link to="/" className="text-2xl font-bold">
          Brand Alchemy Formulation
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