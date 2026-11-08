import React from "react";
import PageCanvas from "../../../components/PageCanvas";
import { getCourseById, getCourseLecturers, updateCourseContent } from "../../../services/courseService";
import { uploadImageToCloudinary } from "../../../services/cloudinaryService";
import { Check, Edit3, Loader, Image as ImageIcon } from "lucide-react";
import { Alert, Avatar, Button, Card, Skeleton } from "../../../components/UI";
import SaveStatus from "../../../components/editor/SaveStatus";
import { useAutosave } from "../../../components/editor/useAutosave";

const saveHome = ({ courseId, ...content }) => updateCourseContent(courseId, JSON.stringify(content));

export function CourseHomeView({ subject, course, loading }) {
  const [pageLoading, setPageLoading] = React.useState(true);
  const [sections, setSections] = React.useState([]);
  const [lecturers, setLecturers] = React.useState([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const { status, schedule, flush } = useAutosave(saveHome);

  // Cover Image States
  const [showCoverImage, setShowCoverImage] = React.useState(true);
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [uploadingCover, setUploadingCover] = React.useState(false);

  const canvasRef = React.useRef(null);
  const coverUploadRef = React.useRef(null);

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
                  text: subject?.description || "Welcome to the course homepage! Click Edit to customize the overview, syllabus details, or class instructions."
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
    setIsEditing(false);

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

  const queueSave = (settings = {}) => {
    if (!canvasRef.current || !course?.id) return;
    schedule({
      courseId: course.id,
      sections: canvasRef.current.getSections(),
      settings: { showCoverImage, coverImageUrl, ...settings },
    });
  };

  const finishEditing = async () => {
    const latest = canvasRef.current?.getSections();
    if (await flush()) {
      if (latest) setSections(latest);
      setIsEditing(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try {
      setUploadingCover(true);
      const url = await uploadImageToCloudinary(file);
      setCoverImageUrl(url);
      queueSave({ coverImageUrl: url });
    } catch (err) {
      console.error("Cover image upload failed:", err);
    } finally {
      setUploadingCover(false);
    }
  };

  // Use subject imageUrl or a placeholder if not present
  const sampleImg = "https://res.cloudinary.com/dvq3toyi0/image/upload/q_auto/f_auto/v1778533851/AdobeStock_315314252_syaukb.jpg";
  const courseImage = coverImageUrl || subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
      <header className="mb-8 flex justify-between items-start select-none">
        <div>
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton width={256} height={36} />
              <Skeleton variant="text" width={80} height={20} />
            </div>
          ) : (
            <>
              <h1 className="font-display text-koru-display text-koru-on-surface">
                {subject?.name || "Unknown"}
              </h1>
              <p className="text-xl text-koru-on-surface-variant mt-2">{subject?.code}</p>
            </>
          )}
        </div>
        {!loading && !pageLoading && (
          <div className="flex items-center gap-4">
            {isEditing && <SaveStatus status={status} />}
            <Button
              variant={isEditing ? "accent" : "filled"}
              size="sm"
              onClick={() => (isEditing ? finishEditing() : setIsEditing(true))}
              startIcon={isEditing ? <Check size={13} /> : <Edit3 size={13} />}
            >
              {isEditing ? "Done" : "Edit Home Page"}
            </Button>
          </div>
        )}
      </header>

      {pageLoading || loading ? (
        <div className="flex-1 flex flex-col gap-6">
          {/* Cover image skeleton */}
          <Skeleton height={250} className="w-full" />
          {/* Content lines */}
          <div className="flex flex-col gap-3 mt-2">
            {[85, 70, 90, 55, 75].map((w, i) => (
              <Skeleton key={i} variant="text" height={16} width={`${w}%`} />
            ))}
          </div>
          <Skeleton height={128} className="w-full mt-2" />
          <div className="flex flex-col gap-3">
            {[60, 80, 45].map((w, i) => (
              <Skeleton key={i} variant="text" height={16} width={`${w}%`} />
            ))}
          </div>
          {/* Lecturer skeleton */}
          <div className="flex gap-4 pt-8 mt-4">
            {[1, 2].map(i => (
              <Card key={i} tone="low" className="flex items-center gap-4 flex-1">
                <Skeleton variant="circle" width={64} height={64} className="shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton variant="text" height={16} width={112} />
                  <Skeleton variant="text" width={144} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {/* Cover Image */}
          {showCoverImage && (
            <div className="w-full h-[250px] rounded-koru-lg shadow-koru-card overflow-hidden select-none">
              <img 
                src={courseImage} 
                alt={subject?.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Cover Image Toggle & Upload Controls */}
          {isEditing && (
            <Card tone="low" padding="sm" className="flex flex-wrap items-center gap-3 select-none">
              <span className="text-xs font-medium text-koru-on-surface flex items-center gap-1.5">
                <ImageIcon size={14} className="text-koru-on-surface-variant" />
                <span>Cover Image Settings:</span>
              </span>
              <Button
                variant={showCoverImage ? "tonal" : "outlined"}
                size="sm"
                onClick={() => {
                  setShowCoverImage(!showCoverImage);
                  queueSave({ showCoverImage: !showCoverImage });
                }}
              >
                {showCoverImage ? "Hide Cover" : "Show Cover"}
              </Button>
              {showCoverImage && (
                <>
                  <input
                    ref={coverUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => coverUploadRef.current?.click()}
                    disabled={uploadingCover}
                    startIcon={uploadingCover ? <Loader size={11} className="animate-spin motion-reduce:animate-none" /> : null}
                  >
                    {uploadingCover ? "Uploading…" : "Upload New Cover"}
                  </Button>
                </>
              )}
            </Card>
          )}
          
          {/* Main Canvas Editor (Transparent background) */}
          <div className="flex-1 mt-4">
            <PageCanvas
              ref={canvasRef}
              sections={sections}
              isEditing={isEditing}
              onChange={() => queueSave()}
              placeholder="Customize the course homepage with syllabus outlines, assignments guidelines, and other important course resources..."
            />
          </div>

          {/* Lecturers Grid - Centered & Revamped */}
          <section className="w-full pt-16 pb-12 border-t border-koru-outline-variant flex flex-col items-center mt-12">
            <h4 className="text-koru-caption font-medium uppercase tracking-[0.2em] text-koru-on-surface-variant mb-8 text-center select-none">
              Lecturer{lecturers.length > 1 ? "s" : ""}
            </h4>
            <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl">
              {lecturers.map(lecturer => (
                <Card key={lecturer.id} variant="outlined" tone="low" padding="sm" className="flex items-center gap-4 min-w-[280px]">
                  {/* Profile picture */}
                  <Avatar user={lecturer} size={64} className="shadow-koru-md" />
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
                      className="text-xs text-koru-on-surface-variant hover:text-koru-primary mt-1 break-all transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus rounded-koru-xs"
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
