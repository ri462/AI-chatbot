"use client";

import React, { useState, useEffect } from "react";
import { useTailStore } from "@/tailStore";

const TAIL_LIST = ["😊", "😢", "👍", "😋", "👋", "♥"];

interface HeaderProps {
  language: "ja" | "en" | "vi";
  setLanguage: React.Dispatch<React.SetStateAction<"ja" | "en" | "vi">>;
}

const Header = ({ language, setLanguage }: HeaderProps) => {
  const { tail, setTail } = useTailStore();
  const [openTail, setOpenTail] = useState(false);


  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleLogout = () => {
    try {
      const logoutUrl = `${location.protocol}//${location.hostname}/AI-chatbot/root/logout.php`;
      window.location.href = logoutUrl;
    } catch (e) {
      window.location.href = "http://localhost/AI-chatbot/root/logout.php";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-500 h-16 flex items-center justify-between px-4">
      <p className="text-3xl text-gray-50 font-bold">FroChat</p>

      {/*  ここが新しいメニュー  */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
        >
          ☰ メニュー
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 p-4 flex flex-col gap-4">

            {/* --- 語尾選択 --- */}
            <div className="relative">
              <button
                onClick={() => setOpenTail((prev) => !prev)}
                className="px-3 py-1 rounded-md bg-gray-300 hover:bg-gray-400"
              >
              語尾選択
            </button>

          {openTail && (
            <div className="absolute mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
              {/* 語尾リスト */}
              {TAIL_LIST.map((item) => (
                <button
                  key={item}
                  className={`w-full text-left px-2 py-1 hover:bg-blue-500 hover:text-white ${
                    tail === item ? "bg-blue-500 text-white" : ""
              }`}
              onClick={() => {
                setTail(item);
                setOpenTail(false);
              }}
            >
          {item}
        </button>
      ))}

      {/* 自由入力 */}
      <div className="border-t p-2">
        <label className="text-sm text-gray-700">自由入力</label>
        <input
          type="text"
          value={tail}
          onChange={(e) => setTail(e.target.value)}
          placeholder="例: ですよ！"
          className="w-full px-2 py-1 border rounded-md text-black mt-1"
        />
      </div>
    </div>
  )}
</div>

            {/* --- 言語 --- */}
            <div>
              <p className="font-bold mb-1">言語選択</p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "ja" | "en" | "vi")}
                className="w-full px-2 py-1 border rounded-md"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>

            {/* --- ダークモード --- */}
            <div>
              <button
                onClick={toggleDarkMode}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {isDarkMode ? "ライトモード" : "ダークモード"}
              </button>
            </div>

            {/* --- ログアウト --- */}
            <div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
      {/*  ここまでメニュー  */}
    </header>
  );
};

export default Header;
