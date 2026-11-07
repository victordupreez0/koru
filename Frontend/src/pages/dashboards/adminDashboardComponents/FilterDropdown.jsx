import React from "react";
import { Select } from "../../../components/UI";

export function FilterDropdown({ label, value, options, onChange }) {
  return (
    <Select
      size="sm"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      containerClassName="w-auto"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {label} {opt.label}
        </option>
      ))}
    </Select>
  );
}
