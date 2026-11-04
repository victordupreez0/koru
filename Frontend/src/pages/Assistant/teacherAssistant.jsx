import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Trash2, Copy, Check, Plus, MessageSquare,
  GraduationCap, BookOpen, ShieldCheck, PanelLeft,
} from "lucide-react";

import Orb from "../../components/UI/Orb";
import AssistantInput from "../../components/assistantInput";
import HeaderTopBar from "../../components/HeaderTopBar";
import { getAssistantResponse } from "../../services/assistantService";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, Badge, Button, Alert } from "../../components/UI";

// ─── Persistence helpers ──────────────────────────────────────────────────────

const chatsKey = (uid) => `koru.chats.${uid || "guest"}`;

function loadChats(uid) {
  try { return JSON.parse(localStorage.getItem(chatsKey(uid)) || "[]"); }
  catch { return []; }
}

function saveChats(uid, chats) {
  try { localStorage.setItem(chatsKey(uid), JSON.stringify(chats)); }
  catch {}
}

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

// ─── Role configuration ───────────────────────────────────────────────────────

const ROLE_CONFIG = {
  student: {
    label: "Student",
    Icon: GraduationCap,
    badgeVariant: "info",
    subtitle: "What are we studying today?",
    chips: [
      { label: "Explain a concept",   message: "Can you explain a key concept from one of my current courses?" },
      { label: "Help with assignment", message: "I need help understanding the requirements for one of my assignments." },
      { label: "My current grades",   message: "Can you summarise my current grades and how I am doing overall?" },
      { label: "Build a study plan",  message: "Help me build a study plan for the rest of this semester." },
    ],
  },
  teacher: {
    label: "Teacher",
    Icon: BookOpen,
    badgeVariant: "primary",
    subtitle: "Where should we start?",
    chips: [
      { label: "Analyse class performance", message: "Analyse my class performance and highlight any areas of concern." },
      { label: "Plan next week",            message: "Help me plan next week's lessons and activities for my courses." },
      { label: "Draft student feedback",    message: "Draft constructive and encouraging feedback for a student who needs support." },
      { label: "Generate timetable",        message: "Generate a structured weekly timetable for my course." },
    ],
  },
  admin: {
    label: "Administrator",
    Icon: ShieldCheck,
    badgeVariant: "warning",
    subtitle: "What can I help you with?",
    chips: [
      { label: "Platform overview",    message: "Give me an overview of the platform's current performance and activity." },
      { label: "At-risk students",     message: "Help me identify students who may be at risk based on grades and attendance." },
      { label: "Performance trends",   message: "Analyse academic performance trends across all courses and cohorts." },
      { label: "Generate a report",    message: "Create a comprehensive progress report for all active courses." },
    ],
  },
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMessageContent(content) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = [];
  let currentListType = null;
  let inCodeBlock = false;
  let codeBlockContent = [];

  const flushList = (key) => {
    if (currentList.length === 0) return;
    const Tag = currentListType === "ul" ? "ul" : "ol";
    elements.push(
      <Tag
        key={`list-${key}`}
        className={`${currentListType === "ul" ? "list-disc" : "list-decimal"} pl-5 my-2 space-y-1 text-koru-on-surface-variant`}
      >
        {currentList.map((item, i) => (
          <li key={i} className="leading-relaxed text-sm">{parseInline(item)}</li>
        ))}
      </Tag>
    );
    currentList = [];
    currentListType = null;
  };

  const parseInline = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1)
        return <strong key={i} className="font-medium text-koru-on-surface">{part}</strong>;
      const sub = part.split(/\*([^*]+)\*/g);
      return sub.map((s, j) => {
        if (j % 2 === 1) return <em key={j} className="italic text-koru-on-surface-variant">{s}</em>;
        const code = s.split(/`([^`]+)`/g);
        return code.map((c, k) =>
          k % 2 === 1 ? (
            <code key={k} className="px-1.5 py-0.5 rounded-koru-sm bg-koru-primary-container text-koru-on-primary-container text-[0.8em] font-mono">
              {c}
            </code>
          ) : c
        );
      });
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="p-4 rounded-koru-lg bg-koru-inverse-surface text-koru-inverse-on-surface text-xs font-mono my-3 overflow-x-auto select-all">
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) { codeBlockContent.push(line); continue; }

    if (line.startsWith("### ")) {
      flushList(i);
      elements.push(<h4 key={`h4-${i}`} className="font-display text-sm font-medium text-koru-on-surface mt-4 mb-1.5">{parseInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList(i);
      elements.push(<h3 key={`h3-${i}`} className="font-display text-base font-medium text-koru-on-surface mt-4 mb-2">{parseInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith("# ")) {
      flushList(i);
      elements.push(<h2 key={`h2-${i}`} className="font-display text-lg font-medium text-koru-on-surface mt-5 mb-2">{parseInline(line.slice(2))}</h2>);
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (currentListType && currentListType !== "ul") flushList(i);
      currentListType = "ul";
      currentList.push(line.trim().slice(2));
      continue;
    }
    const olMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (olMatch) {
      if (currentListType && currentListType !== "ol") flushList(i);
      currentListType = "ol";
      currentList.push(olMatch[2]);
      continue;
    }
    if (line.trim() === "") { flushList(i); continue; }

    flushList(i);
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-sm text-koru-on-surface-variant my-1">{parseInline(line)}</p>
    );
  }
  flushList(lines.length);
  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherAssistant() {
  const { user } = useAuth();
  const userId   = user?.userId;
  const role     = (user?.role || "teacher").toLowerCase();
  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "";
  const config   = ROLE_CONFIG[role] || ROLE_CONFIG.teacher;
  const { Icon: RoleIcon, label: roleLabel, badgeVariant, subtitle, chips } = config;

  // Chat history persisted in localStorage
  const [chats, setChats]             = useState(() => loadChats(userId));
  const [activeChatId, setActiveChatId] = useState(() => loadChats(userId)[0]?.id ?? null);

  const [isTyping, setIsTyping]       = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);

  const scrollRef = useRef(null);

  // Derived: messages of the currently selected conversation
  const activeMessages = useMemo(
    () => chats.find((c) => c.id === activeChatId)?.messages ?? [],
    [chats, activeChatId]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isTyping]);

  // Persist whenever chats change
  useEffect(() => {
    saveChats(userId, chats);
  }, [chats, userId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    const id = genId();
    const chat = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
  }, []);

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const handleDeleteChat = useCallback(
    (e, id) => {
      e.stopPropagation();
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      if (activeChatId === id) {
        setActiveChatId(remaining[0]?.id ?? null);
      }
    },
    [chats, activeChatId]
  );

  const handleClearActive = useCallback(() => {
    if (!activeChatId) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [], title: "New conversation", updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, [activeChatId]);

  const handleSend = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      // Resolve or create an active chat
      let chatId = activeChatId;
      let currentChats = chats;

      if (!chatId || !currentChats.find((c) => c.id === chatId)) {
        chatId = genId();
        const newChat = {
          id: chatId,
          title: text.slice(0, 50),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        currentChats = [newChat, ...chats];
        setChats(currentChats);
        setActiveChatId(chatId);
      }

      const chat     = currentChats.find((c) => c.id === chatId);
      const prevMsgs = chat?.messages ?? [];
      const title    = prevMsgs.length === 0 ? text.slice(0, 50) : (chat?.title ?? "Conversation");
      const withUser = [...prevMsgs, { role: "user", content: text }];

      // Helper: patch the target chat with new messages
      const patch = (msgs) => (prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, title, messages: msgs, updatedAt: new Date().toISOString() }
            : c
        );

      setChats(patch(withUser));
      setIsTyping(true);

      try {
        const res = await getAssistantResponse(withUser, user?.userId, user?.role);
        setChats(patch([...withUser, { role: "assistant", content: res.content }]));
      } catch (err) {
        setChats(
          patch([...withUser, { role: "error", content: err.message || "An unexpected error occurred." }])
        );
      } finally {
        setIsTyping(false);
      }
    },
    [activeChatId, chats, user]
  );

  const handleCopy = useCallback((text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col overflow-hidden transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full md:bg-koru-surface-container-lowest md:rounded-koru-lg md:shadow-koru-md max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 max-md:bg-transparent text-koru-on-surface">

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pr-4 border-b border-koru-outline-faint bg-koru-surface-container-lowest shrink-0">
        <div className="flex items-center gap-1 flex-1">
          <Button
            variant="text"
            size="icon"
            onClick={() => setSidebarOpen((o) => !o)}
            className="ml-2"
            aria-label="Toggle conversation history"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <HeaderTopBar />
          </div>
        </div>

        <AnimatePresence>
          {activeMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="mr-1"
            >
              <Button
                variant="outlined"
                size="sm"
                onClick={handleClearActive}
                startIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear chat
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Body (sidebar + main) ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 248, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="shrink-0 bg-koru-surface-container-lowest border-r border-koru-outline-faint flex flex-col overflow-hidden z-10"
            >
              {/* New conversation */}
              <div className="p-3 pb-2">
                <Button
                  variant="tonal"
                  fullWidth
                  onClick={handleNewChat}
                  startIcon={<Plus className="w-4 h-4 shrink-0" />}
                >
                  New conversation
                </Button>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-px">
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-36 gap-2 text-koru-outline select-none">
                    <MessageSquare className="w-7 h-7" />
                    <p className="text-xs font-medium">No conversations yet</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      layout
                      onClick={() => handleSelectChat(chat.id)}
                      className={`group w-full text-left px-3 py-2.5 rounded-koru-lg flex items-start gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                        chat.id === activeChatId
                          ? "bg-koru-primary-container text-koru-on-primary-container"
                          : "hover:bg-koru-surface-container text-koru-on-surface-variant"
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                          chat.id === activeChatId ? "text-koru-primary" : "text-koru-outline group-hover:text-koru-on-surface-variant"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate leading-snug text-koru-on-surface">
                          {chat.title}
                        </p>
                        <p className="text-koru-caption text-koru-on-surface-variant mt-0.5 leading-none">
                          {relativeTime(chat.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-koru-sm hover:bg-koru-error-container hover:text-koru-error focus-visible:opacity-100 text-koru-outline transition-all shrink-0 cursor-pointer"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Role badge footer */}
              <div className="p-3 border-t border-koru-outline-faint shrink-0">
                <Badge variant={badgeVariant} size="md">
                  <RoleIcon className="w-3 h-3" />
                  {roleLabel}
                </Badge>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">

          {/* Gradient + Orb background */}
          <div className="absolute inset-0 bg-gradient-to-br from-koru-primary-subtle via-koru-accent-soft to-koru-info-soft overflow-hidden">
            <div className="w-full h-full opacity-50">
              <Orb hoverIntensity={2} rotateOnHover={true} hue={0} forceHoverState={false} backgroundColor="#f3edff" />
            </div>
          </div>

          {/* Chat content layer */}
          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

            {activeMessages.length === 0 ? (
              /* ── Welcome / empty state ─────────────────────────────────── */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center text-center max-w-lg w-full"
                >
                  <h2 className="font-display text-koru-display text-koru-primary mb-1">
                    Hi {firstName || "there"},
                  </h2>
                  <h3 className="font-display text-koru-title text-koru-on-surface-variant mb-10">
                    {subtitle}
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    {chips.map((chip, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.055, duration: 0.25 }}
                        onClick={() => handleSend(chip.message)}
                        className="px-4 py-3 rounded-koru-lg bg-koru-surface-container-lowest hover:bg-koru-surface shadow-koru-card hover:shadow-koru-card-hover ring-1 ring-inset ring-koru-outline-faint text-sm font-medium text-koru-on-surface text-left transition-all cursor-pointer leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                      >
                        {chip.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* ── Message thread ────────────────────────────────────────── */
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-6 pb-2">
                <div className="max-w-3xl mx-auto space-y-5 pb-2">
                  {activeMessages.map((msg, idx) => {

                    if (msg.role === "error") {
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="max-w-2xl"
                        >
                          <Alert variant="warning" title="Assistant unavailable">
                            {msg.content}
                          </Alert>
                        </motion.div>
                      );
                    }

                    const isUser = msg.role === "user";

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-end gap-2.5 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        {isUser ? (
                          <Avatar user={user} size={28} className="mb-1" />
                        ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 text-xs bg-koru-primary-container text-koru-on-primary-container"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        )}

                        {/* Bubble */}
                        <div className={`relative max-w-[78%]`}>
                          <div
                            className={`px-4 py-3 rounded-koru-xl ${
                              isUser
                                ? "bg-koru-primary-container text-koru-on-primary-container rounded-br-sm"
                                : "bg-koru-surface-container-lowest shadow-koru-card rounded-bl-sm"
                            }`}
                          >
                            {isUser ? (
                              <p className="text-sm text-koru-on-primary-container leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            ) : (
                              renderMessageContent(msg.content)
                            )}
                          </div>

                          {/* Copy button */}
                          {!isUser && (
                            <button
                              onClick={() => handleCopy(msg.content, idx)}
                              className="absolute -bottom-2.5 left-2 p-1.5 rounded-koru-md bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint text-koru-on-surface-variant hover:text-koru-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all cursor-pointer"
                              aria-label="Copy response"
                            >
                              {copiedIndex === idx
                                ? <Check className="w-3 h-3 text-koru-success" />
                                : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-end gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-koru-primary-container flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5 text-koru-on-primary-container" />
                      </div>
                      <div className="px-4 py-3.5 rounded-koru-xl rounded-bl-sm bg-koru-surface-container-lowest shadow-koru-card">
                        <div className="flex items-center gap-1.5">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-koru-primary/40"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.9, delay }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* ── Input area ──────────────────────────────────────────────── */}
            <div className="px-4 pb-4 pt-2 shrink-0">
              <AssistantInput
                onSend={handleSend}
                disabled={isTyping}
                role={role}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
