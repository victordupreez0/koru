import React from "react";
import PageCanvas from "../../../components/PageCanvas";
import { getCourseById, getCourseLecturers } from "../../../services/courseService";
import { Loader } from "lucide-react";
import { Avatar, Card, Skeleton } from "../../../components/UI";

export default function CourseHomeView({ subject, course, loading }) {
  const [pageLoading, setPageLoading] = React.useState(true);
  const [sections, setSections] = React.useState([]);
  const [lecturers, setLecturers] = React.useState([]);
  
  // Cover Image States
  const [showCoverImage, setShowCoverImage] = React.useState(true);
  const [coverImageUrl, setCoverImageUrl] = React.useState("");

  // Initialize course default sections (Overview)
  const makeDefaultSections = () => {
    return [
      {
        id: `text-overview`,
        type: "text",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Course Overview" }]
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: subject?.description || "Welcome to the course homepage! There is currently no custom content published for this course."
                }
              ]
            }
          ]
        }
      }
    ];
  };

  React.useEffect(() => {
    if (!course?.id) return;
    let mounted = true;
    setPageLoading(true);

    // Fetch course details (content) and lecturers
    Promise.all([
      getCourseById(course.id),
      getCourseLecturers(course.id)
    ])
      .then(([courseData, lecturersData]) => {
        if (!mounted) return;
        setLecturers(lecturersData || []);
        
        if (courseData.content) {
          try {
            const parsed = JSON.parse(courseData.content);
            setSections(parsed.sections || []);
            
            // Extract cover image settings
            if (parsed.settings) {
              setShowCoverImage(parsed.settings.showCoverImage !== false);
              setCoverImageUrl(parsed.settings.coverImageUrl || "");
            } else {
              setShowCoverImage(true);
              setCoverImageUrl("");
            }
          } catch (e) {
            console.error("Failed to parse course content", e);
            setSections(makeDefaultSections());
            setShowCoverImage(true);
            setCoverImageUrl("");
          }
        } else {
          setSections(makeDefaultSections());
          setShowCoverImage(true);
          setCoverImageUrl("");
        }
      })
      .catch(err => {
        console.error("Failed to load course home details:", err);
        if (mounted) {
          setSections(makeDefaultSections());
        }
      })
      .finally(() => {
        if (mounted) setPageLoading(false);
      });

    return () => { mounted = false; };
  }, [course?.id]);

  // Use subject imageUrl or a placeholder if not present
  const sampleImg = "https://res.cloudinary.com/dvq3toyi0/image/upload/q_auto/f_auto/v1778533851/AdobeStock_315314252_syaukb.jpg";
  const courseImage = coverImageUrl || subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
      <header className="mb-8 select-none">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton variant="rect" className="h-5 w-20" />
          </div>
        ) : (
          <>
            <h1 className="font-display text-koru-display text-koru-on-surface">
              {subject?.name || "Unknown"}
            </h1>
            <p className="text-koru-heading text-koru-on-surface-variant mt-2">{subject?.code}</p>
          </>
        )}
      </header>

      {pageLoading || loading ? (
        <div className="flex-1 flex flex-col gap-6">
          <Skeleton className="w-full h-[250px]" />
          <div className="flex flex-col gap-3 mt-2">
            {[85, 70, 90, 55, 75].map((w, i) => (
              <Skeleton key={i} variant="rect" className="h-4" width={`${w}%`} />
            ))}
          </div>
          <Skeleton className="h-32 mt-2" />
          <div className="flex flex-col gap-3">
            {[60, 80, 45].map((w, i) => (
              <Skeleton key={i} variant="rect" className="h-4" width={`${w}%`} />
            ))}
          </div>
          <div className="flex gap-4 pt-8 border-t border-koru-outline-faint mt-4">
            {[1, 2].map(i => (
              <Card key={i} tone="muted" className="flex items-center gap-4 flex-1">
                <Skeleton variant="circle" className="w-16 h-16 shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton variant="rect" className="h-4 w-28" />
                  <Skeleton variant="text" className="w-36" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {/* Cover Image */}
          {showCoverImage && (
            <div className="w-full h-[250px] rounded-koru-lg shadow-koru-sm overflow-hidden select-none">
              <img
                src={courseImage}
                alt={subject?.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main Canvas Viewer (Transparent background) */}
          <div className="flex-1 mt-4">
            <PageCanvas
              sections={sections}
              isEditing={false}
              placeholder="There is no custom content published for this course yet."
            />
          </div>

          {/* Lecturers Grid - Centered & Revamped */}
          <section className="w-full pt-16 pb-12 border-t border-koru-outline-faint flex flex-col items-center mt-12">
            <h4 className="text-koru-caption font-medium uppercase tracking-[0.4em] text-koru-on-surface-variant mb-8 text-center select-none">
              Lecturer{lecturers.length > 1 ? "s" : ""}
            </h4>
            <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl">
              {lecturers.map(lecturer => (
                <Card key={lecturer.id} variant="interactive" tone="low" className="flex items-center gap-4 min-w-[280px]">
                  {/* Profile picture */}
                  <Avatar user={lecturer} size={64} />
                  {/* Name and Email */}
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-koru-on-surface leading-tight">
                      {lecturer.firstName} {lecturer.lastName}
                    </span>
                    <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-primary mt-0.5 select-none">
                      Module Head
                    </span>
                    <a
                      href={`mailto:${lecturer.email}`}
                      className="text-xs text-koru-on-surface-variant hover:text-koru-primary font-medium mt-1 break-all transition-colors"
                    >
                      {lecturer.email}
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
