import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Alert, Button, Card, Input } from "../../UI";
import { focusNextBlock } from "../uploads";

/** The empty state shared by the image, video/embed and file blocks: upload and/or paste a link. */
export default function BlockPlaceholder({ icon, title, hint, accept, onFile, onUrl, urlLabel, busy, error, children }) {
    const fileRef = useRef(null);
    const [url, setUrl] = useState("");
    const [autoFocus] = useState(() => {
        const wanted = focusNextBlock.current;
        focusNextBlock.current = false;
        return wanted;
    });

    const submit = (e) => {
        e.preventDefault();
        if (url.trim()) onUrl(url.trim());
    };

    return (
        <Card tone="low" radius="lg" padding="sm" contentEditable={false} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-koru-label text-koru-on-surface">
                <span className="text-koru-on-surface-variant">{icon}</span>
                <span>{title}</span>
            </div>
            {hint ? <p className="text-koru-caption text-koru-on-surface-variant">{hint}</p> : null}

            <div className="flex flex-wrap items-start gap-2">
                {onFile ? (
                    <>
                        <input
                            ref={fileRef}
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                e.target.value = "";
                                if (file) onFile(file);
                            }}
                        />
                        <Button variant="tonal" size="sm" loading={busy} startIcon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>
                            {busy ? "Uploading…" : "Upload"}
                        </Button>
                    </>
                ) : null}

                {onUrl ? (
                    <form onSubmit={submit} className="flex min-w-[240px] flex-1 items-start gap-2">
                        <Input
                            size="sm"
                            aria-label={urlLabel}
                            placeholder={urlLabel}
                            value={url}
                            autoFocus={autoFocus}
                            onChange={(e) => setUrl(e.target.value)}
                            containerClassName="flex-1"
                        />
                        <Button type="submit" size="sm" variant="outlined">Add</Button>
                    </form>
                ) : null}
            </div>

            {children}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </Card>
    );
}
