/* eslint-disable react-refresh/only-export-components -- makeActivityBlock builds editor nodes, not a component */
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { previewStudentView } from "../../../services/attemptService";
import { Alert, Skeleton } from "../../UI";
import { ActivityPreviewContext } from "../PageBlockContext";
import BlockShell from "./BlockShell";
import { makeInteractiveBlock } from "./interactive";

/**
 * "Try it" inside the editor. The server hands back the block exactly as a student receives it
 * (answer key removed, items shuffled), so what the lecturer tries is what the class will get.
 */
function TryIt({ type, attrs, Play }) {
    const { user } = useAuth();
    // What the server sent back, tagged with the settings it was for, so a change shows the loading state.
    const [loaded, setLoaded] = useState({ for: null });
    const snapshot = JSON.stringify(attrs);

    useEffect(() => {
        let live = true;
        previewStudentView(user.userId, { type, attrs: JSON.parse(snapshot) })
            .then((r) => live && setLoaded({ for: snapshot, view: r.attrs }))
            .catch((err) => live && setLoaded({ for: snapshot, error: err.message }));
        return () => { live = false; };
    }, [type, snapshot, user.userId]);

    const { view, error } = loaded.for === snapshot ? loaded : {};
    if (error) return <Alert variant="error">{error}</Alert>;
    if (!view) return <Skeleton className="h-32 w-full" />;
    return (
        <ActivityPreviewContext.Provider value={{ type, attrs }}>
            <Play attrs={view} />
        </ActivityPreviewContext.Provider>
    );
}

/**
 * Builds an activity block from two components:
 *
 *   Author({ attrs, update })  the lecturer's settings form
 *   Play({ attrs })            what a student does. `attrs` never contains the answer key.
 *                              Marked activities call useBlockAttempt(attrs.blockId) to submit.
 *
 * marked: false makes it something to explore, with no results or progress.
 * label and marked may be functions of the block's attributes.
 */
export function makeActivityBlock({ name, label, icon, attributes, Author, Play, marked = true }) {
    function ActivityView({ node, updateAttributes, editor }) {
        const [tab, setTab] = useState("setup");
        const { attrs } = node;
        const isMarked = typeof marked === "function" ? marked(attrs) : marked;
        const title = typeof label === "function" ? label(attrs) : label;

        if (!editor.isEditable) {
            return (
                <BlockShell icon={icon} label={title} blockId={attrs.blockId} marked={isMarked}>
                    <Play attrs={attrs} />
                </BlockShell>
            );
        }
        return (
            <BlockShell icon={icon} label={title} blockId={attrs.blockId} marked={isMarked} tab={tab} onTab={setTab}>
                {tab === "setup" ? <Author attrs={attrs} update={updateAttributes} /> : isMarked ? <TryIt type={name} attrs={attrs} Play={Play} /> : <Play attrs={attrs} />}
            </BlockShell>
        );
    }
    return makeInteractiveBlock(name, attributes, ActivityView);
}
