import { createContext } from "react";

// What an interactive block needs to know about the page around it.
// pageId is null where interactive blocks aren't offered (course home, notes).
export const PageBlockContext = createContext({ pageId: null, studentPreview: false, attempts: null, onAttempt: null });
