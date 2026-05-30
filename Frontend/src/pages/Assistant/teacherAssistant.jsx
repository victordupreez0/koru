import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";

import Orb from "../../components/UI/Orb";
import AssistantInput from "../../components/assistantInput";
import HeaderTopBar from "../../components/HeaderTopBar";

export default function TeacherAssistant() {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text) => {
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setIsTyping(true);

        // Dummy delay for generating AI response
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [...prev, { 
                role: "assistant", 
                content: "Sure, let me help you with that! Generating your timetable based on recent analytics..." 
            }]);
        }, 1500);
    };

    return (
        <div className="h-screen overflow-hidden -ml-4 -mr-8 -mt-6 flex flex-col bg-transparent text-slate-900">
            {/* Reusable breadcrumb header top bar */}
            <HeaderTopBar />

            {/* Orb Background */}
            <div className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-br from-[#F3ebff] via-[#fff1e7] to-[#e6f4ff]">
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
                                    {messages.map((msg, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-4 p-4 rounded-3xl w-fit max-w-[85%] ${
                                                msg.role === "user" 
                                                ? "bg-white/80 backdrop-blur-xl border border-white shadow-sm ml-auto rounded-tr-sm" 
                                                : "bg-[#3C0078]/5 border border-[#3C0078]/10 mr-auto rounded-tl-sm"
                                            }`}
                                        >
                                            {msg.role === "assistant" && (
                                                <div className="w-8 h-8 rounded-full bg-[#3C0078]/10 flex items-center justify-center shrink-0">
                                                    <Bot className="w-5 h-5 text-[#3C0078]" />
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col pt-1">
                                                <p className="text-slate-800 font-medium leading-relaxed">{msg.content}</p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-4 p-4 rounded-3xl w-fit bg-[#3C0078]/5 border border-[#3C0078]/10 mr-auto rounded-tl-sm"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#3C0078]/10 flex items-center justify-center shrink-0">
                                                <Bot className="w-5 h-5 text-[#3C0078]" />
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2">
                                                <motion.div className="w-2 h-2 rounded-full bg-[#3C0078]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                                                <motion.div className="w-2 h-2 rounded-full bg-[#3C0078]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                                                <motion.div className="w-2 h-2 rounded-full bg-[#3C0078]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
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
    )
}
