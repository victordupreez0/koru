import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../../../components/UI";

/**
 * StudentPerspectiveModal Component
 * 
 * Opens an iframe that loads the actual Student view URL.
 * This ensures the admin sees exactly what the live URL looks like
 * without the admin site's styling or logic interfering with the component.
 * 
 * @param {Object} course - The course object to preview
 * @param {Function} onClose - Function to close the modal
 */
export default function StudentPerspectiveModal({ course, onClose }) {
  if (!course) return null;

  // We load the actual app route in an iframe.
  // We add ?viewAs=student to force the router to show the student view
  // and ?hideNav=true to hide menus inside the iframe.
  const previewUrl = `/courses/${course.id}?viewAs=student&hideNav=true`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Student perspective preview" className="fixed inset-0 z-[200] flex items-center justify-center bg-koru-scrim backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-koru-surface-container-high rounded-koru-3xl w-[98vw] h-[95vh] shadow-koru-lg overflow-hidden flex flex-col relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-8 py-3 bg-koru-surface-container-high flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-koru-md bg-koru-primary text-koru-on-primary flex items-center justify-center font-display">
              {course.subject?.code?.[0] || "S"}
            </div>
            <div>
              <h3 className="font-display text-sm text-koru-on-surface uppercase">
                Student Perspective: <span className="text-koru-primary">{course.subject?.name}</span>
              </h3>
              <p className="text-koru-caption text-koru-on-surface-variant uppercase tracking-wider">
                Viewing Live Page Experience • {previewUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="md"
              onClick={onClose}
              title="Close Preview"
              endIcon={<X size={18} aria-hidden="true" />}
            >
              Exit Preview
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-koru-surface-container-lowest relative">
          <iframe 
            src={previewUrl}
            className="w-full h-full border-none"
            title="Student Course Live Preview"
          />
          
          <div className="absolute bottom-6 right-6 pointer-events-none z-[100]">
            <div className="px-4 py-2 rounded-koru-pill bg-koru-primary text-koru-on-primary text-koru-caption font-medium uppercase tracking-wider shadow-koru-md">
              Live URL Preview
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
