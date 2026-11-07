import { renderMarkdownBlocks } from "./markdown";
import "./assistant.css";

/** A reply: markdown blocks, then the question block, then the context line. Each piece reveals in turn when `animate`. */
export default function AssistantReply({ message, question, summary, animate = false }) {
  const blocks = renderMarkdownBlocks(message);
  const reveal = (i) => (animate ? { "data-reveal": "", style: { "--i": i } } : {});
  let n = blocks.length;

  return (
    <div className={animate ? "koru-reveal-live" : undefined}>
      <div className="space-y-0.5">
        {blocks.map((b, i) => (
          <div key={i} {...reveal(i)}>{b}</div>
        ))}
      </div>
      {question && (
        <div
          {...reveal(n++)}
          className="mt-3 rounded-koru-md bg-koru-secondary-container px-3 py-2 text-koru-label text-koru-on-secondary-container"
        >
          {question}
        </div>
      )}
      {summary && (
        <p {...reveal(n++)} className="mt-2 text-koru-caption text-koru-on-surface-variant">
          Used: {summary}
        </p>
      )}
    </div>
  );
}
