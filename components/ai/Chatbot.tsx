"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatbotProps {
  page?: string;
  courseId?: string;
  courseTitle?: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! 👋 I'm Codelaunch AI. I can help you with programming, courses, projects, APIs, AI, cloud, databases, career guidance and questions about the Codelaunch platform. How can I help you today?",
};

const STORAGE_KEY = "codelaunch_ai_chat";

export default function Chatbot({
  page,
  courseId,
  courseTitle,
}: ChatbotProps) {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_MESSAGE,
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /*
   * ---------------------------------------------------------
   * LOAD PREVIOUS CHAT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (item) =>
            item &&
            typeof item.id === "string" &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
        )
      ) {
        setMessages(parsed);
      }
    } catch (err) {
      console.error("[CHATBOT] Unable to load saved chat:", err);
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * SAVE CHAT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("[CHATBOT] Unable to save chat:", err);
    }
  }, [messages]);

  /*
   * ---------------------------------------------------------
   * AUTO SCROLL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  /*
   * ---------------------------------------------------------
   * AUTO RESIZE TEXTAREA
   * ---------------------------------------------------------
   */

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      120
    )}px`;
  };

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */

  const handleSubmit = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setError("");

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedMessage,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setLoading(true);

    try {
      /*
       * Only send the recent conversation to the API.
       * This keeps requests smaller.
       */

      const conversation = updatedMessages
        .filter((message) => message.id !== "welcome")
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversation,
          context: {
            page: page || window.location.pathname,
            courseId,
            courseTitle,
          },
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to get a response from Codelaunch AI."
        );
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          data.message ||
          "I couldn't generate a response right now.",
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      console.error("[CHATBOT] Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  /*
   * ---------------------------------------------------------
   * ENTER KEY
   * ---------------------------------------------------------
   */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      void handleSubmit();
    }
  };

  /*
   * ---------------------------------------------------------
   * CLEAR CHAT
   * ---------------------------------------------------------
   */

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(
        "[CHATBOT] Unable to clear saved chat:",
        err
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * QUICK QUESTIONS
   * ---------------------------------------------------------
   */

  const quickQuestions = [
    "What can I learn at Codelaunch?",
    "Explain MERN stack",
    "How should I start learning AI?",
    "Help me choose a learning path",
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  /*
   * ---------------------------------------------------------
   * CLOSED STATE
   * ---------------------------------------------------------
   */

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Codelaunch AI"
        className="
          fixed
          bottom-5
          right-5
          z-[90]
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/15
          bg-white
          text-black
          shadow-2xl
          transition
          hover:scale-105
          hover:bg-white/90
          sm:bottom-6
          sm:right-6
        "
      >
        <div className="relative">
          <MessageCircle size={24} />

          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              h-3
              w-3
              rounded-full
              bg-emerald-400
              ring-2
              ring-white
            "
          />
        </div>
      </button>
    );
  }

  /*
   * ---------------------------------------------------------
   * OPEN CHAT WINDOW
   * ---------------------------------------------------------
   */

  return (
    <div
      className="
        fixed
        inset-x-3
        bottom-3
        z-[90]
        flex
        max-h-[calc(100dvh-24px)]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-[#090d18]
        shadow-[0_25px_80px_rgba(0,0,0,0.55)]
        sm:inset-x-auto
        sm:bottom-6
        sm:right-6
        sm:h-[680px]
        sm:max-h-[calc(100dvh-48px)]
        sm:w-[420px]
        sm:rounded-3xl
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1220] px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              text-black
            "
          >
            <Bot size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">
                Codelaunch AI
              </h3>

              <Sparkles
                size={14}
                className="shrink-0 text-white/60"
              />
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <p className="text-[11px] text-white/40">
                AI Assistant
              </p>

              {courseTitle && (
                <>
                  <span className="text-white/20">•</span>

                  <p className="max-w-[150px] truncate text-[11px] text-white/40">
                    {courseTitle}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            title="Clear chat"
            aria-label="Clear chat"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-white/35
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            <Trash2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize"
            aria-label="Minimize chatbot"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-white/35
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            <Minimize2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Close"
            aria-label="Close chatbot"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-white/35
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* =====================================================
          COURSE CONTEXT
      ====================================================== */}

      {courseTitle && (
        <div className="shrink-0 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/50" />

            <p className="truncate text-[11px] text-white/45">
              Currently learning:{" "}
              <span className="text-white/70">
                {courseTitle}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 1 && !loading && (
          <div className="mb-5">
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/25">
              Try asking
            </p>

            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() =>
                    handleQuickQuestion(question)
                  }
                  className="
                    rounded-xl
                    border
                    border-white/8
                    bg-white/[0.025]
                    px-3
                    py-2.5
                    text-left
                    text-xs
                    text-white/55
                    transition
                    hover:border-white/15
                    hover:bg-white/[0.05]
                    hover:text-white
                  "
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-white
                      text-black
                    "
                  >
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`
                    max-w-[82%]
                    rounded-2xl
                    px-3.5
                    py-2.5
                    text-sm
                    leading-6
                    ${
                      isUser
                        ? "rounded-br-md bg-white text-black"
                        : "rounded-bl-md border border-white/8 bg-white/[0.045] text-white/75"
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>

                {isUser && (
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-white/10
                      bg-white/5
                      text-white/60
                    "
                  >
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="flex gap-2.5">
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-white
                  text-black
                "
              >
                <Bot size={14} />
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  rounded-bl-md
                  border
                  border-white/8
                  bg-white/[0.045]
                  px-4
                  py-3
                "
              >
                <Loader2
                  size={15}
                  className="animate-spin text-white/50"
                />

                <span className="text-xs text-white/35">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="shrink-0 border-t border-red-500/10 bg-red-500/5 px-4 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs leading-5 text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-300/50 hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          INPUT
      ====================================================== */}

      <div className="shrink-0 border-t border-white/10 bg-[#0c1220] p-3">
        <form onSubmit={handleSubmit}>
          <div
            className="
              flex
              items-end
              gap-2
              rounded-2xl
              border
              border-white/10
              bg-white/[0.035]
              p-2
              transition
              focus-within:border-white/20
            "
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                resizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Codelaunch AI..."
              rows={1}
              disabled={loading}
              maxLength={4000}
              className="
                max-h-[120px]
                min-h-[40px]
                flex-1
                resize-none
                overflow-y-auto
                bg-transparent
                px-2
                py-2.5
                text-sm
                leading-5
                text-white
                outline-none
                placeholder:text-white/25
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                text-black
                transition
                hover:bg-white/90
                disabled:cursor-not-allowed
                disabled:opacity-25
              "
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>
        </form>

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[10px] text-white/20">
            Enter to send · Shift + Enter for new line
          </p>

          <p className="text-[10px] text-white/20">
            AI can make mistakes
          </p>
        </div>
      </div>
    </div>
  );
}