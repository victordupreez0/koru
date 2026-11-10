import React, { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "../../UI";

const VIEW = 200; // the canvas shows -200..200 in both directions, like a small turtle window
const cost = (c) => (c[0] === "line" ? Math.max(1, Math.hypot(c[4] - c[2], c[5] - c[3])) : c[0] === "move" ? 12 : c[0] === "turn" ? 6 : 1);

/** How far the drawing reaches, so big drawings are zoomed out to fit. */
function reach(commands) {
    let far = VIEW;
    const see = (x, y) => { far = Math.max(far, Math.abs(x) + 12, Math.abs(y) + 12); };
    for (const c of commands) {
        if (c[0] === "line") { see(c[2], c[3]); see(c[4], c[5]); }
        else if (c[0] === "move") see(c[2], c[3]);
        else if (c[0] === "dot" || c[0] === "text") see(c[2], c[3]);
    }
    return far;
}

/**
 * Replays turtle drawing commands (from Python's turtle module or the block turtle) on a canvas.
 * The drawing is animated at a pace that finishes in a few seconds however long it is.
 */
export default function TurtleCanvas({ commands }) {
    const paper = useRef(null); // what has been drawn so far
    const overlay = useRef(null); // the line being drawn and the turtle itself
    const [replay, setReplay] = useState(0);

    useEffect(() => {
        const canvas = paper.current;
        const top = overlay.current;
        const size = canvas.clientWidth;
        const ratio = window.devicePixelRatio || 1;
        for (const el of [canvas, top]) {
            el.width = size * ratio;
            el.height = size * ratio;
        }
        const scale = (size * ratio) / (2 * reach(commands));
        const px = (x) => (size * ratio) / 2 + x * scale;
        const py = (y) => (size * ratio) / 2 - y * scale;
        const ctx = canvas.getContext("2d");
        const pen = top.getContext("2d");
        for (const c of [ctx, pen]) {
            c.lineCap = "round";
            c.lineJoin = "round";
        }
        canvas.style.background = "#ffffff";

        const turtles = {}; // id -> { x, y, heading, visible }
        const primary = getComputedStyle(canvas).getPropertyValue("--color-koru-primary").trim() || "#6b4fa0";

        const stroke = (target, x1, y1, x2, y2, color, width) => {
            target.strokeStyle = color;
            target.lineWidth = Math.max(1, width * scale * 1.2);
            target.beginPath();
            target.moveTo(px(x1), py(y1));
            target.lineTo(px(x2), py(y2));
            target.stroke();
        };

        const apply = (c) => {
            const t = turtles[c[1]];
            switch (c[0]) {
                case "new": turtles[c[1]] = { x: 0, y: 0, heading: 0, visible: true }; break;
                case "line": stroke(ctx, c[2], c[3], c[4], c[5], c[6], c[7]); t.x = c[4]; t.y = c[5]; break;
                case "move": t.x = c[2]; t.y = c[3]; break;
                case "turn": t.heading = c[2]; break;
                case "show": t.visible = c[2]; break;
                case "bg": canvas.style.background = c[1]; break;
                case "clear": ctx.clearRect(0, 0, canvas.width, canvas.height); break;
                case "dot":
                    ctx.fillStyle = c[5];
                    ctx.beginPath();
                    ctx.arc(px(c[2]), py(c[3]), Math.max(1, (c[4] * scale) / 2), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case "text":
                    ctx.fillStyle = c[5];
                    ctx.font = `${Math.max(10, c[6] * scale * 1.3)}px sans-serif`;
                    ctx.textAlign = c[7] === "center" || c[7] === "right" ? c[7] : "left";
                    ctx.fillText(c[4], px(c[2]), py(c[3]));
                    break;
                case "fill":
                    // Painted behind what is already there, so the outline stays crisp.
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fillStyle = c[2];
                    ctx.beginPath();
                    c[3].forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    break;
                default: break;
            }
        };

        const drawTurtles = (partial) => {
            pen.clearRect(0, 0, top.width, top.height);
            if (partial) stroke(pen, ...partial);
            for (const t of Object.values(turtles)) {
                if (!t.visible) continue;
                const [x, y] = partial && partial.turtle === t ? [partial[2], partial[3]] : [t.x, t.y];
                const r = 9 * ratio;
                pen.save();
                pen.translate(px(x), py(y));
                pen.rotate((-t.heading * Math.PI) / 180);
                pen.fillStyle = primary;
                pen.beginPath();
                pen.moveTo(r, 0);
                pen.lineTo(-r * 0.7, r * 0.65);
                pen.lineTo(-r * 0.35, 0);
                pen.lineTo(-r * 0.7, -r * 0.65);
                pen.closePath();
                pen.fill();
                pen.restore();
            }
        };

        const total = commands.reduce((sum, c) => sum + cost(c), 0);
        const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches || commands.some((c) => c[0] === "speed" && c[1] === 0);
        const duration = instant ? 0 : Math.min(7000, Math.max(700, total * 2.2));
        let done = 0; // commands fully drawn
        let spent = 0; // cost of those commands
        let frame = 0;
        const started = performance.now();

        const tick = (now) => {
            const budget = duration ? (total * (now - started)) / duration : Infinity;
            while (done < commands.length && spent + cost(commands[done]) <= budget) {
                spent += cost(commands[done]);
                apply(commands[done]);
                done++;
            }
            const next = commands[done];
            let partial = null;
            if (next?.[0] === "line") {
                const part = Math.min(1, (budget - spent) / cost(next));
                partial = [next[2], next[3], next[2] + (next[4] - next[2]) * part, next[3] + (next[5] - next[3]) * part, next[6], next[7]];
                partial.turtle = turtles[next[1]];
            }
            drawTurtles(partial);
            if (done < commands.length) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [commands, replay]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-koru-md ring-1 ring-inset ring-koru-outline-variant">
                <canvas ref={paper} className="absolute inset-0 h-full w-full" role="img" aria-label="What the program drew" />
                <canvas ref={overlay} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            </div>
            <Button variant="text" size="sm" startIcon={<RotateCcw size={13} />} onClick={() => setReplay((n) => n + 1)}>Draw it again</Button>
        </div>
    );
}
