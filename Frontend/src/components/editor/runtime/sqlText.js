const cell = (value) => (value === null ? "NULL" : typeof value === "number" && !Number.isInteger(value) ? String(Math.round(value * 1e6) / 1e6) : String(value));

/** The text that is compared when marking a query: the last result as lines of "a | b | c". */
export function tableText(table, ordered) {
    if (!table) return "";
    const rows = table.values.map((row) => row.map(cell).join(" | "));
    if (!ordered) rows.sort();
    return [table.columns.join(" | "), ...rows].join("\n");
}
