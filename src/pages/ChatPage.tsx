// src/pages/ChatPage.tsx
import React from "react";
import { useAuth } from "../lib/auth";
import ForumChatSystem from "../components/chatroom/ForumChatSystem";

export default function ChatPage() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <ForumChatSystem />
    </div>
  );
}