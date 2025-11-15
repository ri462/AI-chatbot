"use client";
import React, { useState, useEffect } from "react";
import { useTailStore } from "@/tailStore";

const TAIL_LIST = ["よっし！", "にゃん！", "だぞ！", "です！", "なり！", ""];

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem('theme') === 'dark';
  });

  const { tail, setTail } = useTailStore();
  const [open, setOpen] = useState(false); // ポップアップ表示用 state


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
  return(
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-500 h-12 flex items-center justify-between px-4">
      <p className="text-3xl text-gray-50 font-bold">FroChat</p>
      <div className="flex gap-2">
        {/* 語尾選択 */}
        <button
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
          onClick={() => setOpen((prev) => !prev)}
        >
          語尾
        </button>
          {open && (
          <div className="absolute top-full mt-2 w-32 bg-white border rounded-md shadow-lg z-20">
            {TAIL_LIST.map(item => (
              <button
                key={item}
                className={`w-full text-left px-2 py-1 hover:bg-blue-500 hover:text-white ${
                  tail === item ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => {
                  setTail(item); // Zustand で tail 更新
                  setOpen(false); // 選んだら閉じる
                }}
              >
                {item == "" ? "なし" : item}
              </button>
            ))}
          </div>
        )}
        {/* ダークモード切替 */}
        <button 
          onClick={toggleDarkMode} 
          className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700"
        >
          {isDarkMode ? "ライトモード" : "ダークモード"}
        </button>
      </div>
    </header>
  );
};
export default Header;