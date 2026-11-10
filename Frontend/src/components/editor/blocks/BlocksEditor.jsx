import React, { useEffect, useRef } from "react";
import { Blockly, toolboxFor } from "../runtime/blocksCode";

/**
 * A Blockly workspace. `value` is the saved workspace as a JSON string; `onChange` gets the new
 * string after each change. Loaded only when a page actually has block-based code on it.
 */
export default function BlocksEditor({ value, onChange, toolbox, height = 400 }) {
    const host = useRef(null);
    const workspace = useRef(null);
    const latest = useRef(value);
    const changed = useRef(onChange);
    const toolboxKey = (toolbox ?? []).join(",");

    useEffect(() => { changed.current = onChange; }, [onChange]);

    useEffect(() => {
        const ws = Blockly.inject(host.current, {
            toolbox: toolboxFor(toolboxKey ? toolboxKey.split(",") : []),
            renderer: "zelos",
            trashcan: true,
            sounds: false,
            zoom: { controls: true, wheel: false, startScale: 0.75, maxScale: 1.3, minScale: 0.4 },
            move: { scrollbars: true, drag: true, wheel: true },
        });
        workspace.current = ws;
        const load = (json) => {
            try {
                ws.clear();
                if (json) Blockly.serialization.workspaces.load(JSON.parse(json), ws);
            } catch (err) {
                console.error("These blocks couldn't be loaded:", err);
            }
        };
        ws.koruLoad = load;
        load(latest.current);

        ws.addChangeListener((event) => {
            if (event.isUiEvent || ws.isDragging()) return;
            const json = JSON.stringify(Blockly.serialization.workspaces.save(ws));
            if (json === latest.current) return;
            latest.current = json;
            changed.current?.(json);
        });

        const resize = new ResizeObserver(() => Blockly.svgResize(ws));
        resize.observe(host.current);
        return () => {
            resize.disconnect();
            ws.dispose();
        };
    }, [toolboxKey]);

    // A value that didn't come from this editor (for example "Start again") replaces the blocks.
    useEffect(() => {
        if (value === latest.current || !workspace.current) return;
        latest.current = value;
        workspace.current.koruLoad(value);
    }, [value]);

    return <div ref={host} style={{ height }} className="w-full overflow-hidden rounded-koru-md ring-1 ring-inset ring-koru-outline-variant" />;
}
