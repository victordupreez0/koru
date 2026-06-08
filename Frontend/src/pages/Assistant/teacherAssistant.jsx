import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Trash2, Copy, Check, AlertCircle } from "lucide-react";

import Orb from "../../components/UI/Orb";
import AssistantInput from "../../components/assistantInput";
import HeaderTopBar from "../../components/HeaderTopBar";
import { getAssistantResponse } from "../../services/assistantService";
import { useAuth } from "../../contexts/AuthContext";

export default function TeacherAssistant() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text) => {
        if (!text || text.trim() === "") return;

        // 1. Add user message
        const updatedMessages = [...messages, { role: "user", content: text }];
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            // 2. Call the AI assistant service (passes message history and user identity context)
            const response = await getAssistantResponse(updatedMessages, user?.userId, user?.role);
            
            // 3. Add AI assistant response
            setMessages((prev) => [...prev, { role: "assistant", content: response.content }]);
        } catch (error) {
            console.error("Assistant Error:", error);
            // 4. Add error message in context so user knows what failed
            setMessages((prev) => [
                ...prev, 
                { 
                    role: "error", 
                    content: error.message || "An unexpected error occurred while communicating with the assistant." 
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => {
            setCopiedIndex(null);
        }, 2000);
    };

    // Custom inline Markdown & code renderer for beautiful styling
    const renderMessageContent = (content) => {
        if (!content) return null;

        const lines = content.split("\n");
        const elements = [];
        let currentList = [];
        let currentListType = null; // "ul" or "ol"
        let inCodeBlock = false;
        let codeBlockContent = [];
        let codeBlockLanguage = "";

        const flushList = (key) => {
            if (currentList.length > 0) {
                if (currentListType === "ul") {
                    elements.push(
                        <ul key={`ul-${key}`} className="list-disc pl-6 my-2 space-y-1.5 text-slate-800">
                            {currentList.map((item, idx) => <li key={idx} className="leading-relaxed">{parseInlineStyle(item)}</li>)}
                        </ul>
                    );
                } else if (currentListType === "ol") {
                    elements.push(
                        <ol key={`ol-${key}`} className="list-decimal pl-6 my-2 space-y-1.5 text-slate-800">
                            {currentList.map((item, idx) => <li key={idx} className="leading-relaxed">{parseInlineStyle(item)}</li>)}
                        </ol>
                    );
                }
                currentList = [];
                currentListType = null;
            }
        };

        const parseInlineStyle = (text) => {
            const parts = text.split(/\*\*([^*]+)\*\*/g);
            return parts.map((part, index) => {
                if (index % 2 === 1) {
                    return <strong key={index} className="font-bold text-purple-950">{part}</strong>;
                }
                
                const subParts = part.split(/\*([^*]+)\*/g);
                return subParts.map((subPart, subIndex) => {
                    if (subIndex % 2 === 1) {
                        return <em key={subIndex} className="italic text-slate-700">{subPart}</em>;
                    }

                    const codeParts = subPart.split(/`([^`]+)`/g);
                    return codeParts.map((codePart, codeIndex) => {
                        if (codeIndex % 2 === 1) {
                            return <code key={codeIndex} className="px-1.5 py-0.5 rounded bg-purple-50 text-[#3C0078] text-sm font-mono border border-purple-100">{codePart}</code>;
                        }
                        return codePart;
                    });
                });
            });
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith("```")) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                    elements.push(
                        <pre key={`code-${i}`} className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono my-3 overflow-x-auto shadow-inner border border-slate-800 select-all">
                            <code>{codeBlockContent.join("\n")}</code>
                        </pre>
                    );
                    codeBlockContent = [];
                    codeBlockLanguage = "";
                } else {
                    flushList(i);
                    inCodeBlock = true;
                    codeBlockLanguage = line.trim().substring(3).trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent.push(line);
                continue;
            }

            if (line.startsWith("### ")) {
                flushList(i);
                elements.push(<h4 key={`h4-${i}`} className="text-lg font-bold text-purple-950 mt-4 mb-2">{parseInlineStyle(line.substring(4))}</h4>);
                continue;
            }
            if (line.startsWith("## ")) {
                flushList(i);
                elements.push(<h3 key={`h3-${i}`} className="text-xl font-bold text-purple-950 mt-5 mb-2">{parseInlineStyle(line.substring(3))}</h3>);
                continue;
            }
            if (line.startsWith("# ")) {
                flushList(i);
                elements.push(<h2 key={`h2-${i}`} className="text-2xl font-bold text-purple-950 mt-6 mb-3">{parseInlineStyle(line.substring(2))}</h2>);
                continue;
            }

            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                if (currentListType && currentListType !== "ul") {
                    flushList(i);
                }
                currentListType = "ul";
                currentList.push(line.trim().substring(2));
                continue;
            }

            const olMatch = line.trim().match(/^(\d+)\.\s(.*)/);
            if (olMatch) {
                if (currentListType && currentListType !== "ol") {
                    flushList(i);
                }
                currentListType = "ol";
                currentList.push(olMatch[2]);
                continue;
            }

            if (line.trim() === "") {
                flushList(i);
                continue;
            }

            flushList(i);
            elements.push(<p key={`p-${i}`} className="leading-relaxed text-slate-800 my-2">{parseInlineStyle(line)}</p>);
        }

        flushList(lines.length);
        return <div className="space-y-1">{elements}</div>;
    };

    return (
        <div className="flex flex-col overflow-hidden transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full md:bg-white/55 md:backdrop-blur-xl md:border md:border-white/20 md:rounded-[28px] md:shadow-lg max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 max-md:bg-transparent text-slate-900 relative">
            
            {/* Header top bar with Clear Chat option */}
            <div className="flex items-center justify-between pr-6 border-b border-gray-100/50 bg-white/30 backdrop-blur-md">
                <div className="flex-1">
                    <HeaderTopBar />
                </div>
                {messages.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearChat}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 hover:bg-red-50 border border-white/50 text-slate-500 hover:text-red-600 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        title="Clear Conversation"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Chat
                    </motion.button>
                )}
            </div>

            {/* Orb Background */}
            <div className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-br from-[#F3ebff] via-[#fff1e7] to-[#e6f4ff] md:rounded-[28px] overflow-hidden">
                <div className="w-full h-full opacity-60">
                    <Orb hoverIntensity={2} rotateOnHover={true} hue={0} forceHoverState={false} backgroundColor="#F3ebff" />
                </div>
            </div>

            {/* Chat Content Viewport */}
            <div className="flex-1 overflow-y-auto pt-6 px-8 pb-12 flex flex-col relative">
                <div className="flex flex-col h-[calc(100vh-10rem)] text-black w-full relative">
                    <div className="flex w-full flex-col z-10 h-full pb-4">
                        <div className="flex flex-col items-center justify-center flex-1 h-full w-full max-w-4xl mx-auto overflow-hidden">
                            
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center space-y-4 my-auto">
                                    <h2 className="text-4xl font-bold font-['Gabarito'] text-[#3C0078]">Hi Rikus,</h2>
                                    <h2 className="text-5xl font-bold font-['Gabarito'] text-slate-800 mb-8">Where should we start?</h2>
                                </div>
                            ) : (
                                <div ref={scrollRef} className="flex-1 w-full overflow-y-auto scrollbar-black px-4 pt-10 pb-4 space-y-6">
                                    {messages.map((msg, idx) => {
                                        if (msg.role === "error") {
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex gap-4 p-5 rounded-3xl w-full bg-amber-50 border border-amber-200/70 shadow-sm max-w-3xl mx-auto"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                        <AlertCircle className="w-5 h-5 text-amber-700" />
                                                    </div>
                                                    <div className="flex flex-col space-y-2">
                                                        <h4 className="font-semibold text-amber-900 text-sm">System Configuration Alert</h4>
                                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">{msg.content}</p>
                                                        <div className="pt-2 text-[11px] text-amber-700 font-semibold space-y-1">
                                                            <p>💡 To fix this, you can:</p>
                                                            <ul className="list-disc pl-4 space-y-0.5">
                                                                <li>Add your API Key in <code className="bg-amber-100/50 px-1 rounded font-mono text-[10px]">Backend/LearnOnline/appsettings.Development.json</code> under <code className="bg-amber-100/50 px-1 rounded font-mono text-[10px]">"Groq": &#123; "ApiKey": "your-key" &#125;</code></li>
                                                                <li>Or create a <code className="bg-amber-100/50 px-1 rounded font-mono text-[10px]">Frontend/.env</code> file and set <code className="bg-amber-100/50 px-1 rounded font-mono text-[10px]">VITE_GROQ_API_KEY=your-key</code></li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        }

                                        return (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex gap-4 p-5 rounded-3xl w-fit max-w-[90%] relative group ${
                                                    msg.role === "user" 
                                                    ? "bg-white/80 backdrop-blur-xl border border-white shadow-sm ml-auto rounded-tr-sm" 
                                                    : "bg-[#3C0078]/5 border border-[#3C0078]/10 mr-auto rounded-tl-sm"
                                                }`}
                                            >
                                                {msg.role === "assistant" && (
                                                    <div className="w-9 h-9 rounded-full bg-[#3C0078]/10 flex items-center justify-center shrink-0">
                                                        <Bot className="w-5 h-5 text-[#3C0078]" />
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-col pt-1 pr-6 flex-1 min-w-0">
                                                    {msg.role === "assistant" ? (
                                                        renderMessageContent(msg.content)
                                                    ) : (
                                                        <p className="text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    )}
                                                </div>

                                                {/* Copy Button for Assistant responses */}
                                                {msg.role === "assistant" && (
                                                    <button
                                                        onClick={() => handleCopy(msg.content, idx)}
                                                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/80 hover:bg-[#3C0078]/10 border border-gray-200/50 hover:border-[#3C0078]/20 text-gray-400 hover:text-[#3C0078] opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                        title="Copy text to clipboard"
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}

                                    {isTyping && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-4 p-5 rounded-3xl w-fit bg-[#3C0078]/5 border border-[#3C0078]/10 mr-auto rounded-tl-sm"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-[#3C0078]/10 flex items-center justify-center shrink-0">
                                                <Bot className="w-5 h-5 text-[#3C0078]" />
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3">
                                                <motion.div className="w-2.5 h-2.5 rounded-full bg-[#3C0078]/70" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                                                <motion.div className="w-2.5 h-2.5 rounded-full bg-[#3C0078]/70" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                                                <motion.div className="w-2.5 h-2.5 rounded-full bg-[#3C0078]/70" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                            
                        </div>

                        {/* Input attached to the bottom */}
                        <div className="w-full flex justify-center mt-auto">
                            <AssistantInput 
                              onSend={handleSend} 
                              hideChips={messages.length > 0} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

