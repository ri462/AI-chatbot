"use client";
import { useState, useRef, useEffect } from "react";
import { aiResponse } from "./action";
import { IChatMessage } from "@/type";
import ChatMessageArea from "@/components/chatMessageArea";
import Header from "@/components/Header";
import { useTailStore } from "@/tailStore";

const GREETING_MESSAGES = [
  { greeting: "こんにちは！", message: "何でも聞いてください!!!" },
  { greeting: "やっほー！", message: "どんな質問でもOKです！" },
  { greeting: "いらっしゃいませ！", message: "ご質問をどうぞ〜" },
  { greeting: "ハロー！", message: "気軽に話しかけてください！" },
  { greeting: "おかえりなさい！", message: "今日はどんなお話しましょうか？" },
];

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<Array<{ id: number; preview: string; date: string }>>([]);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [language, setLanguage] = useState<"ja" | "en" | "vi">("ja");
  const [randomGreeting, setRandomGreeting] = useState(GREETING_MESSAGES[0]);
  // thread-based chats
  type Thread = { id: string; title: string; messages: IChatMessage[]; createdAt: string; origin?: "like" | "dislike" | "manual" };
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { tail } = useTailStore();

  useEffect(() => {
    setRandomGreeting(GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)]);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("guest") === "1";
    const fromCookie = document.cookie.split("; ").some((c) => c.startsWith("chat_guest=1"));
    setIsGuest(Boolean(fromQuery || fromCookie));
  }, []);

  useEffect(() => {
    if (isGuest) return;
    const loadHistory = async () => {
      try {
        // try loading saved threads from localStorage first
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

        const resp = await fetch("http://localhost/AI-chatbot/root/chat_history.php?limit=50", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (Array.isArray(data?.items)) {
          const restored: IChatMessage[] = data.items.map((it: any) => ({
            role: it.role === "assistant" ? "assistant" : "user",
            content: String(it.content ?? ""),
          }));
          // create a default thread
          const tid = String(Date.now());
          const thread: Thread = { id: tid, title: "デフォルト", messages: restored, createdAt: new Date().toISOString() };
          setThreads([thread]);
          setCurrentThreadId(tid);
          setChatMessages(restored);
        }
      } catch (e) {
        console.error("履歴読み込みに失敗:", e);
      }
    };
    loadHistory();
  }, [isGuest]);

  const saveMessage = async (msg: IChatMessage) => {
    if (isGuest) return;
    try {
      // post to server for existing behaviour (fire-and-forget)
      fetch("http://localhost/AI-chatbot/root/chat_history.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      }).catch(() => {});

      // persist to current thread and localStorage
      if (currentThreadId) {
        setThreads((prev) => {
          const next = prev.map((t) => (t.id === currentThreadId ? { ...t, messages: [...t.messages, msg] } : t));
          try {
            localStorage.setItem("chat_threads", JSON.stringify(next));
          } catch (e) {}
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

    let imageBase64: string | undefined;
    if (image) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(image);
      });
    }

    const userMessage: IChatMessage = {
      role: "user",
      // Do NOT append the `tail` to user messages — apply tails only to AI responses
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

    // build messages from current thread (so context is per-thread)
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
      <div className="relative flex min-h-screen w-screen flex-col">
        <Header language={language} setLanguage={setLanguage} />

        {!isGuest && (
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="fixed top-16 left-4 z-20 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-lg"
          >
            {isHistoryOpen ? "履歴を閉じる" : "履歴を表示"}
          </button>
        )}

        {!isGuest && isHistoryOpen && (
          <div
            className="fixed top-28 left-4 z-20 w-80 max-h-[70vh] bg-white border-2 border-gray-300 rounded-md shadow-xl overflow-y-auto"
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
                    // create new empty thread
                    const tid = String(Date.now());
                    const newThread = { id: tid, title: "新規チャット", messages: [], createdAt: new Date().toISOString(), origin: "manual" } as Thread;
                    setThreads((prev) => {
                      const next = [newThread, ...prev];
                      try {
                        localStorage.setItem("chat_threads", JSON.stringify(next));
                      } catch {}
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
                <div className="space-y-2">
                  {/* 👍 category */}
                  <div className="mb-2">
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
                  <div className="mb-2">
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

        <div className="pt-20" />

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto pb-24">
          {chatMessages.length === 0 ? (
            <div className="bg-gray-200/80 m-12 round-2xl flex items-center justify-center p-10 text-3xl">
              <div className="flex flex-col items-center gap-2">
                <p>{randomGreeting.greeting}</p>
                <p>{randomGreeting.message}</p>
              </div>
            </div>
          ) : (
            <>
              <ChatMessageArea
                chatMessages={chatMessages}
                onLike={(index) => {
                  // create a new thread from messages up to clicked index
                  const current = chatMessages.slice(0, index + 1);
                  const tid = String(Date.now());
                  const newThread = { id: tid, title: "分岐チャット", messages: current, createdAt: new Date().toISOString(), origin: "like" } as Thread;
                  setThreads((prev) => {
                    const next = [newThread, ...prev];
                    try {
                      localStorage.setItem("chat_threads", JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                  setCurrentThreadId(tid);
                  setChatMessages(current);
                  setIsHistoryOpen(false);
                }}
                onDislike={(index) => {
                  // similar behavior for dislike
                  const current = chatMessages.slice(0, index + 1);
                  const tid = String(Date.now());
                  const newThread = { id: tid, title: "分岐チャット(否定)", messages: current, createdAt: new Date().toISOString(), origin: "dislike" } as Thread;
                  setThreads((prev) => {
                    const next = [newThread, ...prev];
                    try {
                      localStorage.setItem("chat_threads", JSON.stringify(next));
                    } catch {}
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
      </div>

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