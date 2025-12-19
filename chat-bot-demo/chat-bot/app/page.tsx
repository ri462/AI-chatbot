"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTailStore } from "@/tailStore";
import { aiResponse } from "./action";
import type { IChatMessage } from "@/type";
import ChatMessageArea from "@/components/chatMessageArea";

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

// --------------------
// Home page component
// --------------------
type Thread = {
  id: string;
  title: string;
  messages: IChatMessage[];
  createdAt: string;
  origin?: "like" | "dislike" | "manual";
};

export default function Home() {
  const [language, setLanguage] = useState<"ja" | "en" | "vi">("ja");
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { tail } = useTailStore();

  const toggleHistory = () => setIsHistoryOpen((p) => !p);

  useEffect(() => {
    // 判定: ゲスト or クッキー
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("guest") === "1";
    const fromCookie = document.cookie.split("; ").some((c) => c.startsWith("chat_guest=1"));
    setIsGuest(Boolean(fromQuery || fromCookie));
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // 初回の履歴読み込み: localStorage → サーバ
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // 1) localStorage のスレッド
        const s = typeof window !== "undefined" ? localStorage.getItem("chat_threads") : null;
        if (s) {
          const parsed: Thread[] = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setThreads(parsed);
            setCurrentThreadId(parsed[0].id);
            setChatMessages(parsed[0].messages);
            return;
          }
        }

        // 2) サーバ履歴（ログインしていれば取得可能）
        const resp = await fetch("http://localhost/AI-chatbot/root/chat_history.php?limit=50", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.items)) {
            const restored: IChatMessage[] = data.items.map((it: any) => ({
              role: it.role === "assistant" ? "assistant" : "user",
              content: String(it.content ?? ""),
            }));
            const tid = String(Date.now());
            const thread: Thread = { id: tid, title: "デフォルト", messages: restored, createdAt: new Date().toISOString() };
            setThreads([thread]);
            setCurrentThreadId(tid);
            setChatMessages(restored);
          }
        }
      } catch (e) {
        console.error("履歴読み込みに失敗:", e);
      }
    };

    // ゲストでも localStorage の履歴は表示したいので常に呼ぶ
    loadHistory();
  }, []);

  const saveMessage = async (msg: IChatMessage) => {
    try {
      // サーバ保存（ログイン時のみ有効、失敗は無視）
      fetch("http://localhost/AI-chatbot/root/chat_history.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      }).catch(() => {});

      // スレッドへ反映 + localStorage 保存
      if (currentThreadId) {
        setThreads((prev) => {
          const next = prev.map((t) => (t.id === currentThreadId ? { ...t, messages: [...t.messages, msg] } : t));
          try {
            localStorage.setItem("chat_threads", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch (e) {
      console.error("履歴保存に失敗:", e);
    }
  };

  const onClick = async () => {
    if (!content.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage: IChatMessage = {
      role: "user",
      content: content,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    saveMessage(userMessage);

    const systemMessage: IChatMessage = {
      role: "system",
      content:
        language === "ja"
          ? "あなたは日本語のみで回答してください。英語やベトナム語を使ってはいけません。"
          : language === "en"
          ? "You must respond only in English. Do not use Japanese or Vietnamese."
          : "Bạn chỉ được trả lời bằng Tiếng Việt. Không được dùng tiếng Nhật hay tiếng Anh.",
    };

    const currentThread = threads.find((t) => t.id === currentThreadId);
    const messagesToSend = [systemMessage, ...(currentThread ? currentThread.messages : chatMessages), userMessage];

    try {
      let aiText = await aiResponse(messagesToSend, tail || "");
      if (!aiText) aiText = "エラーが発生しました。";
      const assistantMessage: IChatMessage = { role: "assistant", content: aiText };
      setChatMessages((prev) => [...prev, assistantMessage]);
      saveMessage(assistantMessage);
    } catch (e) {
      console.error("AI応答取得エラー:", e);
      const assistantMessage: IChatMessage = { role: "assistant", content: "エラーが発生しました。もう一度試してください。" };
      setChatMessages((prev) => [...prev, assistantMessage]);
    }

    setContent("");
    setImage(null);
    setIsLoading(false);
  };

  return (
    <>
      <Header
        language={language}
        setLanguage={setLanguage}
        isGuest={isGuest}
        isHistoryOpen={isHistoryOpen}
        toggleHistory={toggleHistory}
      />

      <div className="pt-20" />

      {/* 履歴サイドバー */}
      {isHistoryOpen && (
        <div
          className="fixed top-20 left-4 z-20 w-80 max-h-[70vh] bg-white border-2 border-gray-300 rounded-md shadow-xl overflow-y-auto"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--foreground)",
            color: "var(--foreground)",
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold mb-4">チャット履歴</h3>
              <button
                onClick={() => {
                  // 新規スレッド
                  const tid = String(Date.now());
                  const newThread: Thread = { id: tid, title: "新規チャット", messages: [], createdAt: new Date().toISOString(), origin: "manual" };
                  setThreads((prev) => {
                    const next = [newThread, ...prev];
                    try { localStorage.setItem("chat_threads", JSON.stringify(next)); } catch {}
                    return next;
                  });
                  setCurrentThreadId(tid);
                  setChatMessages([]);
                }}
                className="px-2 py-1 bg-green-500 text-white rounded-md text-sm"
              >
                新しいチャット
              </button>
            </div>

            {threads.length === 0 ? (
              <p className="text-sm text-gray-500">履歴がありません</p>
            ) : (
              <div className="space-y-4">
                {/* 👍 category */}
                <div>
                  <p className="text-sm font-semibold">👍 ボタン</p>
                  {threads.filter((t) => t.origin === "like").length === 0 ? (
                    <p className="text-xs text-gray-500">該当なし</p>
                  ) : (
                    threads
                      .filter((t) => t.origin === "like")
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentThreadId(t.id);
                            setChatMessages(t.messages);
                            setIsHistoryOpen(false);
                          }}
                          className={`w-full text-left p-3 border rounded hover:bg-gray-100 transition ${currentThreadId === t.id ? "bg-blue-50" : ""}`}
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          <p className="font-semibold text-sm truncate">{t.title || t.messages.slice(-1)[0]?.content?.substring(0, 30) || "(無題)"}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString("ja-JP")}</p>
                        </button>
                      ))
                  )}
                </div>

                {/* 👎 category */}
                <div>
                  <p className="text-sm font-semibold">👎 ボタン</p>
                  {threads.filter((t) => t.origin === "dislike").length === 0 ? (
                    <p className="text-xs text-gray-500">該当なし</p>
                  ) : (
                    threads
                      .filter((t) => t.origin === "dislike")
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentThreadId(t.id);
                            setChatMessages(t.messages);
                            setIsHistoryOpen(false);
                          }}
                          className={`w-full text-left p-3 border rounded hover:bg-gray-100 transition ${currentThreadId === t.id ? "bg-blue-50" : ""}`}
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          <p className="font-semibold text-sm truncate">{t.title || t.messages.slice(-1)[0]?.content?.substring(0, 30) || "(無題)"}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString("ja-JP")}</p>
                        </button>
                      ))
                  )}
                </div>

                {/* その他 */}
                <div>
                  <p className="text-sm font-semibold">その他</p>
                  {threads
                    .filter((t) => !t.origin || (t.origin !== "like" && t.origin !== "dislike"))
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setCurrentThreadId(t.id);
                          setChatMessages(t.messages);
                          setIsHistoryOpen(false);
                        }}
                        className={`w-full text-left p-3 border rounded hover:bg-gray-100 transition ${currentThreadId === t.id ? "bg-blue-50" : ""}`}
                        style={{ borderColor: "var(--foreground)" }}
                      >
                        <p className="font-semibold text-sm truncate">{t.title || t.messages.slice(-1)[0]?.content?.substring(0, 30) || "(無題)"}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString("ja-JP")}</p>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* メッセージ表示領域 */}
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto pb-24">
        {chatMessages.length === 0 ? null : (
          <>
            <ChatMessageArea
              chatMessages={chatMessages}
              onLike={(index) => {
                const current = chatMessages.slice(0, index + 1);
                const tid = String(Date.now());
                const newThread: Thread = {
                  id: tid,
                  title: "分岐チャット",
                  messages: current,
                  createdAt: new Date().toISOString(),
                  origin: "like",
                };
                setThreads((prev) => {
                  const next = [newThread, ...prev];
                  try { localStorage.setItem("chat_threads", JSON.stringify(next)); } catch {}
                  return next;
                });
                setCurrentThreadId(tid);
                setChatMessages(current);
                setIsHistoryOpen(false);
              }}
              onDislike={(index) => {
                const current = chatMessages.slice(0, index + 1);
                const tid = String(Date.now());
                const newThread: Thread = {
                  id: tid,
                  title: "分岐チャット(否定)",
                  messages: current,
                  createdAt: new Date().toISOString(),
                  origin: "dislike",
                };
                setThreads((prev) => {
                  const next = [newThread, ...prev];
                  try { localStorage.setItem("chat_threads", JSON.stringify(next)); } catch {}
                  return next;
                });
                setCurrentThreadId(tid);
                setChatMessages(current);
                setIsHistoryOpen(false);
              }}
            />
            {isLoading && (
              <div className="flex gap-3 ml-8 items-center my-3">
                <p className="animate-pulse items-center justify-center">お待ちください...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 入力欄 */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col gap-2 border-t bg-white p-4">
        {image && (
          <div className="flex items-center gap-2">
            <img src={URL.createObjectURL(image)} alt="preview" className="w-24 h-24 object-cover rounded-md" />
            <button className="px-2 py-1 bg-red-500 text-white rounded-md" onClick={() => setImage(null)}>
              削除
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onClick();
              }
            }}
            className="flex-grow rounded-md border-2 p-3 resize-none"
            rows={1}
            disabled={isLoading}
            placeholder="メッセージを入力..."
          />

          <label className="w-12 h-12 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600">
            <img src="/camera.jpg" alt="画像選択" className="object-contain" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])} />
          </label>

          <button className="w-12 h-12 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600" onClick={onClick} disabled={isLoading}>
            <img src="/soushin.jpg" alt="送信" className="object-contain hidden md:block" />
          </button>
        </div>
      </div>
    </>
  );
}
