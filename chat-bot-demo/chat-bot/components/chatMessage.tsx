"use client";
import type { IChatMessage } from "@/type";
import Image from "next/image";
import aiIcon from "../public/ai.png";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* =====================
   共通ボタンコンポーネント
===================== */
interface ButtonProps {
  translate: string;
  isActive?: boolean;
  onClick: () => void;
  icon: string;
}

const IconButton = ({ translate, isActive, onClick, icon }: ButtonProps) => {
  return (
    <div className="relative group">
      <button
        className={`rounded-md border p-1 transition
          ${isActive ? "bg-blue-500 text-white" : "bg-white hover:bg-blue-200"}
        `}
        onClick={onClick}
      >
        {icon}
      </button>
      <div className="absolute top-1 left-1 -translate-x-1/2 -translate-y-full mt-1 px-2 py-1
        bg-gray-500 text-white text-xs rounded-md opacity-0 group-hover:opacity-100">
        {translate}
      </div>
    </div>
  );
};

/* =====================
   読み上げボタン
===================== */
const SpeakButton = ({
  text,
  language,
}: {
  text: string;
  language: "ja" | "en" | "vi";
}) => {
  const [speaking, setSpeaking] = useState(false);

  const langMap = {
    ja: "ja-JP",
    en: "en-US",
    vi: "vi-VN",
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[language];

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <IconButton
      icon={speaking ? "⏹" : "🔊"}
      translate={speaking ? "停止" : "読み上げ"}
      isActive={speaking}
      onClick={handleSpeak}
    />
  );
};

/* =====================
   ChatMessage
===================== */
interface Props {
  chatMessage: IChatMessage;
  index?: number;
  language?: "ja" | "en" | "vi";
  onReactionChange?: (index: number, reaction: "like" | "dislike" | null) => void;
  onLike?: (index: number) => void;
  onDislike?: (index: number) => void;
}

const ChatMessage = ({
  chatMessage,
  index = 0,
  language,
  onReactionChange,
  onLike,
  onDislike,
}: Props) => {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);

  const toggleReaction = (type: "like" | "dislike") => {
    const next = reaction === type ? null : type;
    setReaction(next);
    onReactionChange?.(index, next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chatMessage.content);
  };

  return (
    <div>
      {chatMessage.role === "user" ? (
        <div className="rounded-sm bg-gray-300/30 p-1 mr-3 dark:bg-gray-700/30">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {chatMessage.content}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          <div className="flex gap-2 items-start">
            <Image src={aiIcon} alt="AI" width={20} height={20} />
            <div className="rounded-sm bg-blue-300/30 p-1 dark:bg-blue-700/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {chatMessage.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-2 mt-2">
            <IconButton
              icon="👍"
              translate="いいね"
              isActive={reaction === "like"}
              onClick={() => {
                toggleReaction("like");
                if (typeof index === "number") onLike?.(index);
              }}
            />

            <IconButton
              icon="👎"
              translate="よくない"
              isActive={reaction === "dislike"}
              onClick={() => {
                toggleReaction("dislike");
                if (typeof index === "number") onDislike?.(index);
              }}
            />

            <IconButton
              icon="📄"
              translate="コピー"
              onClick={handleCopy}
            />

            <SpeakButton
              text={chatMessage.content}
              language={language ?? "ja"}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
