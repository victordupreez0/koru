import React from "react";
import { Search } from "lucide-react";
import { Input } from "../../../components/UI";

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <Input
      size="sm"
      type="text"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      startIcon={<Search className="h-4 w-4" />}
      containerClassName="max-w-[200px]"
    />
  );
}
