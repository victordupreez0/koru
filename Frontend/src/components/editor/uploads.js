import { newBlockId } from "./pageDocument";

// Files can't live in the document, so a block is inserted holding a ticket for its
// file and picks the file up here when it mounts, then shows its own progress and errors.
const queued = new Map();

export function queueFile(file) {
    const id = newBlockId();
    queued.set(id, file);
    return id;
}

export function takeFile(id) {
    const file = queued.get(id);
    queued.delete(id);
    return file;
}

/** The block nodes for dropped or pasted files. */
export const nodesForFiles = (files) =>
    files.map((file) =>
        file.type.startsWith("image/")
            ? { type: "image", attrs: { uploadId: queueFile(file), alt: file.name.replace(/\.[^.]+$/, "") } }
            : { type: "fileAttachment", attrs: { uploadId: queueFile(file), name: file.name, size: file.size } },
    );

// Set by the slash menu so a freshly inserted block focuses its first field.
export const focusNextBlock = { current: false };
