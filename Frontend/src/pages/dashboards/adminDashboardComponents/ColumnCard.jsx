import React from "react";
import { motion } from "framer-motion";
import { Card } from "../../../components/UI";

export function ColumnCard({ children, isSelected, onClick, className = "" }) {
  return (
    <Card
      as={motion.div}
      variant={isSelected ? "filled" : "interactive"}
      tone={isSelected ? "brand" : "surface"}
      radius="2xl"
      padding="none"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus motion-reduce:transition-none ${
        isSelected ? "text-koru-on-primary-container" : "text-koru-on-surface"
      } ${className}`}
    >
      {children}
    </Card>
  );
}
