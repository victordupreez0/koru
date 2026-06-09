import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Plus, 
  Sparkles, 
  Mic, 
  ChevronDown, 
  Calendar, 
  BookOpen, 
  FileEdit,
  BarChart,
  Send
} from "lucide-react";

export default function AssistantInput({ onSend, hideChips = false }) {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize textarea when prompt changes programmatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  const tools = [
    { icon: Calendar, label: "Generate Timetable", desc: "Create an AI generated timetable" },
    { icon: BookOpen, label: "Plan Module", desc: "Draft a lesson plan" },
    { icon: FileEdit, label: "Draft Feedback", desc: "Write student feedback" },
    { icon: BarChart, label: "Analytics Info", desc: "Query performance data" },
  ];

  const handleToolClick = (label) => {
    let template = "";
    switch (label) {
      case "Generate Timetable":
        template = "Generate a structured weekly timetable for a [Subject] course. Include lectures, lab hours, student hours, and self-study sessions.";
        break;
      case "Plan Module":
        template = "Draft a detailed lesson plan and module outline for [Topic/Subject]. Include learning objectives, a weekly breakdown, and recommended reading resources.";
        break;
      case "Draft Feedback":
        template = "Write constructive and encouraging feedback for a student named [Name] who [scored 88% / did exceptionally well / struggled with time management] on the [Assignment Name] assignment.";
        break;
      case "Analytics Info":
        template = "Help me interpret my class analytics. What insights can I gather when the class average is [80]% but the assignment submission rate is only [65]%?";
        break;
      default:
        break;
    }
    setPrompt(template);
    setIsToolsOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

      {/* Suggestion Chips */}
      {!hideChips && (
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <button 
            onClick={() => onSend("Analyze recent grades")}
            className="px-5 py-2.5 rounded-full bg-white/60 hover:bg-white/90 border border-white/50 shadow-sm backdrop-blur-md text-sm font-medium text-slate-700 transition-all"
          >
            📊 Analyze recent grades
          </button>
          <button 
            onClick={() => onSend("Plan next week")}
            className="px-5 py-2.5 rounded-full bg-white/60 hover:bg-white/90 border border-white/50 shadow-sm backdrop-blur-md text-sm font-medium text-slate-700 transition-all"
          >
            📅 Plan next week
          </button>
          <button 
            onClick={() => onSend("Draft announcements")}
            className="px-5 py-2.5 rounded-full bg-white/60 hover:bg-white/90 border border-white/50 shadow-sm backdrop-blur-md text-sm font-medium text-slate-700 transition-all"
          >
            ✍️ Draft announcements
          </button>
        </div>
      )}

      {/* Main Input Container */}
      <div className="relative w-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-3 flex flex-col transition-all duration-300 focus-within:shadow-[#3C0078]/10 focus-within:ring-2 focus-within:ring-[#3C0078]/20">
        
        {/* Top Input Area */}
        <div className="flex items-start gap-3 px-3 pt-2 pb-4">
          <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask your assistant anything..."
            className="w-full bg-transparent resize-none outline-none text-slate-800 placeholder:text-gray-400 min-h-[44px] max-h-[200px] text-lg font-medium"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim() && onSend) {
                  onSend(prompt.trim());
                  setPrompt("");
                }
              }
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>

        {/* Bottom Actions Area */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50 relative">
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500">
              <Plus className="w-5 h-5" />
            </button>
            
            {/* Tools Dropdown Relative Wrapper */}
            <div ref={dropdownRef} className="relative">
              <button 
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-semibold
                  ${isToolsOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Sparkles className="w-4 h-4" />
                Tools
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isToolsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 flex flex-col py-2"
                  >
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Tools
                    </div>
                    {tools.map((tool, idx) => {
                      const Icon = tool.icon;
                      return (
                        <button 
                          key={idx} 
                          type="button"
                          onClick={() => handleToolClick(tool.label)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors w-full"
                        >
                          <Icon className="w-5 h-5 text-gray-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{tool.label}</span>
                            <span className="text-xs text-gray-400">{tool.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button className="flex items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors text-sm font-semibold text-gray-600">
              Pro <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500">
              <Mic className="w-5 h-5" />
            </button>
            {prompt.trim().length > 0 && (
                <motion.button 
                  onClick={() => {
                    if (prompt.trim() && onSend) {
                      onSend(prompt.trim());
                      setPrompt("");
                    }
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-[#3C0078] flex items-center justify-center transition-shadow shadow-md shadow-[#3C0078]/20 text-white ml-2"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </motion.button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
