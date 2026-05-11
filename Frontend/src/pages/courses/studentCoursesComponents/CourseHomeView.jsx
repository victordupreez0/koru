import React from "react";
import { Link } from "react-router-dom";

export default function CourseHomeView({ subject, course, loading }) {
  // Use subject imageUrl or a placeholder if not present
  var sampleImg = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
  const courseImage = subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          {loading ? "Loading course details..." : `${subject?.name || "Unknown"} | ${course?.term || ""}`}
        </h1>
        <p className="text-xl text-gray-500 mt-3 font-medium">{loading ? "..." : subject?.code}</p>
      </header>

      {/* Left column – course overview with todo, next class & announcements */}
      <main className="space-y-24 w-full flex flex-col items-center">
        <div className="w-full h-[500px] rounded-[60px] shadow-sm overflow-hidden">
          <img 
            src={courseImage} 
            alt={subject?.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="w-full max-w-6xl space-y-24">
          <section>
            <h2 className="text-3xl font-bold mb-12 tracking-tight">Course Overview</h2>
            <div className="flex flex-col md:flex-row gap-24 items-stretch">
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

              <div className="flex-1 flex flex-col justify-between border-l border-gray-100 pl-24">
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

          <section className="w-full pt-20 pb-20 border-t border-gray-100/50">
            <div className="flex flex-col lg:flex-row items-center">
              
              {/* Column 1: Image */}
              <div className="w-full lg:w-1/4 flex justify-center">
                <div className="relative group">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    <img 
                      src={subject?.lecturerImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"} 
                      alt="Lecturer" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Lecturer Details & Buttons - Tightened gap with Image */}
              <div className="w-full lg:w-2/5 flex flex-col items-start text-left lg:border-l border-gray-100 lg:pl-10 ml-[-2%]">
                <div className="mb-8">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#3C0078] mb-2 block">Module Head</span>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-3">{subject?.lecturerName || "Dr. Sarah Miller"}</h3>
                  <p className="text-lg text-gray-700 font-bold">Senior Design Lead & Principle Researcher</p>
                </div>

                <div className="flex flex-row gap-3 w-full">
                  <a 
                    href={`mailto:${subject?.lecturerEmail || "sarah.miller@university.ac.za"}`}
                    className="h-10 px-8 flex items-center justify-center rounded-full bg-[#3C0078] text-white !text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#2A0054] transition-all shadow-md shadow-[#3C0078]/20"
                  >
                    Email Lecturer
                  </a>
                  <button className="h-10 px-8 flex items-center justify-center rounded-full bg-white border border-[#3C0078] text-[#3C0078] text-[10px] font-bold uppercase tracking-widest hover:bg-[#87CEFA] hover:border-[#87CEFA] transition-all shadow-sm">
                    Book a Session
                  </button>
                </div>
              </div>

              {/* Column 3: Quick Links - Increased Spacing */}
              <div className="w-full lg:flex-1 lg:border-l border-gray-100 lg:pl-16">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-black mb-8">Quick Links</h4>
                
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: "Figma Assets", href: "#" },
                    { label: "Miro Board", href: "#" },
                    { label: "Course Syllabus", href: "#" },
                    { label: "Attendance", href: "#" },
                    { label: "VLE Portal", href: "#" },
                    { label: "Library Search", href: "#" }
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="px-6 py-3 bg-white border border-[#3C0078] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#3C0078] hover:bg-[#87CEFA] hover:border-[#87CEFA] hover:text-[#3C0078] transition-all shadow-sm"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
