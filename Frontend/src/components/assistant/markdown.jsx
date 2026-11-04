const splitRow = (r) => r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function renderTable(rows, key, parseInline) {
  const cells = rows.map(splitRow);
  const hasSep = cells.length > 1 && cells[1].every((c) => /^:?-{2,}:?$/.test(c));
  const head = hasSep ? cells[0] : null;
  const body = cells.slice(hasSep ? 2 : 0);
  return (
    <div key={`table-${key}`} className="my-3 overflow-x-auto">
      <table className="min-w-full text-left text-koru-label text-koru-on-surface-variant">
        {head && (
          <thead>
            <tr>{head.map((c, i) => <th key={i} className="px-3 py-1.5 font-medium text-koru-on-surface">{parseInline(c)}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className="border-t border-koru-outline-faint">
              {r.map((c, ci) => <td key={ci} className="px-3 py-1.5">{parseInline(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export function renderMarkdownBlocks(content) {
  if (!content) return [];

  const lines = content.split("\n");
  const elements = [];
  let currentList = [];
  let currentListType = null;
  let inCodeBlock = false;
  let codeBlockContent = [];

  const flushList = (key) => {
    if (currentList.length === 0) return;
    const Tag = currentListType === "ul" ? "ul" : "ol";
    elements.push(
      <Tag
        key={`list-${key}`}
        className={`${currentListType === "ul" ? "list-disc" : "list-decimal"} pl-5 my-2 space-y-1 text-koru-on-surface-variant`}
      >
        {currentList.map((item, i) => (
          <li key={i} className="leading-relaxed text-sm">{parseInline(item)}</li>
        ))}
      </Tag>
    );
    currentList = [];
    currentListType = null;
  };

  const parseInline = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1)
        return <strong key={i} className="font-medium text-koru-on-surface">{part}</strong>;
      const sub = part.split(/\*([^*]+)\*/g);
      return sub.map((s, j) => {
        if (j % 2 === 1) return <em key={j} className="italic text-koru-on-surface-variant">{s}</em>;
        const code = s.split(/`([^`]+)`/g);
        return code.map((c, k) =>
          k % 2 === 1 ? (
            <code key={k} className="px-1.5 py-0.5 rounded-koru-sm bg-koru-primary-container text-koru-on-primary-container text-[0.8em] font-mono">
              {c}
            </code>
          ) : c
        );
      });
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="p-4 rounded-koru-lg bg-koru-inverse-surface text-koru-inverse-on-surface text-xs font-mono my-3 overflow-x-auto select-all">
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) { codeBlockContent.push(line); continue; }

    if (line.startsWith("### ")) {
      flushList(i);
      elements.push(<h4 key={`h4-${i}`} className="font-display text-sm font-medium text-koru-on-surface mt-4 mb-1.5">{parseInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList(i);
      elements.push(<h3 key={`h3-${i}`} className="font-display text-base font-medium text-koru-on-surface mt-4 mb-2">{parseInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith("# ")) {
      flushList(i);
      elements.push(<h2 key={`h2-${i}`} className="font-display text-lg font-medium text-koru-on-surface mt-5 mb-2">{parseInline(line.slice(2))}</h2>);
      continue;
    }

    if (line.trim().startsWith("|")) {
      flushList(i);
      const rows = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) rows.push(lines[++i]);
      elements.push(renderTable(rows, i, parseInline));
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (currentListType && currentListType !== "ul") flushList(i);
      currentListType = "ul";
      currentList.push(line.trim().slice(2));
      continue;
    }
    const olMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (olMatch) {
      if (currentListType && currentListType !== "ol") flushList(i);
      currentListType = "ol";
      currentList.push(olMatch[2]);
      continue;
    }
    if (line.trim() === "") { flushList(i); continue; }

    flushList(i);
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-sm text-koru-on-surface-variant my-1">{parseInline(line)}</p>
    );
  }
  flushList(lines.length);
  return elements;
}

