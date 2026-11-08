import { fromPageDoc, isDocEmpty, parseStoredContent, safeUrl, toEmbed, toPageDoc } from "../../src/components/editor/pageDocument";

const text = (t) => ({ type: "paragraph", content: [{ type: "text", text: t }] });
const doc = (...content) => ({ type: "doc", content });

describe("safeUrl", () => {
  test.each(["https://a.test/x.png", "http://a.test"])("allows %s", (u) => expect(safeUrl(u)).toBeTruthy());
  test.each(["javascript:alert(1)", "data:text/html,x", "not a url", "", null, 'x.png" onerror="a'])("refuses %s", (u) => expect(safeUrl(u)).toBeNull());
});

describe("toEmbed", () => {
  test.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://docs.google.com/presentation/d/abc123/edit", "https://docs.google.com/presentation/d/abc123/embed"],
    ["https://docs.google.com/document/d/abc123/edit", "https://docs.google.com/document/d/abc123/preview"],
    ["https://drive.google.com/file/d/abc123/view", "https://drive.google.com/file/d/abc123/preview"],
    ["https://www.canva.com/design/DAF/token/view", "https://www.canva.com/design/DAF/token/view?embed"],
  ])("converts %s", (input, src) => expect(toEmbed(input).src).toBe(src));

  test("wraps Figma links", () => {
    expect(toEmbed("https://www.figma.com/design/abc/Thing").src).toContain("https://www.figma.com/embed?embed_host=koru&url=");
  });

  test.each(["https://evil.test/embed", "javascript:parent.x=1", "https://www.youtube.com/watch?v=short", ""])("refuses %s", (u) => expect(toEmbed(u)).toBeNull());
});

describe("toPageDoc", () => {
  test("merges old text sections in order", () => {
    const merged = toPageDoc([
      { id: "a", type: "text", content: doc(text("one")) },
      { id: "b", type: "text", content: doc(text("two")) },
    ]);
    expect(merged.content.map((n) => n.content[0].text)).toEqual(["one", "two"]);
  });

  test("turns old raw HTML embeds into typed blocks", () => {
    const merged = toPageDoc([
      { type: "embed", html: '<img src="https://a.test/a.png" alt="Visual">' },
      { type: "embed", html: '<div><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></div>' },
      { type: "embed", html: "<pre><code>a &lt; b</code></pre>" },
      { type: "embed", html: "<div><div>Alert</div><div>Bring a laptop</div></div>" },
    ]);
    expect(merged.content.map((n) => n.type)).toEqual(["image", "embed", "codeBlock", "callout"]);
    expect(merged.content[0].attrs.alt).toBe("");
    expect(merged.content[2].content[0].text).toBe("a < b");
    expect(merged.content[3].content[0].content[0].text).toBe("Bring a laptop");
  });

  test("drops dangerous embeds instead of keeping them", () => {
    const merged = toPageDoc([
      { type: "embed", html: '<img src="javascript:alert(1)" onerror="alert(2)">' },
      { type: "embed", html: '<iframe src="javascript:alert(3)"></iframe>' },
    ]);
    expect(isDocEmpty(merged)).toBe(true);
    expect(JSON.stringify(merged)).not.toContain("alert");
  });

  test("an unsupported iframe becomes a plain link", () => {
    const [node] = toPageDoc([{ type: "embed", html: '<iframe src="https://other.test/x"></iframe>' }]).content;
    expect(node.content[0].marks[0].attrs.href).toBe("https://other.test/x");
  });

  test("empty input gives an empty document", () => {
    expect(isDocEmpty(toPageDoc([]))).toBe(true);
    expect(isDocEmpty(toPageDoc(undefined))).toBe(true);
  });
});

describe("storage round trip", () => {
  test("a saved page reloads to the same document", () => {
    const original = doc(text("hello"), { type: "embed", attrs: { url: "https://vimeo.com/1" } });
    expect(toPageDoc(fromPageDoc(original))).toEqual(original);
  });

  test("new pages are always one section", () => {
    expect(fromPageDoc(doc(text("x")))).toHaveLength(1);
  });
});

describe("parseStoredContent", () => {
  test("reads JSON", () => expect(parseStoredContent('{"title":"T","sections":[]}').title).toBe("T"));
  test("empty stays empty", () => expect(parseStoredContent(null)).toBeNull());
  test("keeps the words of a non-JSON page", () => {
    const parsed = parseStoredContent("<p>old page</p>");
    expect(parsed.sections[0].content.content[0].content[0].text).toBe("old page");
  });
});

describe("isDocEmpty", () => {
  test("blank paragraphs are empty", () => expect(isDocEmpty(doc({ type: "paragraph" }))).toBe(true));
  test("text is not empty", () => expect(isDocEmpty(doc(text("x")))).toBe(false));
  test("a block is not empty", () => expect(isDocEmpty(doc({ type: "embed", attrs: { url: "" } }))).toBe(false));
});
