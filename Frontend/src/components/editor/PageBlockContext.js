import { createContext } from "react";

// What an interactive block needs to know about the page around it.
// pageId is null where interactive blocks aren't offered (course home, notes).
export const PageBlockContext = createContext({ pageId: null, studentPreview: false, attempts: null, onAttempt: null });

// Set while a lecturer tries a block inside the editor: { type, attrs } of the unsaved block,
// so answers are marked against what is on screen instead of the saved page.
export const ActivityPreviewContext = createContext(null);
