"use client";
import React, { useEffect } from "react";

export default function RegisterRedirect() {
  useEffect(() => {
    // 既存の PHP 登録ページへリダイレクト
    window.location.href = "http://localhost/AI-chatbot/root/register.php";
  }, []);

  return (
    <main className="p-8 text-center">
      <p className="mb-4">登録ページへリダイレクトしています...</p>
      <p>
        リダイレクトされない場合は <a href="http://localhost/AI-chatbot/root/register.php">こちら</a> をクリックしてください。
      </p>
    </main>
  );
}
