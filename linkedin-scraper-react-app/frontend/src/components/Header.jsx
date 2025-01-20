// frontend/src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { FaLinkedin, FaMoon, FaSun } from 'react-icons/fa';

function Header() {
  const [darkMode, setDarkMode] = useState(false);

  // On mount, check for saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className="bg-linkedin p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaLinkedin className="text-white text-3xl" />
          <h1 className="text-white text-2xl font-bold">LinkedIn Scraper</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="text-white text-xl focus:outline-none"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </header>
  );
}

export default Header;
