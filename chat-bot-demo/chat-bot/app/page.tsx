"use client";
import { useState, useRef, useEffect } from "react";
import { aiResponse } from "./action";
import { IChatMessage } from "@/type";
import ChatMessageArea from "@/components/chatMessageArea";
import Header from "@/components/Header";

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<Array<{id: number, preview: string, date: string}>>([]);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // ゲスト利用かどうかを判定（クエリ or Cookie）
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
    const fromQuery = params?.get('guest') === '1';
    const fromCookie = typeof document !== 'undefined' && document.cookie.split('; ').some((c) => c.startsWith('chat_guest=1'));
    setIsGuest(Boolean(fromQuery || fromCookie));
  }, []);

  // 初回に履歴を読み込む
  useEffect(() => {
    if (isGuest) return; // ゲストは履歴を読み込まない
    const loadHistory = async () => {
      try {
        const resp = await fetch("http://localhost/AI-chatbot/root/chat_history.php?limit=50", {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" },
        });
        if (!resp.ok) return; // 未ログインやエラー時はスキップ（middlewareが守る想定）
        const data = await resp.json();
        if (Array.isArray(data?.items)) {
          // DBは古い順で返却している想定
          const restored: IChatMessage[] = data.items.map((it: any) => ({
            role: it.role === "assistant" ? "assistant" : "user",
            content: String(it.content ?? ""),
          }));
          setChatMessages(restored);

          // 履歴リスト用にユーザー発言でグルーピング（簡易版: 最初のユーザー発言を取得）
          const grouped: Array<{id: number, preview: string, date: string}> = [];
          for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (item.role === 'user') {
              const preview = String(item.content).substring(0, 30) + (String(item.content).length > 30 ? '...' : '');
              grouped.push({
                id: i,
                preview,
                date: item.created_at || '',
              });
            }
          }
          setHistoryList(grouped);
        }
      } catch (e) {
        console.error("履歴読み込みに失敗:", e);
      }
    };
    loadHistory();
  }, [isGuest]);

  const saveMessage = async (msg: IChatMessage) => {
    if (isGuest) return; // ゲストは保存しない
    try {
      await fetch("http://localhost/AI-chatbot/root/chat_history.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
    } catch (e) {
      console.error("履歴保存に失敗:", e);
    }
  };

  const onClick = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setContent("");
    const processedContent = content.replace(/\n/g, '  \n');
    const userMessage: IChatMessage = { role: "user", content: processedContent };
    const messagesToSend = [...chatMessages, userMessage];
    setChatMessages(messagesToSend);
    // 保存: ユーザーメッセージ
    saveMessage(userMessage);

    const rawTest: string | null = await aiResponse(messagesToSend);

    let assistantMessage: IChatMessage;
    if (rawTest) {
      assistantMessage = { role: "assistant", content: rawTest };
    } else {
      console.error("返答なし");
      assistantMessage = {
        role: "assistant",
        content: "エラーが発生しました、もう一度お試しください。",
      };
    }
    setChatMessages((prevMessages) => [...prevMessages, assistantMessage]);
    // 保存: アシスタントメッセージ
    saveMessage(assistantMessage);
    setIsLoading(false);
  };

  return (
    <>
      <div className="relative flex min-h-screen w-screen flex-col">
        <Header />
        
        {/* 履歴ボタン（ゲストは非表示）*/}
        {!isGuest && (
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="fixed top-16 left-4 z-20 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-lg"
          >
            {isHistoryOpen ? '履歴を閉じる' : '履歴を表示'}
          </button>
        )}

        {/* 履歴サイドバー */}
        {!isGuest && isHistoryOpen && (
          <div className="fixed top-28 left-4 z-20 w-80 max-h-[70vh] bg-white border-2 border-gray-300 rounded-md shadow-xl overflow-y-auto"
               style={{
                 backgroundColor: 'var(--background)',
                 borderColor: 'var(--foreground)',
                 color: 'var(--foreground)',
               }}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4">チャット履歴</h3>
              {historyList.length === 0 ? (
                <p className="text-sm text-gray-500">履歴がありません</p>
              ) : (
                <div className="space-y-2">
                  {historyList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        // 履歴をクリックしたら再読み込み（簡易版: 全履歴を再取得）
                        setIsHistoryOpen(false);
                      }}
                      className="w-full text-left p-3 border rounded hover:bg-gray-100 transition"
                      style={{
                        borderColor: 'var(--foreground)',
                      }}
                    >
                      <p className="font-semibold text-sm truncate">{item.preview}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString('ja-JP')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-12"></div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto pb-24">
          {chatMessages.length === 0 ? (
            <div className="bg-gray-200/80 m-12 round-2xl flex items-center justify-center p-10 text-3xl">
              <p>こんにちは！</p>
              <p>何でも聞いてください!!!</p>
            </div>
          ) : (
            <>
              <ChatMessageArea chatMessages={chatMessages} />
              {isLoading && (
                <div className="flex gap-3 ml-8 items-center my-3">
                  <p className="animate-pulse items-center justify-center">
                    お待ちください...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t bg-white p-4"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--foreground)',
          color: 'var(--foreground)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onClick(content);
            }
          }}
          className="flex-grow rounded-md border-2 p-3 font-semibold resize-none"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--foreground)',
            color: 'var(--foreground)',
          }}
          rows={1}
          disabled={isLoading}
        />
        <button
          className={`rounded-md border-2 p-3 font-semibold text-white ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={() => onClick(content)}
          disabled={isLoading}
        >
          送信
        </button>
      </div>
    </>
  );
}