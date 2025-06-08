
import React from 'react';
import TokenForm from './components/TokenForm';
import { GithubIcon } from './components/icons';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Token Minter Pro</h1>
        <a 
          href="https://github.com/your-repo" // Replace with actual repo URL
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="GitHub Repository"
        >
          <GithubIcon className="w-6 h-6" />
        </a>
      </header>
      <TokenForm />
      <footer className="w-full text-center p-4 mt-8 text-sm text-gray-500">
        <p>&copy; ${new Date().getFullYear()} Token Minter Pro. All rights reserved.</p>
        <p>This is a tool for demonstration and educational purposes. Use with caution.</p>
      </footer>
    </div>
  );
};

export default App;
