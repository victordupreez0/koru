import React from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, CheckSquare, PenLine, Trash2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CourseHomeView({ subject, course, loading }) {
  // Lecturer state
  const [lecturerName, setLecturerName] = React.useState(subject?.lecturerName || "Dr. Sarah Miller");
  const [lecturerTitle, setLecturerTitle] = React.useState("Senior Design Lead & Principle Researcher");
  const [lecturerEmail, setLecturerEmail] = React.useState(subject?.lecturerEmail || "natalie@openwindow.co.za");
  const [lecturerImage, setLecturerImage] = React.useState(subject?.lecturerImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop");
  const [bookingLink, setBookingLink] = React.useState("#");
  const [isEditing, setIsEditing] = React.useState(false);

  // States for expandable text bars
  const [activeInput, setActiveInput] = React.useState(null); // 'email' or 'booking'
  const [tempEmail, setTempEmail] = React.useState(lecturerEmail);
  const [tempBooking, setTempBooking] = React.useState(bookingLink);
  
  // Quick Links state
  const [editingQuickLinkIndex, setEditingQuickLinkIndex] = React.useState(null);
  const [tempQuickLinkLabel, setTempQuickLinkLabel] = React.useState("");
  const [tempQuickLinkHref, setTempQuickLinkHref] = React.useState("");

  const [quickLinks, setQuickLinks] = React.useState([
    { label: "Figma Assets", href: "#" },
    { label: "Miro Board", href: "#" },
    { label: "Course Syllabus", href: "#" },
    { label: "Attendance", href: "#" },
    { label: "VLE Portal", href: "#" },
    { label: "Library Search", href: "#" }
  ]);

  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLecturerImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditingQuickLink = (index, link) => {
    setEditingQuickLinkIndex(index);
    setTempQuickLinkLabel(link.label);
    setTempQuickLinkHref(link.href);
  };

  const saveQuickLink = () => {
    if (editingQuickLinkIndex === "new") {
      setQuickLinks([...quickLinks, { label: tempQuickLinkLabel, href: tempQuickLinkHref }]);
    } else {
      const updated = [...quickLinks];
      updated[editingQuickLinkIndex] = { label: tempQuickLinkLabel, href: tempQuickLinkHref };
      setQuickLinks(updated);
    }
    setEditingQuickLinkIndex(null);
  };

  const addQuickLink = () => {
    setEditingQuickLinkIndex("new");
    setTempQuickLinkLabel("");
    setTempQuickLinkHref("");
  };

  // Use subject imageUrl or a placeholder if not present
  var sampleImg = "https://res.cloudinary.com/dvq3toyi0/image/upload/q_auto/f_auto/v1778533851/AdobeStock_315314252_syaukb.jpg";
  const courseImage = subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
      <header className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight">
          {loading ? "Loading course details..." : `${subject?.name || "Unknown"} | ${course?.term || ""}`}
        </h1>
        <p className="text-xl text-gray-500 mt-3 font-medium">{loading ? "..." : subject?.code}</p>
      </header>

      {/* Left column – course overview with todo, next class & announcements */}
      <main className="space-y-12 w-full flex flex-col items-center">
        <div className="w-full h-[300px] rounded-3xl shadow-sm overflow-hidden">
          <img 
            src={courseImage} 
            alt={subject?.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="w-full max-w-6xl space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Course Overview</h2>
            <div className="flex flex-col md:flex-row gap-12 items-stretch">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs mb-6 uppercase tracking-[0.2em] text-[#3C0078] border-b-2 border-[#3C0078] inline-block pb-1">
                    Term 1
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-600 min-h-[120px]">
                    {loading ? "Loading..." : subject?.description || "In this term, students will focus on the foundational principles of user experience design, understanding user psychology, and master the basics of research methodologies."}
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="#" className="inline-flex items-center gap-2 text-[#3C0078] font-bold text-sm uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Full Term Overview <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between border-l border-gray-100 pl-12">
                <div>
                  <h3 className="font-bold text-xs mb-6 uppercase tracking-[0.2em] text-[#3C0078] border-b-2 border-[#3C0078] inline-block pb-1">
                    Term 2
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-600 min-h-[120px]">
                    Building on the foundations, Term 2 shifts towards advanced prototyping, usability testing, and the integration of professional design hand-off processes for industry-standard delivery.
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="#" className="inline-flex items-center gap-2 text-[#3C0078] font-bold text-sm uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Full Term Overview <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full pt-10 pb-10 border-t border-gray-100/50">
            <div className="flex flex-col lg:flex-row items-center relative">
              
              {/* Universal Edit Button - Top Right of the Image/Text block */}
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="absolute top-0 right-[35%] z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border border-gray-100 bg-gray-50 text-[#3C0078] hover:bg-[#3C0078] hover:text-white"
                title={isEditing ? "Save Changes" : "Edit Lecturer Section"}
              >
                {isEditing ? <CheckSquare size={16} /> : <Edit2 size={16} />}
              </button>

              {/* Column 1: Image */}
              <div className="w-full lg:w-1/4 flex justify-center">
                <div className={`relative group ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
                    <img 
                      src={lecturerImage} 
                      alt="Lecturer" 
                      className={`w-full h-full object-cover transition-transform duration-700 ${!isEditing ? 'group-hover:scale-110' : ''}`}
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PenLine className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              {/* Column 2: Lecturer Details & Buttons - Tightened gap with Image */}
              <div className="w-full lg:w-2/5 flex flex-col items-start text-left lg:border-l border-gray-100 lg:pl-12 ml-[-1%]">
                <div className="mb-6 w-full">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#3C0078] mb-3 block">Module Head</span>
                  {isEditing ? (
                    <input
                      className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4 bg-white border border-[#3C0078]/20 rounded-xl px-3 py-1 outline-none w-full shadow-sm"
                      value={lecturerName}
                      onChange={(e) => setLecturerName(e.target.value)}
                      placeholder="Lecturer Name"
                    />
                  ) : (
                    <h3 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4">{lecturerName}</h3>
                  )}
                  
                  {isEditing ? (
                    <input
                      className="text-xl text-gray-700 font-bold bg-white border border-[#3C0078]/20 rounded-xl px-3 py-1 outline-none w-full shadow-sm"
                      value={lecturerTitle}
                      onChange={(e) => setLecturerTitle(e.target.value)}
                      placeholder="Job Title"
                    />
                  ) : (
                    <p className="text-xl text-gray-700 font-bold">{lecturerTitle}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <div className="relative w-full">
                    <button 
                      type="button"
                      className={`h-12 w-full flex items-center justify-center rounded-full bg-[#3C0078] text-white !text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-md shadow-[#3C0078]/20 cursor-default`}
                    >
                      {lecturerEmail}
                    </button>
                  </div>
                  
                  <div className="relative w-full">
                    <button 
                      type="button"
                      className={`h-12 w-full flex items-center justify-center rounded-full bg-white border border-[#3C0078] text-[#3C0078] text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm cursor-default`}
                    >
                      Book a Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Quick Links - Increased Spacing */}
              <div className="w-full lg:flex-1 lg:border-l border-gray-100 lg:pl-16 relative">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-black">Quick Links</h4>
                  <button 
                    onClick={addQuickLink}
                    className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[#3C0078] hover:bg-[#3C0078] hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 relative">
                  {quickLinks.map((link, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => isEditing ? startEditingQuickLink(index, link) : window.open(link.href)}
                        className="px-6 py-3 bg-white border border-[#3C0078] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#3C0078] hover:bg-[#87CEFA] hover:border-[#87CEFA] hover:text-[#3C0078] transition-all shadow-sm"
                      >
                        {link.label}
                      </button>
                    </div>
                  ))}

                  {/* Inline Quick Link Editor Popup */}
                  <AnimatePresence>
                    {isEditing && editingQuickLinkIndex !== null && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute inset-x-0 top-0 z-40 bg-white border border-[#3C0078]/20 rounded-[30px] p-6 shadow-2xl backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-[#3C0078]">
                            {editingQuickLinkIndex === "new" ? "Add Link" : "Edit Link"}
                          </h5>
                          <button onClick={() => setEditingQuickLinkIndex(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 mb-1 block">Display Name</label>
                            <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#3C0078]/30"
                              value={tempQuickLinkLabel}
                              onChange={(e) => setTempQuickLinkLabel(e.target.value)}
                              placeholder="e.g. Portfolio"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 mb-1 block">URL / Link</label>
                            <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#3C0078]/30"
                              value={tempQuickLinkHref}
                              onChange={(e) => setTempQuickLinkHref(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={saveQuickLink}
                              className="flex-1 bg-black text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                              <Check size={14} /> Save Link
                            </button>
                            {editingQuickLinkIndex !== "new" && (
                              <button 
                                onClick={() => {
                                  setQuickLinks(quickLinks.filter((_, i) => i !== editingQuickLinkIndex));
                                  setEditingQuickLinkIndex(null);
                                }}
                                className="w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                title="Delete Link"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
