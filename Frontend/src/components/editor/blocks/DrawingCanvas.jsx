import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const UI_OPTIONS = {
    tools: { image: false }, // pictures would bloat the page JSON; use an image block instead
    canvasActions: { loadScene: false, saveToActiveFile: false, export: false, toggleTheme: false, changeViewBackgroundColor: false },
};

/** Excalidraw is large, so this file is only loaded when someone actually opens a drawing. */
const DrawingCanvas = forwardRef(function DrawingCanvas({ elements }, ref) {
    const api = useRef(null);

    useImperativeHandle(ref, () => ({
        async getResult() {
            const current = api.current.getSceneElements();
            if (current.length === 0) return { elements: [], svg: "" };
            const svg = await exportToSvg({
                elements: current,
                appState: { ...api.current.getAppState(), exportBackground: true, viewBackgroundColor: "#ffffff" },
                files: api.current.getFiles(),
                exportPadding: 16,
            });
            return { elements: current, svg: svg.outerHTML };
        },
    }));

    return (
        <Excalidraw
            excalidrawAPI={(instance) => { api.current = instance; }}
            initialData={{ elements, appState: { viewBackgroundColor: "#ffffff" }, scrollToContent: true }}
            UIOptions={UI_OPTIONS}
        />
    );
});

export default DrawingCanvas;
