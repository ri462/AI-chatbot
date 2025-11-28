"use client";
import React, { useState, useEffect } from "react";
import { useTailStore } from "@/tailStore";

const TAIL_LIST = ["ワン", "ニャー", "カー", "ウホウホ", "うっきー", "パオーン"];

interface HeaderProps {
  language: "ja" | "en" | "vi";
  setLanguage: React.Dispatch<React.SetStateAction<"ja" | "en" | "vi">>;
}

const Header = ({ language, setLanguage }: HeaderProps) => {
  const { tail, setTail } = useTailStore();

  const [openTail, setOpenTail] = useState(false);
  const [openLanguage, setOpenLanguage] = useState(false);
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
    // 直接 logout.php にナビゲートしてセッションCookieを送信させ、
    // サーバ側で破棄 → リダイレクト（login.php）する流れにします。
    // fetch 等で非同期に叩くとレスポンス待ちやCORS/credentials周りで遷移が遅くなるため、
    // ブラウザの通常遷移で確実に処理させます。
    try {
      const logoutUrl = `${location.protocol}//${location.hostname}/AI-chatbot/root/logout.php`;
      window.location.href = logoutUrl;
    } catch (e) {
      // フォールバック: 絶対パスを直接指定
      window.location.href = "http://localhost/AI-chatbot/root/logout.php";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-500 h-16 flex items-center justify-between px-4">
      <p className="text-3xl text-gray-50 font-bold">FroChat</p>

      <div className="flex gap-4 items-center">
        {/* 語尾選択＋自由入力 */}
        <div className="relative">
          <button onClick={() => setOpenTail((prev) => !prev)} className="px-3 py-1 rounded-md bg-gray-300 hover:bg-gray-400">
            語尾選択
          </button>

          {openTail && (
            <div className="absolute mt-1 w-40 bg-white border rounded-md shadow-lg z-20 p-2 flex flex-col gap-2">
              {TAIL_LIST.map((item) => (
                <button
                  key={item}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-blue-500 hover:text-white ${
                    tail === (item === "なし" ? "" : item) ? "bg-blue-500 text-white" : ""
                  }`}
                  onClick={() => {
                    setTail(item === "なし" ? "" : item);
                    setOpenTail(false);
                  }}
                >
                  {item}
                </button>
              ))}

              <div className="mt-1">
                <label className="text-gray-700 text-sm">自由入力:</label>
                <input type="text" value={tail} onChange={(e) => setTail(e.target.value)} placeholder="例: ですよ！" className="w-full px-2 py-1 border rounded-md text-black mt-1" />
              </div>
            </div>
          )}
        </div>

        {/* ダークモード */}
        <button onClick={toggleDarkMode} className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700">
          {isDarkMode ? "ライトモード" : "ダークモード"}
        </button>

        <button onClick={handleLogout} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600">
          ログアウト
        </button>

        {/* 言語選択 */}
        <div className="relative">
          <button onClick={() => setOpenLanguage((prev) => !prev)} className="px-3 py-1 rounded-md bg-gray-300 hover:bg-gray-400">
            言語選択
          </button>
          {openLanguage && (
            <div className="absolute mt-1 w-32 bg-white border rounded-md shadow-lg z-20">
              {[
                { label: "日本語", value: "ja" },
                { label: "English", value: "en" },
                { label: "Tiếng Việt", value: "vi" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  className={`w-full text-left px-2 py-1 hover:bg-blue-500 hover:text-white ${language === lang.value ? "bg-blue-500 text-white" : ""}`}
                  onClick={() => {
                    setLanguage(lang.value as "ja" | "en" | "vi");
                    setOpenLanguage(false);
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
