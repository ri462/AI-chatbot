"use client";
import React, { useState, useEffect } from "react"; 
const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem('theme') === 'dark';
  });
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleLogout = () => {
    // PHPのログアウトページにリダイレクト
    window.location.href = 'http://localhost/AI-chatbot/root/logout.php';
  };

  return(
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-500 h-12 flex items-center justify-between px-4">
    <p className="text-3xl text-gray-50 font-bold">ChatBot</p>
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleDarkMode} 
          className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700"
        >
          {isDarkMode ? "ライトモード" : "ダークモード"}
        </button>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
};
export default Header;