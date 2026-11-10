import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, ClipboardCheck, PencilLine, Search, Sparkles, Store } from "lucide-react";
import HeaderTopBar from "../components/HeaderTopBar";
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/UI";
import { useCourses } from "../contexts/CoursesContext";
import { cn } from "../utils/cn";
import { APPROACHES, GRADE_BANDS, LISTINGS, SUBJECTS, gradeLabel } from "./marketplace/listings";

// A preview of the curriculum marketplace: browse, open, "add to my family". Only Koru Coding
// is real; adding anything else just explains what will happen once the marketplace is live.

// Same colours as the banner block in the editor.
const THEMES = {
    purple: ["--color-koru-primary", "--color-koru-stat-violet"],
    ocean: ["--color-koru-info", "--color-koru-stat-sky"],
    forest: ["--color-koru-success", "--color-koru-stat-green"],
    sunset: ["--color-koru-accent-ink", "--color-koru-stat-orange"],
    night: ["--color-koru-inverse-surface", "--color-koru-stat-slate"],
};
const gradient = (theme) => {
    const [from, to] = THEMES[theme] ?? THEMES.purple;
    return `linear-gradient(135deg, var(${from}), var(${to}))`;
};

function Cover({ listing, large = false }) {
    return (
        <div className={cn("relative flex items-center justify-center overflow-hidden", large ? "h-36 rounded-koru-lg" : "h-28")} style={{ background: gradient(listing.theme) }}>
            <span aria-hidden="true" className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
            <span aria-hidden="true" className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-white/10" />
            <span aria-hidden="true" className={large ? "text-6xl" : "text-5xl"}>{listing.emoji}</span>
        </div>
    );
}

function ListingCard({ listing, onOpen }) {
    return (
        <Card as="button" type="button" variant="interactive" tone="surface" padding="none" radius="lg" onClick={() => onOpen(listing)} className="flex flex-col overflow-hidden text-left">
            <Cover listing={listing} />
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="primary">{listing.approach}</Badge>
                    <Badge>{gradeLabel(listing.grades)}</Badge>
                    {listing.real ? <Badge variant="success">Available now</Badge> : null}
                </div>
                <h3 className="text-koru-title text-koru-on-surface">{listing.title}</h3>
                <p className="text-koru-caption text-koru-on-surface-variant">by {listing.creator}</p>
                <p className="line-clamp-2 text-koru-body text-koru-on-surface-variant">{listing.blurb}</p>
                <div className="mt-auto flex items-center justify-between pt-2 text-koru-caption">
                    <span className="text-koru-on-surface-variant">{listing.units.length} {listing.real ? "courses" : "units"}</span>
                    <span className="font-semibold text-koru-on-surface">{listing.price}</span>
                </div>
            </div>
        </Card>
    );
}

/** Lessons as a winding path of bubbles, the way homeschool families already know it. */
function BubblePath({ listing, courseFor, onOpenCourse }) {
    return (
        <ol className="flex flex-col gap-1 py-2">
            {listing.units.map((unit, i) => {
                const title = typeof unit === "string" ? unit : unit.title;
                const course = typeof unit === "string" ? null : courseFor(unit.code);
                const offset = ["ml-0", "ml-10", "ml-16", "ml-10"][i % 4];
                const bubble = (
                    <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-koru-label font-semibold text-white shadow-koru-sm ring-4 ring-white/60"
                        style={{ background: gradient(listing.theme) }}
                    >
                        {i + 1}
                    </span>
                );
                return (
                    <li key={title} className={cn("flex items-center gap-3", offset)}>
                        {course ? (
                            <button type="button" onClick={() => onOpenCourse(course)} className="flex items-center gap-3 rounded-full pr-3 text-left transition hover:bg-koru-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-primary">
                                {bubble}
                                <span className="text-koru-body text-koru-primary underline-offset-2 hover:underline">{title}</span>
                            </button>
                        ) : (
                            <>
                                {bubble}
                                <span className="text-koru-body text-koru-on-surface">{title}</span>
                            </>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

const HOW_IT_WORKS = [
    { icon: Store, title: "Add it to your family", text: "The lessons are copied into your own courses, ready for each child." },
    { icon: PencilLine, title: "Change anything", text: "Edit any lesson, swap an activity, or ask the AI to make it about dinosaurs." },
    { icon: ClipboardCheck, title: "Records keep themselves", text: "Activities mark themselves, so you have marks and progress ready for your assessor." },
];

function ListingDetails({ listing, onClose }) {
    const navigate = useNavigate();
    const { allCourses } = useCourses();
    const [added, setAdded] = useState(false);

    const courseFor = (code) => allCourses.find((c) => c.label === code) ?? null;
    const openCourse = (course) => { onClose(); navigate(course.href); };
    const firstCourse = listing.real ? listing.units.map((u) => courseFor(u.code)).find(Boolean) : null;

    return (
        <Modal
            open
            onClose={onClose}
            size="xl"
            title={listing.title}
            description={`by ${listing.creator} · ${gradeLabel(listing.grades)} · ${listing.approach}`}
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                    <span className="text-koru-title text-koru-on-surface">{listing.price}</span>
                    {firstCourse ? (
                        <Button onClick={() => openCourse(firstCourse)}>Open the first course</Button>
                    ) : (
                        <Button startIcon={added ? <BadgeCheck size={16} /> : <Sparkles size={16} />} onClick={() => setAdded(true)} disabled={added}>
                            {added ? "Added (preview)" : "Add to my family"}
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                <Cover listing={listing} large />
                <p className="text-koru-body text-koru-on-surface">{listing.blurb}</p>
                {added ? (
                    <Alert variant="info">This is a preview of the marketplace. Once it opens, adding a curriculum copies all its lessons into your own courses, ready to use as they are or change however you like.</Alert>
                ) : null}
                <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
                    <section>
                        <h3 className="text-koru-label font-semibold text-koru-on-surface">What's inside</h3>
                        {listing.real ? <p className="text-koru-caption text-koru-on-surface-variant">Tap a bubble to open that course.</p> : null}
                        <BubblePath listing={listing} courseFor={courseFor} onOpenCourse={openCourse} />
                    </section>
                    <section className="flex flex-col gap-3">
                        <h3 className="text-koru-label font-semibold text-koru-on-surface">How it works on Koru</h3>
                        {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
                            <Card key={title} tone="low" padding="sm" className="flex gap-3">
                                <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-koru-primary" />
                                <div>
                                    <p className="text-koru-label text-koru-on-surface">{title}</p>
                                    <p className="text-koru-caption text-koru-on-surface-variant">{text}</p>
                                </div>
                            </Card>
                        ))}
                        <div className="flex flex-wrap gap-1.5">
                            {listing.subjects.map((s) => <Badge key={s}>{s}</Badge>)}
                        </div>
                    </section>
                </div>
            </div>
        </Modal>
    );
}

export default function Marketplace() {
    const [query, setQuery] = useState("");
    const [approach, setApproach] = useState("All");
    const [band, setBand] = useState("");
    const [subject, setSubject] = useState("");
    const [open, setOpen] = useState(null);

    const shown = useMemo(() => {
        const words = query.trim().toLowerCase();
        const range = GRADE_BANDS.find((b) => b.id === band);
        return LISTINGS.filter((l) =>
            (approach === "All" || l.approach === approach) &&
            (!subject || l.subjects.includes(subject)) &&
            (!range || (l.grades[0] <= range.max && l.grades[1] >= range.min)) &&
            (!words || `${l.title} ${l.creator} ${l.blurb} ${l.subjects.join(" ")}`.toLowerCase().includes(words)),
        );
    }, [query, approach, band, subject]);

    const clear = () => { setQuery(""); setApproach("All"); setBand(""); setSubject(""); };

    return (
        <div className="flex flex-col overflow-hidden text-koru-on-surface transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full md:rounded-koru-lg md:bg-koru-surface-container-lowest md:shadow-koru-card md:ring-1 md:ring-koru-outline-faint md:backdrop-blur-xl max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 max-md:h-screen max-md:w-screen max-md:bg-koru-surface-container-lowest">
            <HeaderTopBar />
            <div className="flex-1 overflow-y-auto px-4 pb-12 pt-6 md:px-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <div className="relative overflow-hidden rounded-koru-xl px-6 py-8 text-white shadow-koru-md md:px-10" style={{ background: gradient("purple") }}>
                        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
                        <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10" />
                        <div className="relative flex max-w-2xl flex-col gap-2">
                            <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-koru-caption font-semibold">Preview: example listings</span>
                            <h1 className="text-koru-display">Find a curriculum. Make it yours.</h1>
                            <p className="text-white/85">Every curriculum here opens as lessons you can use as they are or change however you like, for each of your children.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
                            <Input aria-label="Search curricula" placeholder="Search: fractions, Latin, nature…" startIcon={<Search size={16} />} value={query} onChange={(e) => setQuery(e.target.value)} />
                            <Select aria-label="Grade" value={band} onChange={(e) => setBand(e.target.value)}>
                                <option value="">Any grade</option>
                                {GRADE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                            </Select>
                            <Select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                                <option value="">Any subject</option>
                                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div role="group" aria-label="Approach" className="flex flex-wrap gap-2">
                            {["All", ...APPROACHES].map((a) => (
                                <button
                                    key={a}
                                    type="button"
                                    aria-pressed={approach === a}
                                    onClick={() => setApproach(a)}
                                    className={cn(
                                        "rounded-full px-3 py-1.5 text-koru-label transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-primary",
                                        approach === a ? "bg-koru-primary text-koru-on-primary" : "bg-koru-surface-container text-koru-on-surface-variant hover:bg-koru-surface-container-high",
                                    )}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {shown.length ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {shown.map((l) => <ListingCard key={l.id} listing={l} onOpen={setOpen} />)}
                        </div>
                    ) : (
                        <EmptyState icon={<Search size={20} />} title="No curricula match" description="Try another grade or subject." action={<Button variant="tonal" onClick={clear}>Clear filters</Button>} />
                    )}

                    <Card tone="brand" radius="lg" padding="lg" className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-koru-title text-koru-on-primary-container">Written your own curriculum?</h2>
                            <p className="text-koru-body text-koru-on-primary-container/80">Publish it on Koru and other families can use it, change it and pay you for it.</p>
                        </div>
                        <Button variant="filled" disabled>Selling opens soon</Button>
                    </Card>
                </div>
            </div>
            {open ? <ListingDetails key={open.id} listing={open} onClose={() => setOpen(null)} /> : null}
        </div>
    );
}
