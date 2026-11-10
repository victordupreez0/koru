// SQL runs in SQLite compiled to WebAssembly. Every run starts from an empty database
// built by the lecturer's set-up script, so nothing a learner does can carry over.
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { tableText } from "./sqlText";

let engine = null;

export async function runSql(code, setup = "", ordered = false) {
    engine ??= await initSqlJs({ locateFile: () => wasmUrl });
    const db = new engine.Database();
    try {
        try {
            if (setup.trim()) db.run(setup);
        } catch (err) {
            return { stdout: "", tables: [], turtle: [], error: { message: `The tables for this activity couldn't be built: ${err.message}`, line: null } };
        }
        // ponytail: runs on the main thread; these are tiny teaching databases. Move to a worker if lecturers load big ones.
        const tables = db.exec(code);
        return { stdout: tableText(tables.at(-1), ordered), tables, turtle: [], error: null };
    } catch (err) {
        return { stdout: "", tables: [], turtle: [], error: { message: `SQL error: ${err.message}`, line: null } };
    } finally {
        db.close();
    }
}
