"use client";
import type { IChatMessage } from "@/type";
import Image from "next/image";
import aiIcon from '../public/ai.png';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";

interface IProps1 {
  translate: string, 
  isClicked : boolean, 
  handleOnClick : () => void, 
  disabled : boolean
}
const LikeButton = ({translate, isClicked, handleOnClick, disabled } : IProps1) => {
  const buttonClassName = isClicked
    ? "rounded-md border-1 bg-blue-500 p-1 font-semibold text-red"
    : "float-right-3 rounded-md border-1 bg-white-400 p-1 hover:bg-blue-200";

   return (
    <div className="relative group">
      <button
        className={buttonClassName}
        onClick={handleOnClick}
        disabled={disabled}
      >
        👍
      </button>
      {}
      <div className="absolute top-1 left-1 -translate-x-1/2 -translate-y-full mt-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {translate}
      </div>
    </div>
  );
};
const DislikeButton = ({ translate, isClicked, handleOnClick, disabled } : IProps1) => {
  const buttonClassName = isClicked
    ? "rounded-md border-1 bg-blue-500 p-1 font-semibold text-red"
    : "rounded-md border-1 bg-white-400 p-1 hover:bg-blue-200";

  return (
    <div className="relative group">
      <button
        className={buttonClassName}
        onClick={handleOnClick}
        disabled={disabled}
      >
        👎
      </button>
      {}
      <div className="absolute top-1 left-1 -translate-x-1/2 -translate-y-full mt-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {translate}
      </div>
    </div>
  );
};
const CopyButton = ({ translate, handleOnClick }: { translate: string, handleOnClick: () => void }) => {
  return (
    <div className="relative group">
      <button
        className="rounded-md border-1 bg-white-400 p-1 hover:bg-blue-200"
        onClick={handleOnClick}
      >
        📄
      </button>
      {}
      <div className="absolute top-1 left-1 -translate-x-1/2 -translate-y-full mt-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {translate}
      </div>
    </div>
  );
};

const SpeakButton = ({ translate, text, language }: { translate: string; text: string; language: "ja" | "en" | "vi" }) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("このブラウザは音声読み上げに対応していません");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    // utterance.lang = "ja-JP"; // 必要に応じて言語切替可能
    switch (language) {
      case "ja":
        utterance.lang = "ja-JP";
        break;
      case "en":
        utterance.lang = "en-US";
        break;
      case "vi":
        utterance.lang = "vi-VN";
        break;
    }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <div className="relative group">
      <button className="rounded-md border bg-white p-1 hover:bg-blue-200" onClick={handleSpeak}>
        🔊
      </button>
      <div className="absolute top-1 left-1 -translate-x-1/2 -translate-y-full mt-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {speaking ? "読み上げ中..." : translate}
      </div>
    </div>
  );
};


interface IProps {
  chatMessage: IChatMessage;
  // index of message in current thread (optional)
  index?: number;
  onLike?: (index: number) => void;
  onDislike?: (index: number) => void;
  language: "ja" | "en" | "vi";
}
const ChatMessage = ({ chatMessage, index = 0, onLike, onDislike }: IProps) => {
  const [likeClicked, setLikeClicked] = useState<boolean>(false);
  const [dislikeClicked, setDislikeClicked] = useState<boolean>(false);

  const handleLikeClick = () => {
    setLikeClicked(true);
    setDislikeClicked(false);
    if (typeof onLike === "function") onLike(index);
  };

  const handleDislikeClick = () => {
    setDislikeClicked(true);
    setLikeClicked(false);
    if (typeof onDislike === "function") onDislike(index);
  };
  const handleCopyClick = () => {
    navigator.clipboard.writeText(chatMessage.content);
  };

  return (
    <div className="">
      {chatMessage.role === "user" ? (
        <div className="rounded-sm bg-gray-300/30 p-1 mr-3 dark:bg-gray-700/30 dark:text-gray-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {chatMessage.content}
          </ReactMarkdown>

          {chatMessage.image && (
            <img
              src={chatMessage.image}
              alt="uploaded"
              className="mt-2 rounded-md max-w-[200px] border"
            />
          )}
        </div>
      ) : (
        
        <>
        <div className="flex gap-2 items-start">
          <div className="rounded-4xl bg-blue-800" />
          <Image 
                src={aiIcon} 
                alt="AI icon" 
                width={20} 
                height={20} 
                className="rounded-full flex-shrink-0" 
          />
          <div className="rounded-sm bg-blue-300/30 p-1 dark:bg-blue-700/30 dark:text-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {chatMessage.content}
            </ReactMarkdown>

            {chatMessage.image && (
              <img
                src={chatMessage.image}
                alt="ai uploaded"
                className="mt-2 rounded-md max-w-[200px] border"
              />
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <LikeButton
            translate="いいね"
            isClicked={likeClicked}
            handleOnClick={handleLikeClick}
            disabled={dislikeClicked}
          />
          <DislikeButton
            translate="よくない"
            isClicked={dislikeClicked}
            handleOnClick={handleDislikeClick}
            disabled={likeClicked}
          />
          <CopyButton 
            translate="コピー"
            handleOnClick={handleCopyClick} 
          />
          <SpeakButton 
            translate="読み上げ" 
            text={chatMessage.content} />
        </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;