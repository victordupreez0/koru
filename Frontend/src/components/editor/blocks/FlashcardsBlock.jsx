import React, { useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Hand, Layers, Plus, Shuffle, Trash2 } from "lucide-react";
import { Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import "./FlashcardsBlock.css";

const EXAMPLE_CARDS = [
    { front: "Algorithm 🧩", back: "A list of steps, in order, that solves a problem." },
    { front: "Variable 📦", back: "A named box in memory that stores a value, which can change." },
];

/** Short words get big type; long phrases shrink so they still fit on the card. */
const frontSize = (text) => (text.length <= 14 ? "text-4xl sm:text-5xl" : text.length <= 32 ? "text-2xl sm:text-3xl" : "text-xl");
const backSize = (text) => (text.length <= 60 ? "text-xl sm:text-2xl" : text.length <= 160 ? "text-lg" : "text-koru-body");

function shuffled(n) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

function Card({ card, flipped, onFlip, hint, position, total }) {
    return (
        <button
            type="button"
            onClick={onFlip}
            aria-label={`Card ${position} of ${total}. ${flipped ? `Back: ${card.back}` : `Front: ${card.front}`}. Press to flip.`}
            className="koru-flip group block aspect-[8/5] min-h-52 w-full cursor-pointer rounded-koru-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-4 focus-visible:ring-offset-koru-surface"
        >
            <span className={cn("koru-flip-inner block", flipped && "is-flipped")}>
                <span className="koru-flip-face koru-flip-front flex flex-col items-center justify-center gap-3 overflow-hidden rounded-koru-xl bg-koru-primary-container p-6 text-center text-koru-on-primary-container shadow-koru-md">
                    <span className={cn("max-w-full break-words font-semibold leading-tight", frontSize(card.front))}>{card.front}</span>
                    {hint ? (
                        <span className="koru-flip-hint absolute bottom-4 flex items-center gap-1.5 text-koru-caption opacity-75">
                            <Hand size={13} aria-hidden="true" /> Tap to flip
                        </span>
                    ) : null}
                </span>
                <span className="koru-flip-face koru-flip-back flex flex-col items-center justify-center gap-3 overflow-auto rounded-koru-xl bg-koru-surface-container-low p-6 text-center text-koru-on-surface shadow-koru-md ring-1 ring-inset ring-koru-outline-variant">
                    <span className="text-koru-caption font-medium uppercase tracking-wide text-koru-primary">{card.front}</span>
                    <span className={cn("max-w-full whitespace-pre-line break-words leading-snug", backSize(card.back))}>{card.back}</span>
                </span>
            </span>
        </button>
    );
}

function Play({ attrs }) {
    const { title } = attrs;
    const cards = (Array.isArray(attrs.cards) ? attrs.cards : []).filter((c) => c && (c.front || c.back));
    const reduce = useReducedMotion();
    const [order, setOrder] = useState(null);
    const [pos, setPos] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [direction, setDirection] = useState(1);
    const [touched, setTouched] = useState(false);

    const n = cards.length;
    if (!n) return <p className="text-koru-body text-koru-on-surface-variant">No cards yet. Add some in Set up.</p>;

    const seq = order?.length === n ? order : cards.map((_, i) => i);
    const at = Math.min(pos, n - 1);
    const card = cards[seq[at]];

    const goTo = (to) => {
        const next = Math.max(0, Math.min(n - 1, to));
        if (next === at) return;
        setDirection(next > at ? 1 : -1);
        setPos(next);
        setFlipped(false);
    };
    const flip = () => {
        setFlipped((f) => !f);
        setTouched(true);
    };
    const shuffle = () => {
        setOrder(shuffled(n));
        setDirection(1);
        setPos(0);
        setFlipped(false);
    };
    const onKeyDown = (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); goTo(at + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); goTo(at - 1); }
    };
    const offset = reduce ? 0 : 48;

    return (
        <div role="group" aria-roledescription="flashcards" aria-label={title || "Flashcards"} onKeyDown={onKeyDown} className="flex flex-col gap-4">
            {title ? <h3 className="text-koru-heading text-koru-on-surface">{title}</h3> : null}
            <div className="mx-auto w-full max-w-xl">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <Motion.div
                        key={`${seq[at]}:${at}`}
                        initial={{ opacity: 0, x: direction * offset }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -direction * offset }}
                        transition={{ duration: reduce ? 0.01 : 0.2, ease: "easeOut" }}
                    >
                        <Card card={card} flipped={flipped} onFlip={flip} hint={!touched && at === 0} position={at + 1} total={n} />
                    </Motion.div>
                </AnimatePresence>
            </div>
            <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
                <Button size="icon" variant="tonal" aria-label="Previous card" onClick={() => goTo(at - 1)} disabled={at === 0}>
                    <ChevronLeft size={18} aria-hidden="true" />
                </Button>
                <div className="flex min-w-0 flex-col items-center gap-2">
                    <span className="text-koru-label tabular-nums text-koru-on-surface" aria-live="polite">Card {at + 1} of {n}</span>
                    {n <= 30 ? (
                        <span className="flex flex-wrap justify-center gap-1.5">
                            {seq.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Go to card ${i + 1}`}
                                    aria-current={i === at || undefined}
                                    onClick={() => goTo(i)}
                                    className={cn(
                                        "h-2 cursor-pointer rounded-koru-pill transition-all duration-300 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                        i === at ? "w-6 bg-koru-primary" : "w-2 bg-koru-outline-variant hover:bg-koru-outline",
                                    )}
                                />
                            ))}
                        </span>
                    ) : null}
                </div>
                <Button size="icon" variant="tonal" aria-label="Next card" onClick={() => goTo(at + 1)} disabled={at === n - 1}>
                    <ChevronRight size={18} aria-hidden="true" />
                </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="sm" variant="text" startIcon={<Shuffle size={14} aria-hidden="true" />} onClick={shuffle} disabled={n < 2}>Shuffle</Button>
                <span className="hidden text-koru-caption text-koru-on-surface-variant sm:inline">Space to flip, arrow keys to move</span>
            </div>
        </div>
    );
}

function Author({ attrs, update }) {
    const { title } = attrs;
    const cards = Array.isArray(attrs.cards) ? attrs.cards : [];
    const set = (next) => update({ cards: next });
    const change = (i, patch) => set(cards.map((c, k) => (k === i ? { ...c, ...patch } : c)));
    const move = (i, by) => {
        const next = [...cards];
        [next[i], next[i + by]] = [next[i + by], next[i]];
        set(next);
    };

    return (
        <>
            <Input size="sm" label="Title" placeholder="Words for this week" value={title} onChange={(e) => update({ title: e.target.value })} />
            <ol className="flex flex-col gap-2">
                {cards.map((card, i) => (
                    <li key={i} className="flex flex-wrap items-end gap-2 rounded-koru-md bg-koru-surface-container-low p-2.5 sm:flex-nowrap">
                        <span className="flex h-10 w-7 shrink-0 items-center justify-center text-koru-label tabular-nums text-koru-on-surface-variant">{i + 1}</span>
                        <Input size="sm" label="Front" placeholder="Word" value={card.front} onChange={(e) => change(i, { front: e.target.value })} containerClassName="min-w-40 flex-1" />
                        <Input size="sm" label="Back" placeholder="What it means" value={card.back} onChange={(e) => change(i, { back: e.target.value })} containerClassName="min-w-48 flex-[2]" />
                        <span className="flex shrink-0 gap-0.5">
                            <Button size="icon" variant="text" aria-label={`Move card ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={15} aria-hidden="true" /></Button>
                            <Button size="icon" variant="text" aria-label={`Move card ${i + 1} down`} disabled={i === cards.length - 1} onClick={() => move(i, 1)}><ArrowDown size={15} aria-hidden="true" /></Button>
                            <Button size="icon" variant="text" aria-label={`Remove card ${i + 1}`} disabled={cards.length <= 1} onClick={() => set(cards.filter((_, k) => k !== i))}><Trash2 size={15} aria-hidden="true" /></Button>
                        </span>
                    </li>
                ))}
            </ol>
            <div>
                <Button size="sm" variant="tonal" startIcon={<Plus size={14} aria-hidden="true" />} onClick={() => set([...cards, { front: "", back: "" }])}>Add a card</Button>
            </div>
        </>
    );
}

export const FlashcardsBlock = makeActivityBlock({
    name: "flashcardsBlock",
    label: "Flashcards",
    icon: <Layers size={15} aria-hidden="true" />,
    marked: false,
    attributes: {
        title: { default: "" },
        cards: jsonAttribute("cards", EXAMPLE_CARDS),
    },
    Author,
    Play,
});

/** The two views, exported for tests. */
export { Author as FlashcardsAuthor, Play as FlashcardsPlay };
