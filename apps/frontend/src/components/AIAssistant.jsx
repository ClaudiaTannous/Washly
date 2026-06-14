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
  Plus,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { getAIConversation, sendAIMessage } from "../lib/apiClient";

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function initConversation() {
      try {
        const res = await getAIConversation(workerId);
        setConversationId(res.id);
        setIsReady(true);
      } catch (err) {
        console.error("Failed to init AI conversation:", err);
      }
    }

    if (workerId) {
      initConversation();
    }
  }, [workerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleImageUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    setSelectedImage(null);
    setPreviewUrl(null);
  }

  async function handleSend() {
    if ((!input.trim() && !selectedImage) || isTyping || !conversationId) {
      return;
    }

    const text = input.trim();

    // Save image before clearing it
    const imageToSend = selectedImage;
    const imageUrlForMessage = previewUrl;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: text || "Image uploaded",
        image: imageUrlForMessage,
        timestamp: new Date(),
      },
    ]);

    // Clear input area immediately
    setInput("");
    removeImage();
    setIsTyping(true);

    try {
      const res = await sendAIMessage(conversationId, text, imageToSend);

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
      console.error("AI send failed:", err);

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
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestedPrompt(text) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
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

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-36">
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {previewUrl && (
            <div className="mb-3 flex w-fit items-center gap-3 rounded-2xl border bg-white px-3 py-2 shadow-sm">
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="h-14 w-14 rounded-xl object-cover border"
              />

              <div className="max-w-[200px]">
                <p className="truncate text-sm font-medium text-slate-700">
                  {selectedImage?.name}
                </p>
                <p className="text-xs text-slate-400">Ready to send</p>
              </div>

              <button
                onClick={removeImage}
                className="rounded-full px-2 text-lg text-slate-400 hover:bg-slate-100 hover:text-red-500"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-3xl border bg-white px-3 py-3 shadow-lg">
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-slate-50 text-slate-600 transition hover:bg-slate-100">
              <Plus className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                isReady ? "Message Washly AI..." : "Connecting to AI..."
              }
              disabled={!isReady}
              className="border-0 shadow-none focus-visible:ring-0 py-6"
            />

            <Button
              onClick={handleSend}
              disabled={
                !isReady || isTyping || (!input.trim() && !selectedImage)
              }
              className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          {message.image && (
            <img
              src={message.image}
              alt="Uploaded"
              className="mb-3 max-h-64 rounded-xl border object-cover"
            />
          )}

          {message.content}
        </div>
      </div>
    </div>
  );
}
