import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bell, CloseSquare, User } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { ANNOUNCEMENTS_DATA, staggerContainer, slideUp } from "./constants";

export function CourseAnnouncementsView() {
    const [selectedId, setSelectedId] = useState(null);
    const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);
    const [isAdding, setIsAdding] = useState(false);
    
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        preview: "",
        label: "Notice",
        color: "#3C0078",
        lecturer: "Dr. Sarah Miller" // Hardcoded for teacher view
    });

    const selectedAnnouncement = announcements.find(a => a.id === selectedId);

    const handlePost = () => {
        if (!newAnnouncement.title || !newAnnouncement.preview) return;
        
        const announcement = {
            ...newAnnouncement,
            id: Date.now(),
            date: "Today, Just Now"
        };
        
        setAnnouncements([announcement, ...announcements]);
        setIsAdding(false);
        setNewAnnouncement({
            title: "",
            preview: "",
            label: "Notice",
            color: "#3C0078",
            lecturer: "Dr. Sarah Miller"
        });
    };

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
                    <p className="text-gray-500 mt-2">Latest updates from your lecturers</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-[#3C0078] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#3C0078]/20"
                    >
                        <Plus size={18} />
                        Create Announcement
                    </button>
                )}
            </motion.header>

            <div className="max-w-6xl">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="bg-white p-6 rounded-3xl border-2 border-dashed border-[#3C0078]/20 shadow-sm mb-6 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-gray-900 italic">Drafting New Announcement</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <CloseSquare size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-8 mb-8">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-[3]">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Announcement Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="What's the update about?"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all"
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Label</label>
                                        <select 
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all appearance-none"
                                            value={newAnnouncement.label}
                                            onChange={(e) => {
                                                const labels = {
                                                    "Notice": "#3C0078",
                                                    "Event": "#FF8731",
                                                    "Update": "#87CEFA"
                                                };
                                                setNewAnnouncement({...newAnnouncement, label: e.target.value, color: labels[e.target.value]});
                                            }}
                                        >
                                            <option>Notice</option>
                                            <option>Event</option>
                                            <option>Update</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Announcement Message</label>
                                    <textarea 
                                        rows={6}
                                        placeholder="Write your announcement details here..."
                                        className="w-full bg-gray-50 border-none rounded-2xl px-8 py-6 text-gray-900 text-lg font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all resize-none leading-relaxed"
                                        value={newAnnouncement.preview}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, preview: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <button 
                                    onClick={handlePost}
                                    className="bg-[#3C0078] text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-[#2A0054] transition-all shadow-lg shadow-[#3C0078]/20"
                                >
                                    Post Announcement
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {announcements.map((post) => (
                        <motion.div 
                            key={post.id} 
                            layoutId={`ann_container_${post.id}`}
                            onClick={() => setSelectedId(post.id)}
                            variants={slideUp} 
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
                        >
                            <motion.div 
                                layoutId={`ann_stripe_${post.id}`}
                                className="absolute left-0 top-0 bottom-0 w-1.5" 
                                style={{ backgroundColor: post.color }} 
                            />
                            <div className="flex justify-between items-start mb-6">
                                <motion.div layoutId={`ann_meta_${post.id}`} className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: post.color }}>{post.label}</span>
                                    <span className="text-sm text-gray-400">{post.date}</span>
                                </motion.div>
                                <motion.div layoutId={`ann_icon_${post.id}`} className="text-gray-200">
                                    <Bell size={24} />
                                </motion.div>
                            </div>
                            <motion.h2 
                                layoutId={`ann_title_${post.id}`}
                                className="text-2xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight"
                            >
                                {post.title}
                            </motion.h2>
                            <motion.div layoutId={`ann_author_${post.id}`}>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#3C0078] mt-2 opacity-60">Posted by {post.lecturer}</p>
                            </motion.div>
                            <motion.p layoutId={`ann_preview_${post.id}`} className="text-gray-500 mt-4 leading-relaxed line-clamp-2">
                                {post.preview}
                            </motion.p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
                        />

                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                layoutId={`ann_container_${selectedId}`}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden pointer-events-auto"
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            >
                                <motion.div 
                                    layoutId={`ann_stripe_${selectedId}`}
                                    className="absolute left-0 top-0 bottom-0 w-3" 
                                    style={{ backgroundColor: selectedAnnouncement.color }} 
                                />
                                
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <motion.div layoutId={`ann_meta_${selectedId}`} className="flex items-center gap-4">
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: selectedAnnouncement.color }}>
                                                {selectedAnnouncement.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">{selectedAnnouncement.date}</span>
                                        </motion.div>
                                        <div className="flex gap-2">
                                            <motion.div layoutId={`ann_icon_${selectedId}`} className="text-gray-100 hidden md:block">
                                                <Bell size={32} />
                                            </motion.div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                            >
                                                <CloseSquare size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    <motion.h2 
                                        layoutId={`ann_title_${selectedId}`}
                                        className="text-4xl font-black text-gray-900 leading-tight mb-4"
                                    >
                                        {selectedAnnouncement.title}
                                    </motion.h2>

                                    <motion.div layoutId={`ann_author_${selectedId}`} className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#3C0078]">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Published By</p>
                                            <p className="font-bold text-[#3C0078]">{selectedAnnouncement.lecturer}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="prose prose-purple max-w-none"
                                    >
                                        <motion.p layoutId={`ann_preview_${selectedId}`} className="text-xl leading-relaxed text-gray-600 mb-6 font-medium">
                                            {selectedAnnouncement.preview}
                                        </motion.p>
                                        <p className="text-gray-500 leading-relaxed text-lg">
                                            Please make sure to check the attached documents in the resources section if any are mentioned. If you have any follow-up questions regarding this announcement, feel free to reach out to the lecturer during office hours or post in the discussion forum.
                                        </p>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-8 flex items-center justify-between"
                                    >
                                        <button 
                                            onClick={() => setSelectedId(null)}
                                            className="px-8 py-3 rounded-2xl bg-[#3C0078]/5 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078] hover:text-white transition-all"
                                        >
                                            Back to list
                                        </button>
                                        <div className="flex gap-4">
                                            <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Delete</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-400 hover:text-[#3C0078] transition-colors">
                                                <Bell size={18} /> {/* Note: Letter was used in original, Bell is closer and available */}
                                                <span className="text-xs font-bold uppercase tracking-widest">Share</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
