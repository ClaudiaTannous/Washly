"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  Clock,
  DollarSign,
  X,
  Sparkles,
} from "lucide-react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

import { getAIConversation, sendAIMessage } from "../lib/apiClient";

/* ---------------- SUGGESTED PROMPTS ---------------- */

const suggestedPrompts = [
  {
    icon: TrendingUp,
    text: "How can I improve my rating?",
    category: "Performance",
  },
  {
    icon: Clock,
    text: "What are the best times to accept orders?",
    category: "Strategy",
  },
  {
    icon: DollarSign,
    text: "How do I increase my earnings?",
    category: "Earnings",
  },
  {
    icon: Lightbulb,
    text: "Tips for handling difficult stains",
    category: "Skills",
  },
];

/* ---------------- COMPONENT ---------------- */

export function AIAssistant({ workerId, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. I'm here to help you succeed as a laundry service provider.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ---------------- DEBUG: PROPS ---------------- */

  useEffect(() => {
    console.log("🟦 AIAssistant mounted");
    console.log("🟦 workerId:", workerId);
  }, [workerId]);

  /* ---------------- INIT CONVERSATION ---------------- */

  useEffect(() => {
    async function initConversation() {
      try {
        console.log("🟨 initConversation() called");
        console.log("🟨 calling getAIConversation with workerId:", workerId);

        const res = await getAIConversation(workerId);

        console.log("🟩 getAIConversation response:", res);

        setConversationId(res.id);
        setIsReady(true);

        console.log("🟩 conversationId set to:", res.id);
        console.log("🟩 isReady set to true");
      } catch (err) {
        console.error("🟥 Failed to init AI conversation:", err);
      }
    }

    if (workerId) {
      initConversation();
    } else {
      console.warn("🟧 initConversation skipped — workerId is falsy");
    }
  }, [workerId]);

  /* ---------------- DEBUG: STATE ---------------- */

  useEffect(() => {
    console.log("🟦 STATE UPDATE → conversationId:", conversationId);
  }, [conversationId]);

  useEffect(() => {
    console.log("🟦 STATE UPDATE → isReady:", isReady);
  }, [isReady]);

  /* ---------------- AUTO SCROLL ---------------- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ---------------- SEND MESSAGE ---------------- */

  async function handleSend() {
    console.log("➡️ CLICK SEND");
    console.log("➡️ input:", input);
    console.log("➡️ isTyping:", isTyping);
    console.log("➡️ conversationId:", conversationId);
    console.log("➡️ isReady:", isReady);

    if (!input.trim()) {
      console.warn("⛔ SEND BLOCKED: input empty");
      return;
    }

    if (isTyping) {
      console.warn("⛔ SEND BLOCKED: already typing");
      return;
    }

    if (!conversationId) {
      console.error("⛔ SEND BLOCKED: conversationId is null");
      return;
    }

    const text = input.trim();

    console.log("🟩 SENDING MESSAGE:", text);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      console.log("🟨 calling sendAIMessage()");
      const res = await sendAIMessage(conversationId, text);
      console.log("🟩 sendAIMessage response:", res);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: res.reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("🟥 AI send failed:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      console.log("🟦 isTyping reset to false");
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestedPrompt(text) {
    console.log("🟦 Suggested prompt clicked:", text);
    setInput(text);
    inputRef.current?.focus();
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white px-6 py-6 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-white/90 text-sm">
                Your personal laundry business coach
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#26c6da] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#26c6da] rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-[#26c6da] rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isReady ? "Ask me anything..." : "Connecting to AI..."}
            disabled={!isReady}
            className="py-6 rounded-2xl"
          />
          <Button
            onClick={handleSend}
            disabled={!isReady || !input.trim() || isTyping}
            className="px-6 py-6 rounded-2xl bg-gradient-to-r from-[#4dd0e1] to-[#26c6da]"
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MESSAGE BUBBLE ---------------- */

function MessageBubble({ message }) {
  const isAI = message.role === "assistant";

  return (
    <div className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isAI
            ? "bg-gradient-to-br from-[#4dd0e1] to-[#26c6da]"
            : "bg-slate-700"
        }`}
      >
        {isAI ? (
          <Bot className="text-white" />
        ) : (
          <User className="text-white" />
        )}
      </div>

      <div className={`max-w-2xl ${isAI ? "" : "text-right"}`}>
        <div
          className={`px-5 py-4 rounded-2xl shadow ${
            isAI
              ? "bg-white border"
              : "bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
