import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Users, BookOpen, Clock, 
  TrendingUp, CheckCircle, Award,
  MessageSquare, BarChart3
} from "lucide-react";

export default function TeacherAnalyticsModal({ teacher, isOpen, onClose }) {
  if (!teacher || !isOpen) return null;

  // Mock analytics data for the teacher
  const stats = {
    totalStudents: 1250,
    activeCourses: 4,
    avgCompletionRate: "88%",
    feedbackTurnaround: "1.2 days",
    engagementRate: "92%",
    totalSubmissionsGraded: 450,
  };

  const performanceMetrics = [
    { label: "Content Quality", value: 95 },
    { label: "Responsiveness", value: 88 },
    { label: "Instructional Clarity", value: 92 },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-6" onClick={onClose}>
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-[40px] w-full max-w-5xl shadow-3xl overflow-hidden relative max-h-[90vh] flex flex-col" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-10 bg-gray-50/50 border-b border-gray-100 relative shrink-0">
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                <X size={24}/>
            </button>

            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-[32px] bg-[#3C0078] text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-[#3C0078]/20 border-4 border-white">
                {teacher.firstName?.[0] || "?"}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#3C0078]/5 text-[10px] font-black text-[#3C0078] uppercase tracking-widest">Faculty Profile</span>
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest">Senior Instructor</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">
                  {teacher.firstName} {teacher.lastName}
                </h2>
                <p className="text-gray-500 font-medium text-lg">{teacher.email}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
            {/* Left Column: Stats Cards */}
            <div className="flex-1 p-10 space-y-8">
              <div>
                <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BarChart3 size={16} /> Performance Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <AnalyticsCard 
                    label="Total Students" 
                    value={stats.totalStudents} 
                    icon={Users} 
                    color="bg-blue-50 text-blue-600" 
                  />
                  <AnalyticsCard 
                    label="Active Courses" 
                    value={stats.activeCourses} 
                    icon={BookOpen} 
                    color="bg-purple-50 text-purple-600" 
                  />
                  <AnalyticsCard 
                    label="Completion Rate" 
                    value={stats.avgCompletionRate} 
                    icon={CheckCircle} 
                    color="bg-green-50 text-green-600" 
                  />
                  <AnalyticsCard 
                    label="Engagement" 
                    value={stats.engagementRate} 
                    icon={TrendingUp} 
                    color="bg-orange-50 text-orange-600" 
                  />
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-6">Instructional Metrics</h3>
                <div className="space-y-6">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700">{metric.label}</span>
                        <span className="text-sm font-black text-[#3C0078]">{metric.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-[#3C0078]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Stats & Actions */}
            <div className="w-full md:w-80 bg-gray-50/50 p-10 border-l border-gray-100 space-y-8">
              <div>
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Teaching Efficiency</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                      <Clock size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Avg Turnaround</p>
                      <p className="text-sm font-bold text-gray-900">{stats.feedbackTurnaround}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                      <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Engagement Rate</p>
                      <p className="text-sm font-bold text-gray-900">{stats.engagementRate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                      <MessageSquare size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Total Feedbacks</p>
                      <p className="text-sm font-bold text-gray-900">{stats.totalSubmissionsGraded}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-4 rounded-2xl bg-[#3C0078] text-white text-[12px] font-black uppercase tracking-wider shadow-lg shadow-[#3C0078]/20 hover:scale-[1.02] transition-all">
                  Download Full Report
                </button>
                <button className="w-full py-4 rounded-2xl bg-white border border-gray-200 text-gray-600 text-[12px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all">
                  Message Teacher
                </button>
              </div>

              <div className="p-6 rounded-[24px] bg-white border border-orange-100 flex items-start gap-4 shadow-sm">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Faculty Award</p>
                  <p className="text-[10px] font-medium text-gray-500 leading-tight mt-1">Exceptional course design recognition FY26.</p>
                </div>
              </div>
            </div>
          </div>
    </motion.div>
  </div>
);
}

function AnalyticsCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-6 rounded-[28px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
);
}