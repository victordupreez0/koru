import React from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandList,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  StarterKit,
  Placeholder,
  TiptapUnderline,
  Color,
  TextStyle,
  createSuggestionItems,
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
} from "lucide-react";
import NovelBlockMenu from "./NovelBlockMenu";

const suggestionItems = createSuggestionItems([
  {
    title: "Heading 1",
    searchTerms: ["title", "heading", "h1"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    searchTerms: ["subtitle", "heading", "h2"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    searchTerms: ["heading", "h3"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    searchTerms: ["unordered", "list", "bullet"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    searchTerms: ["ordered", "list", "number"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    searchTerms: ["blockquote", "quote"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    searchTerms: ["code", "codeblock"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
]);

export default function NovelEditor({
  initialContent = { type: "doc", content: [{ type: "paragraph" }] },
  onUpdate = () => {},
  placeholder = "Type something...",
  className = "w-full max-w-none focus:outline-none dark:text-slate-100",
  editorClassName = "",
  showBlockMenu = true,
  showBubbleMenu = true,
  showSlashCommands = true,
}) {
  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialContent}
        extensions={[
          StarterKit,
          Placeholder.configure({ placeholder }),
          TiptapUnderline,
          TextStyle,
          Color,
        ]}
        onUpdate={({ editor }) => {
          if (editor) onUpdate(editor);
        }}
        className={`${className} ${editorClassName}`}
      >
        {showBubbleMenu && (
          <EditorBubble className="flex items-center gap-0.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1 shadow-xl">
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBold().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Bold">
                <Bold size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleItalic().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Italic">
                <Italic size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Underline">
                <Underline size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleStrike().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Strikethrough">
                <Strikethrough size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleCode().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Inline Code">
                <Code size={16} />
              </button>
            </EditorBubbleItem>

            <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />

            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Heading 1">
                <Heading1 size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Heading 2">
                <Heading2 size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Heading 3">
                <Heading3 size={16} />
              </button>
            </EditorBubbleItem>

            <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />

            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBulletList().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Bullet List">
                <List size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleOrderedList().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Numbered List">
                <ListOrdered size={16} />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBlockquote().run()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Quote">
                <Quote size={16} />
              </button>
            </EditorBubbleItem>
          </EditorBubble>
        )}

        {showBlockMenu && <NovelBlockMenu />}

        {showSlashCommands && (
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 py-2 shadow-xl transition-all">
            <EditorCommandEmpty className="px-2 text-gray-500 dark:text-slate-400">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                  key={item.title}
                >
                  <span>{item.title}</span>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        )}
      </EditorContent>
    </EditorRoot>
  );
}
