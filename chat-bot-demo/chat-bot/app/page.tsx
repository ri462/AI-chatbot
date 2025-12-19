"use client";

import React, { useState, useEffect } from "react";
import { useTailStore } from "@/tailStore";

const TAIL_LIST = ["ワン", "ニャー", "カー", "ウホウホ", "うっきー", "パオーン"];

interface HeaderProps {
  language: "ja" | "en" | "vi";
  setLanguage: React.Dispatch<React.SetStateAction<"ja" | "en" | "vi">>;
  isGuest: boolean;
  isHistoryOpen: boolean;
  toggleHistory: () => void;
}

const Header = ({
  language,
  setLanguage,
  isGuest,
  isHistoryOpen,
  toggleHistory,
}: HeaderProps) => {
  const { tail, setTail } = useTailStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openTail, setOpenTail] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleLogout = () => {
    window.location.href = "http://localhost/AI-chatbot/root/logout.php";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-500 h-16 flex items-center justify-between px-4">
      <p className="text-3xl text-white font-bold">FroChat</p>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
        >
          ☰ メニュー
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-4 flex flex-col gap-4 z-50">
            {/* 語尾 */}
            <div className="relative">
              <button
                onClick={() => setOpenTail((p) => !p)}
                className="w-full px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                語尾選択
              </button>

              {openTail && (
                <div className="absolute mt-1 w-full bg-white border rounded-md shadow-md">
                  {TAIL_LIST.map((item) => (
                    <button
                      key={item}
                      className={`w-full px-2 py-1 text-left hover:bg-blue-500 hover:text-white ${
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
                  <div className="border-t p-2">
                    <input
                      value={tail}
                      onChange={(e) => setTail(e.target.value)}
                      placeholder="自由入力"
                      className="w-full border px-2 py-1 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 言語 */}
            <div>
              <p className="font-bold mb-1">言語選択</p>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "ja" | "en" | "vi")
                }
                className="w-full border px-2 py-1 rounded-md"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>

            {/* 履歴 */}
            {!isGuest && (
              <button
                onClick={() => {
                  toggleHistory();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isHistoryOpen ? "履歴を閉じる" : "履歴を表示"}
              </button>
            )}

            {/* ダークモード */}
            <button
              onClick={() => setIsDarkMode((p) => !p)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
            >
              {isDarkMode ? "ライトモード" : "ダークモード"}
            </button>

            {/* ログアウト */}
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
