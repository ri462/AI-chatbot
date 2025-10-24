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

  const onClick = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setContent("");
    const processedContent = content.replace(/\n/g, '  \n');
    const userMessage: IChatMessage = { role: "user", content: processedContent };
    const messagesToSend = [...chatMessages, userMessage];
    setChatMessages(messagesToSend);

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
    setIsLoading(false);
  };

  return (
    <>
      <div className="relative flex min-h-screen w-screen flex-col">
        <Header />
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