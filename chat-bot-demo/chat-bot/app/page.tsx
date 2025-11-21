"use client";
import { useState, useRef, useEffect } from "react";
import { aiResponse } from "./action";
import { IChatMessage } from "@/type";
import ChatMessageArea from "@/components/chatMessageArea";
import Header from "@/components/Header";
import Image from 'next/image';
import { useTailStore } from "@/tailStore";


const GREETING_MESSAGES = [
  {
    greeting: "こんにちは！",
    message: "何でも聞いてください!!!"
  },
  {
    greeting: "やっほー！",
    message: "どんな質問でもOKです！"
  },
  {
    greeting: "いらっしゃいませ！",
    message: "ご質問をどうぞ〜"
  },
  {
    greeting: "ハロー！",
    message: "気軽に話しかけてください！"
  },
  {
    greeting: "おかえりなさい！",
    message: "今日はどんなお話しましょうか？"
  }
];

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [randomGreeting, setRandomGreeting] = useState(GREETING_MESSAGES[0]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [language, setLanguage] = useState<"ja" | "en" | "vi">("ja");


  
  
  const {tail} = useTailStore();

  // // 最初に一度だけ system メッセージを追加
  // const systemMessage: IChatMessage = {
  //   role: "system",
  //   content: "あなたは常に日本語で回答するAIです。"
  // };


  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * GREETING_MESSAGES.length);
    setRandomGreeting(GREETING_MESSAGES[randomIndex]);
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



  // const onClick = async (content: string) => {
  //   if (!content.trim() || isLoading) return;
    const onClick = async () => {
      if (!content.trim() && !image) return;
      if (isLoading) return;
    setIsLoading(true);
    // setContent("");

    // const processedContent = content.replace(/\n/g, '  \n');
    const userMessage: IChatMessage = { role: "user", content: content };
    if (image) {
      userMessage.image = URL.createObjectURL(image); // プレビュー用
    }
    
    // setChatMessages(messagesToSend);
    setChatMessages((prev) => [...prev, userMessage]);

    let imageBase64: string | undefined;
    if (image) {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          imageBase64 = reader.result as string;
          resolve();
        };
      });
    }

    

    const systemMessage: IChatMessage = {
      role: "system",
      content:
        language === "ja"
          ? "あなたは日本語のみで回答してください。英語やベトナム語を使ってはいけません。"
          : language === "en"
          ? "You must respond only in English. Do not use Japanese or Vietnamese."
          : "Bạn chỉ được trả lời bằng Tiếng Việt. Không được dùng tiếng Nhật hay tiếng Anh.",
    };

    const messagesToSend = [systemMessage, ...chatMessages, userMessage];
// const aiText = await aiResponse(messagesToSend, tail) || "エラーが発生しました。";

    // const messagesToSend = [systemMessage,...chatMessages, userMessage];
    // const rawTest: string | null = await aiResponse(messagesToSend, tail);

  //   let assistantMessage: IChatMessage;
  //   if (rawTest) {
  //     assistantMessage = { role: "assistant", content: rawTest };
  //   } else {
  //     console.error("返答なし");
  //     assistantMessage = {
  //       role: "assistant",
  //       content: "エラーが発生しました、もう一度お試しください。",
  //     };
  //   }
  //   setChatMessages((prevMessages) => [...prevMessages, assistantMessage]);
  //   setIsLoading(false);
  // };
    // let assistantMessage: IChatMessage;const messagesToSend = [...chatMessages, userMessage];
    let aiText = await aiResponse(messagesToSend, tail);
    if (!aiText) aiText = "エラーが発生しました。";

    const assistantMessage: IChatMessage = { role: "assistant", content: aiText };
    setChatMessages((prev) => [...prev, assistantMessage]);

    // 初期化
    setContent("");
    setImage(null);
    setIsLoading(false);
  };

  return (
    <>
      <div className="relative flex min-h-screen w-screen flex-col">
        <Header language={language} setLanguage={setLanguage}/>
        <div className="pt-12"></div>
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

      <div className="fixed bottom-0 left-0 right-0 flex flex-col gap-2 border-t bg-white p-4">
        {/* 画像プレビュー */}
        {image && (
          <div className="flex items-center gap-2">
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              className="w-24 h-24 object-cover rounded-md"
            />
            <button
              className="px-2 py-1 bg-red-500 text-white rounded-md"
              onClick={() => setImage(null)}
            >
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

          {/* 画像選択ボタン */}
          <label className="w-12 h-12 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600">
            <img
              src="/camera.jpg" // 画像入力用アイコン
              alt="画像選択"
              // width={24}
              // height={24}
              className="object-contain"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setImage(e.target.files[0]);
              }}
            />
          </label>
      {/* <div 
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
        /> */}
        <button
          className="w-12 h-12 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600"
          onClick={onClick}
          disabled={isLoading}
        >
            <img 
              src="/soushin.jpg" 
              alt="送信"
              // width={24}
              // height={24}
              className="object-contain hidden md:block"
            />
          </button>
        </div>
      </div>
    </>
  );
}