import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    EditorRoot, 
    EditorContent, 
    StarterKit, 
    Placeholder, 
    TiptapUnderline, 
    TextStyle, 
    Color,
    createSuggestionItems
} from "novel";
import { 
    Bold, 
    Italic, 
    Underline, 
    Strikethrough, 
    Code, 
    Heading1, 
    Heading2, 
    Heading3, 
    List, 
    ListOrdered, 
    Quote, 
    Image as ImageIcon, 
    Video as VideoIcon, 
    Code2, 
    AlertCircle, 
    Eye, 
    Edit3, 
    Save, 
    ArrowLeft, 
    ArrowRight,
    Sparkles,
    ChevronDown,
    Palette,
    Paperclip,
    FileText,
    Link as LinkIcon,
    Plus,
    X,
    ExternalLink
} from "lucide-react";
import NovelBlockMenu from "../../components/NovelBlockMenu";

// Curated brand color options for text
const TEXT_COLORS = [
    { label: "Default", color: "#1f2937" }, // Slate 800
    { label: "Deep Purple", color: "#3C0078" }, // Brand purple
    { label: "Slate Gray", color: "#6b7280" },
    { label: "Indigo Blue", color: "#2563eb" },
    { label: "Emerald Green", color: "#059669" },
    { label: "Warm Amber", color: "#d97706" },
    { label: "Crimson Red", color: "#dc2626" },
];

// Presets for quick-select images to wow the user immediately without typing a URL
const IMAGE_PRESETS = [
    { label: "Abstract Learning Pattern", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" },
    { label: "Design System Grid", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80" },
    { label: "Creative Workspace", url: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1000&q=80" }
];

// Default pre-populated items loaded if localStorage is empty
const INITIAL_OVERVIEW_CONTENT = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Welcome to UX Design 300 | Semester 1" }]
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This course focuses on building a strong human-centred foundation. Throughout the semester, we will cover neurodiverse, inclusive, and adaptive design systems. Please ensure you read the guidelines and download the prescribed guide below."
        }
      ]
    }
  ]
};

const INITIAL_RESOURCES_CONTENT = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Syllabus Guidelines & Resources" }]
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Use the external resources and books listed below to assist your research. Make sure you register an account on the Open Window Library portal for digital book access."
        }
      ]
    }
  ]
};

const INITIAL_WEEK1_CONTENT = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Week 1: Foundations & Briefings" }]
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Our first class will cover the core theoretical framework of Inclusive Design and neurodiverse patterns. Make sure you read the Week 1 Theory slides before entering the practical workshop."
        }
      ]
    }
  ]
};

const INITIAL_SCHEMAS = {
    // Modules
    "1": {
        title: "Overview",
        content: INITIAL_OVERVIEW_CONTENT,
        htmlEmbeds: ""
    },
    "2": {
        title: "Resources",
        content: INITIAL_RESOURCES_CONTENT,
        htmlEmbeds: ""
    },
    "3": {
        title: "Week 1: Introduction & Briefing",
        content: INITIAL_WEEK1_CONTENT,
        htmlEmbeds: ""
    },
    // Semester Overview
    "102": {
        title: "Semester Overview",
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Welcome to UX Design 300 | Semester Overview" }]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Welcome to your third-year UX practical track! This semester we focus on creating " },
                        { type: "text", marks: [{ type: "bold" }], text: "highly adaptive, inclusive, and accessible digital ecosystems" },
                        { type: "text", text: ". Our curriculum stretches standard design patterns to embrace neurodiversity, screen-reader parity, and adaptive layouts." }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "We have embedded a welcoming abstract illustration and video overview below to guide your initial learning mindset:" }
                    ]
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: " "
                        }
                    ]
                }
            ]
        },
        htmlEmbeds: `
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" alt="Learning Banner" class="w-full max-h-[340px] object-cover rounded-2xl border border-gray-100 shadow-sm my-6" />
            
            <div class="p-6 bg-[#3C0078]/5 border-l-4 border-[#3C0078] rounded-r-2xl my-6 flex gap-3 text-[#3C0078]">
                <div class="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                <div class="flex-1">
                    <div class="font-extrabold text-sm uppercase tracking-wider leading-none mb-1">Prescribed Syllabus Alert</div>
                    <div class="text-xs font-semibold leading-relaxed opacity-90">Please ensure you download the "Study Guide 2026" PDF before our first practical tutorial this Wednesday at 09:00.</div>
                </div>
            </div>
 
            <h3 class="text-lg font-bold text-gray-800 mt-8 mb-4">Responsive System Tokens Example</h3>
            <p class="text-sm text-gray-600 mb-4">Here is a CSS custom properties layout system that we will construct together in Week 2's workshop:</p>
            <pre class="bg-gray-900 text-gray-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner my-6 leading-relaxed"><code>/* Accessible layout theme tokens */
:root {
  --color-brand: #3C0078;
  --color-active-bg: rgba(60, 0, 120, 0.08);
  --border-radius-premium: 24px;
  --font-body: 'Outfit', sans-serif;
  --accessibility-contrast-ratio: 7.2; /* AAA Level */
}</code></pre>
 
            <h3 class="text-lg font-bold text-gray-800 mt-8 mb-4">Course Briefing Video</h3>
            <p class="text-sm text-gray-600 mb-4">Watch this overview covering inclusive design guidelines from the Google UX Team:</p>
            <div class="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md my-6">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" class="absolute inset-0 w-full h-full border-0" allowfullscreen></iframe>
            </div>
        `
    },
    // Contact Sessions
    "203": {
        title: "Contact Sessions Guidelines",
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Contact Sessions & Office Hours" }]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "All design reviews will take place inside Lab 304 or online via MS Teams. Below are the contact hours for our course moderators:" }
                    ]
                }
            ]
        },
        htmlEmbeds: `
            <div class="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl my-6 flex gap-3 text-amber-900">
                <div class="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0L20 8M4 8l6.3 13"/></svg></div>
                <div class="flex-1">
                    <div class="font-extrabold text-sm uppercase tracking-wider leading-none mb-1">Booking Form Required</div>
                    <div class="text-xs font-semibold leading-relaxed opacity-90">Please book a calendar slot at least 24 hours in advance via the Student Portal. Walk-ins are subject to session availability.</div>
                </div>
            </div>
 
            <table class="w-full border-collapse my-6 text-left text-xs font-medium text-gray-700">
                <thead>
                    <tr class="border-b border-gray-200 bg-gray-50/80">
                        <th class="p-3 font-bold uppercase tracking-wider text-gray-500">Moderator</th>
                        <th class="p-3 font-bold uppercase tracking-wider text-gray-500">Day & Time</th>
                        <th class="p-3 font-bold uppercase tracking-wider text-gray-500">Location</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr>
                        <td class="p-3 font-bold text-gray-900">Dr. Sarah Jenkins</td>
                        <td class="p-3 text-gray-600">Tuesdays | 14:00 - 16:00</td>
                        <td class="p-3 text-gray-600">Lab 304 (Design Office)</td>
                    </tr>
                    <tr>
                        <td class="p-3 font-bold text-gray-900">Prof. Marcus Cole</td>
                        <td class="p-3 text-gray-600">Thursdays | 09:00 - 11:30</td>
                        <td class="p-3 text-gray-600">MS Teams (Online Portal)</td>
                    </tr>
                </tbody>
            </table>
        `
    },
    // Week 1 Theory
    "301": {
        title: "Week 1: Foundations of Adaptive UX",
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Week 1: Foundations of Adaptive UX" }]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "This week we explore the foundational theories behind responsive and adaptive systems, and how accessibility contrast ratios alter visual layouts under various physical conditions." }
                    ]
                }
            ]
        },
        htmlEmbeds: `
            <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80" alt="Design Grid" class="w-full max-h-[300px] object-cover rounded-2xl border border-gray-100 shadow-sm my-6" />
            
            <h3 class="text-lg font-bold text-gray-800 mt-6 mb-3">Key Theoretical Principles</h3>
            <ul class="list-disc pl-5 space-y-2 text-xs font-semibold text-gray-600 my-4">
                <li><strong class="text-gray-900">Fluid Sizing:</strong> Building components that resize with viewport percentages.</li>
                <li><strong class="text-gray-900">Flexbox & Grid Systems:</strong> Declining rigid width anchors in favor of content-driven layouts.</li>
                <li><strong class="text-gray-900">Semantic Nodes:</strong> Restructuring pages using HTML5 layouts so screen readers traverse sections logically.</li>
            </ul>
        `
    },
    // Week 1 Practical
    "302": {
        title: "Week 1 Practical Brief: Building Your First Grid",
        content: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Week 1 Practical Brief: Dynamic Columns" }]
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "In this practical session, you will construct a fluid 3-column system that collapses into single-column rows on mobile viewports." }
                    ]
                }
            ]
        },
        htmlEmbeds: `
            <div class="p-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl my-6 flex gap-3 text-emerald-900">
                <div class="mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <div class="flex-1">
                    <div class="font-extrabold text-sm uppercase tracking-wider leading-none mb-1">Practical Brief Outcomes</div>
                    <div class="text-xs font-semibold leading-relaxed opacity-90">Successfully submit your code zipped on the portal before next Monday at midnight. Late submissions lose 10% per day.</div>
                </div>
            </div>
 
            <h3 class="text-lg font-bold text-gray-800 mt-6 mb-3">Project Requirements Checklist</h3>
            <ol class="list-decimal pl-5 space-y-2 text-xs font-semibold text-gray-600 my-4">
                <li>Create a clean repository inside your workspaces folder.</li>
                <li>Ensure all colors conform to AA contrast ratios (minimum 4.5:1).</li>
                <li>Validate that the grid scales smoothly between 320px and 1920px.</li>
            </ol>
        `
    }
};
 
// Flattened list of course items across modules to calculate Prev / Next
const MOCK_MODULE_ITEMS = [
    { id: 1, label: "Overview Module", type: "document" },
    { id: 101, label: "Study Guide 2026", type: "attachment" },
    { id: 102, label: "Semester Overview", type: "document" },
    { id: 2, label: "Resources Module", type: "document" },
    { id: 201, label: "OW Library", type: "link", isExternal: true },
    { id: 202, label: "Academic Rules", type: "link", isExternal: true },
    { id: 203, label: "Contact Sessions", type: "document" },
    { id: 3, label: "Week 1 Module", type: "document" },
    { id: 301, label: "Week 1 Theory", type: "document" },
    { id: 302, label: "Week 1 Practical", type: "document" }
];
 
export default function CourseItemView({ activeCourseId, activeItemId, isStudentView = false }) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("Blank Page");
    const [editorInstance, setEditorInstance] = useState(null);
    const [showEmbedMenu, setShowEmbedMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    
    // Embed states
    const [imageUrl, setImageUrl] = useState("");
    const [codeSnippet, setCodeSnippet] = useState("");
    const [codeLang, setCodeLang] = useState("css");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    
    const [saveAlert, setSaveAlert] = useState(false);
    const [embedsHtml, setEmbedsHtml] = useState("");
    const fileInputRef = useRef(null);

    const storageKey = `course_item_${activeItemId}`;

    // Compute Previous and Next items
    const { prevItem, nextItem } = useMemo(() => {
        const index = MOCK_MODULE_ITEMS.findIndex(item => item.id.toString() === activeItemId.toString());
        if (index === -1) return { prevItem: null, nextItem: null };
        return {
            prevItem: index > 0 ? MOCK_MODULE_ITEMS[index - 1] : null,
            nextItem: index < MOCK_MODULE_ITEMS.length - 1 ? MOCK_MODULE_ITEMS[index + 1] : null
        };
    }, [activeItemId]);

    // Handle Prev/Next click
    const handleItemNavigation = (item) => {
        if (!item) return;
        if (item.type === "document") {
            navigate(`/courses/${activeCourseId}/items/${item.id}${isStudentView ? "?viewAs=student" : ""}`);
        } else if (item.type === "link") {
            alert(`Opening link: ${item.label}`);
        } else {
            alert(`Downloading attachment: ${item.label}`);
        }
    };

    // Load initial item state
    const itemData = useMemo(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (err) {
                console.error("Failed to parse item content", err);
            }
        }
        
        // Fallback to initial pre-populated schema or generic outline
        const initialSchema = INITIAL_SCHEMAS[activeItemId];
        if (initialSchema) {
            return {
                title: initialSchema.title,
                content: initialSchema.content,
                htmlEmbeds: initialSchema.htmlEmbeds || ""
            };
        }

        const fallbackLabel = MOCK_MODULE_ITEMS.find(i => i.id.toString() === activeItemId.toString())?.label || "New Page";
        return {
            title: fallbackLabel,
            content: {
                type: "doc",
                content: [
                    {
                        type: "heading",
                        attrs: { level: 2 },
                        content: [{ type: "text", text: fallbackLabel }]
                    },
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "Click edit to start building this module layout page..." }]
                    }
                ]
            },
            htmlEmbeds: ""
        };
    }, [activeItemId, storageKey]);

    // Initialize local states when itemData changes
    useEffect(() => {
        setTitle(itemData.title);
        setEmbedsHtml(itemData.htmlEmbeds || "");
        setIsEditing(false);
    }, [itemData]);

    const handleSave = () => {
        if (!editorInstance) return;
        const currentJSON = editorInstance.getJSON();
        
        const updatedData = {
            title: title,
            content: currentJSON,
            htmlEmbeds: embedsHtml
        };

        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        setSaveAlert(true);
        setIsEditing(false);
        setTimeout(() => setSaveAlert(false), 2000);
    };

    // Text formatting actions helper
    const handleFormat = (command, val = undefined) => {
        if (!editorInstance) return;
        editorInstance.chain().focus();
        
        if (command === "heading") {
            editorInstance.chain().focus().toggleHeading({ level: val }).run();
        } else if (command === "paragraph") {
            editorInstance.chain().focus().setParagraph().run();
        } else if (command === "bold") {
            editorInstance.chain().focus().toggleBold().run();
        } else if (command === "italic") {
            editorInstance.chain().focus().toggleItalic().run();
        } else if (command === "underline") {
            editorInstance.chain().focus().toggleUnderline().run();
        } else if (command === "strike") {
            editorInstance.chain().focus().toggleStrike().run();
        } else if (command === "code") {
            editorInstance.chain().focus().toggleCode().run();
        } else if (command === "bullet") {
            editorInstance.chain().focus().toggleBulletList().run();
        } else if (command === "ordered") {
            editorInstance.chain().focus().toggleOrderedList().run();
        } else if (command === "quote") {
            editorInstance.chain().focus().toggleBlockquote().run();
        } else if (command === "color") {
            editorInstance.chain().focus().setColor(val).run();
        }
    };

    // Font size sizing helper (custom spans inside editor)
    const handleFontSize = (sizeName) => {
        if (!editorInstance) return;
        let fontSize = "15px";
        if (sizeName === "small") fontSize = "12px";
        if (sizeName === "large") fontSize = "20px";
        if (sizeName === "xlarge") fontSize = "28px";

        editorInstance.chain().focus().insertContent(`<span style="font-size: ${fontSize}">${editorInstance.state.doc.slice(editorInstance.state.selection.from, editorInstance.state.selection.to).textContent || "Sample Sized Text"}</span>`).run();
    };

    // Image file upload → object URL
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        handleInsertImage(url);
    };

    // Image insertion – appends to embedsHtml state
    const handleInsertImage = (url) => {
        if (!url.trim()) return;
        const html = `<img src="${url.trim()}" alt="Visual" style="width:100%;max-height:340px;object-fit:cover;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin:24px 0;display:block;" />`;
        setEmbedsHtml(prev => prev + html);
        setImageUrl("");
        setShowEmbedMenu(false);
    };

    // Video insertion – appends to embedsHtml state
    const handleInsertVideo = (url) => {
        if (!url.trim()) return;
        let embedUrl = url.trim();
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2].length === 11) {
                embedUrl = `https://www.youtube.com/embed/${match[2]}`;
            }
        }
        const html = `<div style="position:relative;width:100%;padding-top:56.25%;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin:24px 0;"><iframe src="${embedUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
        setEmbedsHtml(prev => prev + html);
        setYoutubeUrl("");
        setShowEmbedMenu(false);
    };

    // Code embed insertion – appends to embedsHtml state
    const handleInsertCode = () => {
        if (!codeSnippet.trim()) return;
        const escaped = codeSnippet.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<pre style="background:#111827;color:#f3f4f6;padding:20px;border-radius:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin:24px 0;"><code>${escaped}</code></pre>`;
        setEmbedsHtml(prev => prev + html);
        setCodeSnippet("");
        setShowEmbedMenu(false);
    };

    // Callout box insertion – appends to embedsHtml state
    const handleInsertCallout = () => {
        const html = `<div style="padding:20px 24px;background:rgba(60,0,120,0.05);border-left:4px solid #3C0078;border-radius:0 16px 16px 0;margin:24px 0;color:#3C0078;"><div style="font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">ℹ Alert Box</div><div style="font-size:13px;font-weight:500;opacity:0.9;">Enter your notification details or custom block guidelines here.</div></div>`;
        setEmbedsHtml(prev => prev + html);
        setShowEmbedMenu(false);
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col min-h-full">
            {/* Top Editor controls and Toggles */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        Module Document Item
                    </span>
                </div>
                
                {/* Save alert toast */}
                {saveAlert && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-extrabold rounded-lg shadow-2xs border border-green-100 animate-pulse">
                        <Sparkles size={13} className="text-green-500" />
                        <span>Layout Saved Successfully!</span>
                    </div>
                )}

                {/* Edit/View toggle for teachers */}
                {!isStudentView && (
                    <button
                        onClick={() => {
                            if (isEditing) {
                                handleSave();
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl cursor-pointer shadow-2xs border transition-all ${
                            isEditing 
                            ? "bg-green-600 border-green-700 text-white hover:bg-green-700" 
                            : "bg-[#3C0078] border-[#2A0054] text-white hover:bg-[#2A0054]"
                        }`}
                    >
                        {isEditing ? (
                            <>
                                <Save size={13} />
                                <span>Save Changes</span>
                            </>
                        ) : (
                            <>
                                <Edit3 size={13} />
                                <span>Edit Layout</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Title / Editor Container */}
            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-[32px] shadow-2xs p-8 md:p-12 min-h-[500px]">
                {/* Title Input or View Label */}
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-3xl font-black outline-none border-b border-gray-100 focus:border-[#3C0078]/40 pb-2 mb-6 w-full text-gray-900 transition-colors placeholder:text-gray-300"
                        placeholder="Page Title"
                    />
                ) : (
                    <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{title}</h1>
                )}

                {/* Gorgeous Canvas-Style Editor Toolbar */}
                {isEditing && (
                    <div className="flex flex-wrap items-center gap-1 bg-gray-50 border border-gray-200 p-2 rounded-2xl mb-6 shadow-3xs z-20">
                        {/* Heading Selector */}
                        <button onClick={() => handleFormat("paragraph")} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg" title="Paragraph">P</button>
                        <button onClick={() => handleFormat("heading", 1)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 1"><Heading1 size={14} /></button>
                        <button onClick={() => handleFormat("heading", 2)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 2"><Heading2 size={14} /></button>
                        <button onClick={() => handleFormat("heading", 3)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 3"><Heading3 size={14} /></button>
                        
                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Font size picker dropdown */}
                        <div className="relative group/size">
                            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-extrabold text-gray-600 hover:bg-gray-200 rounded-lg">
                                <span>Size</span>
                                <ChevronDown size={10} />
                            </button>
                            <div className="absolute hidden group-hover/size:flex flex-col bg-white border border-gray-200 p-1 rounded-xl shadow-lg mt-1 min-w-[120px] left-0">
                                <button onClick={() => handleFontSize("small")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Small (12px)</button>
                                <button onClick={() => handleFontSize("normal")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Normal (15px)</button>
                                <button onClick={() => handleFontSize("large")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Large (20px)</button>
                                <button onClick={() => handleFontSize("xlarge")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-black text-sm">X-Large (28px)</button>
                            </div>
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Standard Mark Styles */}
                        <button onClick={() => handleFormat("bold")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Bold"><Bold size={14} /></button>
                        <button onClick={() => handleFormat("italic")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Italic"><Italic size={14} /></button>
                        <button onClick={() => handleFormat("underline")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Underline"><Underline size={14} /></button>
                        <button onClick={() => handleFormat("strike")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Strikethrough"><Strikethrough size={14} /></button>
                        <button onClick={() => handleFormat("code")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Inline Code"><Code size={14} /></button>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Color Picker dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowColorMenu(!showColorMenu)}
                                className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-0.5" 
                                title="Text Color"
                            >
                                <Palette size={14} />
                                <ChevronDown size={10} />
                            </button>
                            {showColorMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowColorMenu(false)} />
                                    <div className="absolute z-30 bg-white border border-gray-200 p-2 rounded-2xl shadow-xl mt-1.5 flex flex-col gap-1 min-w-[140px] left-0">
                                        <div className="text-[9px] font-black text-gray-400 uppercase px-1 mb-1 tracking-wider">Brand Palette</div>
                                        {TEXT_COLORS.map(c => (
                                            <button
                                                key={c.label}
                                                onClick={() => {
                                                    handleFormat("color", c.color);
                                                    setShowColorMenu(false);
                                                }}
                                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 rounded-lg w-full text-left font-semibold text-gray-700"
                                            >
                                                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: c.color || "#000" }} />
                                                <span>{c.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Lists and Quotes */}
                        <button onClick={() => handleFormat("bullet")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Bullet List"><List size={14} /></button>
                        <button onClick={() => handleFormat("ordered")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Numbered List"><ListOrdered size={14} /></button>
                        <button onClick={() => handleFormat("quote")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Blockquote"><Quote size={14} /></button>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Interactive "+ Insert Embed" Menu */}                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />                        <div className="relative">
                            <button 
                                onClick={() => setShowEmbedMenu(!showEmbedMenu)}
                                className="flex items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#3C0078] border border-purple-100 hover:bg-purple-100 cursor-pointer shadow-3xs"
                            >
                                <Plus size={11} />
                                <span>Insert Embed</span>
                            </button>
                            {showEmbedMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowEmbedMenu(false)} />
                                    <div className="absolute z-30 bg-white border border-gray-200 p-4 rounded-3xl shadow-2xl mt-1.5 flex flex-col gap-3 min-w-[320px] left-0 md:left-auto md:right-0">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-0.5">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Embed Suite</span>
                                            <button onClick={() => setShowEmbedMenu(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                                        </div>

                                        {/* Image section */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Insert Image</label>
                                            {/* Upload from device */}
                                            <button
                                                onClick={() => { setShowEmbedMenu(false); fileInputRef.current?.click(); }}
                                                className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-[#3C0078]/20 rounded-xl text-[10px] font-bold text-[#3C0078] hover:bg-[#3C0078]/5 transition-colors"
                                            >
                                                <Paperclip size={12} />
                                                Upload from device
                                            </button>
                                            {/* URL input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Or paste image URL..."
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40"
                                                />
                                                <button onClick={() => handleInsertImage(imageUrl)} className="px-3 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg">Add</button>
                                            </div>
                                            {/* Preselected quick images */}
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {IMAGE_PRESETS.map((p, idx) => (
                                                    <button
                                                        key={p.label}
                                                        onClick={() => handleInsertImage(p.url)}
                                                        className="text-[9px] font-bold px-2 py-1 bg-gray-100 text-gray-600 hover:bg-[#3C0078]/5 hover:text-[#3C0078] rounded-md transition-colors text-left truncate max-w-[140px]"
                                                        title={p.label}
                                                    >
                                                        Preset {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* YouTube Video iframe */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">YouTube/Vimeo Embed</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Paste video URL..."
                                                    value={youtubeUrl}
                                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40"
                                                />
                                                <button onClick={() => handleInsertVideo(youtubeUrl)} className="px-3 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg">Embed</button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* Styled Code snippet */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Code Snippet (Dark-theme Block)</label>
                                            <textarea
                                                placeholder="Paste source code snippet here..."
                                                rows={2}
                                                value={codeSnippet}
                                                onChange={(e) => setCodeSnippet(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-[#3C0078]/40 font-mono resize-none"
                                            />
                                            <button onClick={handleInsertCode} className="py-1 px-3 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg self-end mt-1">Insert Block</button>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* Styled Notice Box */}
                                        <button
                                            onClick={handleInsertCallout}
                                            className="flex items-center justify-center gap-2 p-2 bg-[#3C0078]/3 border border-[#3C0078]/10 text-[#3C0078] hover:bg-[#3C0078]/8 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors"
                                        >
                                            <AlertCircle size={13} />
                                            <span>Insert Styled Alert Callout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Editor Content Area */}
                <div className="flex-1 relative novel-editor-wrapper select-text font-medium text-xs leading-relaxed text-gray-800">
                    <EditorRoot>
                        <EditorContent
                            initialContent={itemData.content}
                            editable={isEditing}
                            extensions={[
                                StarterKit,
                                Placeholder.configure({ placeholder: "Write some beautiful syllabus materials, assignments guidelines or course information here..." }),
                                TiptapUnderline,
                                TextStyle,
                                Color,
                            ]}
                            onCreate={({ editor }) => {
                                setEditorInstance(editor);
                            }}
                            onUpdate={({ editor }) => {
                                // Auto-save preview content locally (actual save happens on clicking Save button)
                            }}
                            className="w-full max-w-none focus:outline-none min-h-[300px]"
                        />
                        {/* Only render block menus and selections in edit mode */}
                        {isEditing && (
                            <>
                                <NovelBlockMenu />
                            </>
                        )}
                    </EditorRoot>

                    {/* Embeds section – always visible; populated via the Insert Embed toolbar */}
                    {embedsHtml && (
                        <div className="mt-6 border-t border-gray-100/60 pt-6 select-text">
                            <div dangerouslySetInnerHTML={{ __html: embedsHtml }} />
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Clear all media embeds from this page?")) {
                                            setEmbedsHtml("");
                                        }
                                    }}
                                    className="mt-3 flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors"
                                >
                                    <X size={11} /> Clear all embeds
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Bottom Navigation Footer (Canvas-style Prev / Next) */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8 shrink-0 pb-12 select-none">
                {prevItem ? (
                    <button
                        onClick={() => handleItemNavigation(prevItem)}
                        className="flex flex-col text-left items-start gap-1 group py-2.5 px-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all cursor-pointer max-w-[280px] md:max-w-[340px]"
                    >
                        <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>Previous Item</span>
                        </span>
                        <span className="text-xs font-bold text-[#3C0078] truncate w-full mt-0.5 group-hover:underline">
                            {prevItem.label}
                        </span>
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                {nextItem ? (
                    <button
                        onClick={() => handleItemNavigation(nextItem)}
                        className="flex flex-col text-right items-end gap-1 group py-2.5 px-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all cursor-pointer max-w-[280px] md:max-w-[340px]"
                    >
                        <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Next Item</span>
                            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-xs font-bold text-[#3C0078] truncate w-full mt-0.5 group-hover:underline">
                            {nextItem.label}
                        </span>
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>
        </div>
    );
}
