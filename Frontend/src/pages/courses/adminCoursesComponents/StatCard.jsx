import React from "react";
import { motion } from "framer-motion";
import ProgressRing from "../../../components/UI/progressRing";

export default function StatCard({ label, value, icon: Icon, trend, accent = false }) {
  const isPercentage = typeof value === 'string' && value.endsWith('%');
  const numericValue = isPercentage ? parseInt(value.replace('%', '')) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-koru-2xl p-6 flex flex-col justify-between gap-4 transition-shadow motion-reduce:transition-none ${accent ? "bg-koru-primary text-koru-on-primary shadow-koru-md" : "bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card hover:shadow-koru-card-hover"}`}
    >
      <div className="flex justify-between items-start">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-koru-md ${accent ? "bg-koru-on-primary/10" : "bg-koru-primary-container"}`}>
          <Icon size={20} className={accent ? "text-koru-on-primary" : "text-koru-on-primary-container"} />
        </span>
        {trend && <div className={`text-koru-caption font-medium ${accent ? "text-koru-on-primary/60" : "text-koru-primary"}`}>{trend}</div>}
      </div>
      
      <div className="flex flex-col gap-1">
        {isPercentage ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 scale-50 -ml-4 -mr-4">
              <ProgressRing 
                percentage={numericValue} 
                size={80} 
                strokeWidth={10} 
              />
            </div>
            <div>
              <span className={`text-koru-caption font-medium uppercase tracking-wider block ${accent ? "text-koru-on-primary/70" : "text-koru-on-surface-variant"}`}>{label}</span>
              <span className={`font-display text-2xl ${accent ? "text-koru-on-primary" : "text-koru-on-surface"}`}>{value}</span>
            </div>
          </div>
        ) : (
          <>
            <span className={`text-koru-caption font-medium uppercase tracking-wider block mb-1 ${accent ? "text-koru-on-primary/70" : "text-koru-on-surface-variant"}`}>{label}</span>
            <span className={`font-display text-3xl ${accent ? "text-koru-on-primary" : "text-koru-on-surface"}`}>{value}</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
