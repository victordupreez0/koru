# Koru

**William's Pweddy Pwintesses**

Chloe Robinson - 241040, Rikus Pretorius - 241044, Victor du Preez - 241250, Danae Swart - 241022

Open Window, Department of Fundamentals
Interactive Development, DV300
Tsungai Katsuro, William Basson

## Table of Contents

- [List of Figures](#list-of-figures)
- [Project Introduction](#project-introduction)
- [What is Koru?](#what-is-koru)
- [Core Objectives](#core-objectives)
- [Summary of Client Requirements](#summary-of-client-requirements)
- [Why the Project is Valuable to the Client](#why-the-project-is-valuable-to-the-client)
- [Team Introduction](#team-introduction)
- [Team Setup](#team-setup)
- [Technologies Used](#technologies-used)
- [Reasoning Behind Frameworks and Tools](#reasoning-behind-frameworks-and-tools)
- [Technical Decisions](#technical-decisions)
- [Structure of Application](#structure-of-application)
- [Architecture](#architecture)
- [Key Entities](#key-entities)
- [Key API Endpoints](#key-api-endpoints)
- [Testing Approach](#testing-approach)
- [Test Report](#test-report)
- [External Feedback](#external-feedback)
- [Challenges and Future Implementation](#challenges-and-future-implementation)
- [Additional Features and Optimisations](#additional-features-and-optimisations)
- [Conclusion](#conclusion)

## List of Figures

- **Figure 1** ER Diagram of Koru 15
- **Figure 2** Summary of Backend Coverage 17
- **Figure 3** Summary of Frontend 18

## Project Introduction

**Project Name:** Koru

**Repository:** learn-online (github.com/corbyn-jpg/learn-online)

**Team Name:** William's Pweddy Pwintesses

**Team Members:**

| GitHub Username | Full Name | Role |
| :--- | :--- | :--- |
| corbyn-jpg | Chloe Robinson | Project Manager |
| wrapperik | Rikus Pretorius | Frontend Manager |
| victordupreez0 | Victor du Preez | Backend Manager |
| danaeswart | Danae Swart | Front-End Support & Polish Specialist |

**Submission Date:** 10 June 2026

**Budget:** R250 000

**Client:** Lecturer: Tsungai Katsuro

## What is Koru?

Koru is a full-stack Learning Management System (LMS) designed to provide a centralised digital platform where all aspects of course management, learning delivery, and academic tracking take place in one place. It unifies student, teacher, and administrative workflows into a single, structured system.

## Core Objectives

- Centralise all academic workflows into a single, shared database, eliminating the client's fragmented systems.
- Deliver role-specific interfaces that are intuitive and efficient for every type of user.
- Enforce full POPIA (Protection of Personal Information Act) compliance by design, including an absolute prohibition on storing South African ID numbers or dates of birth.
- Deliver a complete Minimum Viable Product within the client's R250,000 budget and a 12-week development timeline.

## Summary of Client Requirements

**User Management & Access Control:**
- Secure login functionality
- Role-based access control for three roles: Admin, Teacher, and Student
- Account creation for students and teachers, managed by the Admin

**Admin Requirements:**
- Full CRUD (Create, Read, Update, Delete) over all user accounts
- Ability to create and manage courses and subjects
- Ability to assign teachers to courses and students to classes
- System usage monitoring and oversight

**Teacher Requirements:**
- Role-specific dashboard
- Create and upload assignments
- View enrolled students and class rosters
- Grade submitted assignments and provide feedback
- View class performance analytics and personal marking statistics
- Manage a personal to-do list and calendar with event creation

**Student Requirements:**
- Role-specific dashboard
- View assignments
- Submit assignments
- View grades and teacher feedback
- Track academic progress and attendance
- Add items to a personal to-do list and mark them as done
- View a weekly and daily calendar and create personal events
- View enrolled classes

**Core Functional Requirements:**
- Interactive calendar showing upcoming classes, assignments, and deadlines
- Analytics dashboards with data visualisations (performance trends, averages)
- A timetable algorithm to automatically generate class schedules
- Document management - upload and view files (PDFs, links, slides)
- Cross-platform desktop application (Windows and macOS) via Electron

**Data Privacy Requirements (POPIA):**
- Absolutely no South African ID numbers or dates of birth to be stored
- Only name, surname, student number, and gender may be stored
- All data handling must comply with POPIA
- Highly sensitive data to remain exclusively with the institution's registry department

## Why the Project is Valuable to the Client

The client was struggling with severely fragmented administrative systems, with scattered and disconnected data across grading, scheduling, and user management. This meant staff and students had to navigate multiple disconnected tools just to complete everyday academic tasks.

**LearnOnline solves this directly by:**
- Unifying all academic workflows into a single, centralised PostgreSQL database.
- Giving students complete visibility into their assignments, grades, feedback, schedules, and progress in one place, reducing confusion and missed deadlines.
- Giving teachers a structured workflow for creating content, managing classes, and reviewing student performance without switching between systems.
- Giving admins full control and oversight over the entire institution's academic operations from a single dashboard.

## Team Introduction

**Chloe "Corbyn" Robinson - Project Manager**
Chloe was responsible for overseeing the project timeline, managing the project backlog, and ensuring that milestones were met across all four sprints. She wrote the documentation for the team, and created the assignments pipeline as well as other tasks throughout the project.

**Rikus Pretorius - Frontend Manager**
Rikus led all frontend development. His responsibilities included making architectural decisions for the React component structure, setting up Tailwind CSS and DaisyUI, implementing the UI/UX designs for all three role-specific dashboards, building the interactive calendar views, and integrating the frontend with the backend REST API via the service layer.

**Victor du Preez - Backend Manager**
Victor led all backend development. He was responsible for designing and building the ASP.NET Core Web API, setting up the PostgreSQL database with Entity Framework Core migrations, implementing BCrypt password hashing for secure authentication, building 15 REST API controllers spanning the full scope of the system, and ensuring data integrity and POPIA compliance at the database level.

**Danae Swart - Front-End Support & Polish Specialist**
Danae worked across both the frontend and backend, focusing on quality assurance, UI polish, integration testing, and ensuring a cohesive and consistent user experience across all role-specific views. She created the admin view, as well as the courses page for each role and contributed to closing gaps between the frontend and backend during the integration sprints and helped bring features to a polished, presentable state.

## Team Setup

Git and Github were the team's primary collaboration platform. All work was tracked, reviewed, and merged through the shared repository with a clear branching strategy to isolate features and prevent conflicts. The team used Whatsapp and Discord to communicate changes, ideas and have team discussions throughout the project. Roles were clearly defined from the outset to minimise overlap and keep responsibilities unambiguous throughout delivery.

## Technologies Used

### Backend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| ASP.NET Core (C#) | .NET 10.0 | Web API framework |
| Entity Framework Core | 10.0.4 | ORM - database access layer |
| PostgreSQL | - | Relational database |
| Npgsql EF Core Provider | 10.0.1 | EF Core adapter for PostgreSQL |
| BCrypt.Net-Next | 4.1.0 | Secure password hashing |
| Swagger / Swashbuckle | 10.1.5 | API documentation & testing UI |
| ASP.NET Core OpenAPI | 10.0.3 | OpenAPI specification support |

### Frontend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| React | 19.2.0 | Component-based UI framework |
| Electron | 36.3.1 | Cross-platform desktop packaging |
| Vite | 7.2.2 | Build tool and dev server |
| TypeScript | 6.0.3 | Type-safe development |
| React Router DOM | 7.14.1 | Client-side routing |
| Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| DaisyUI | 5.5.5 | Pre-built Tailwind UI components |
| Framer Motion | 12.38.0 | Animations and page transitions |
| Solar Icons | 1.1.0 | Icon Library |
| jsPDF | 4.2.1 | PDF export functionality |
| OGL (WebGL) | 1.0.11 | Visual effects (Orb background) |
| canvas-confetti | 1.9.4 | Celebration animations |
| Novel | 1.0.2 | Rich text / notes editor |

### DevOps and Tooling

| Tool | Purpose |
| :--- | :--- |
| GitHub | Version control, branching, collaboration |
| Swagger UI | Manual API endpoint testing during dev |
| ESLint | Code linting and quality checks |
| Docker - proposed | Backend containerisation for deployment |

## Reasoning Behind Frameworks and Tools

- **Electron:** The client brief strictly mandated the delivery of a cross-platform desktop application accessible on both Windows and macOS. Electron was chosen because it allows us to package the React + Vite frontend as a native desktop application that runs smoothly on both operating systems without requiring users to open a browser or manage a local web server. It wraps the web application in a Chromium shell, giving it native desktop behaviour such as a dedicated application window, taskbar presence, and OS-level integration while allowing us to continue using our existing React codebase without rewriting it for a native platform.

- **ASP.NET Core (C#):** The project required a backend that strictly adheres to Object-Oriented Programming (OOP) principles necessary for managing the complex role-based access control across Admin, Teacher, and Student. .NET 10 provides a high-performance, modern runtime with built-in dependency injection, excellent EF Core support, and the structure needed for a secure, scalable API.

- **PostgreSQL:** The brief mandated a complex relational database. PostgreSQL was chosen because it enforces strict data types and validation rules critical for maintaining academic record integrity. Its support for normalised schemas, foreign key constraints, and ENUM types made it the right fit for the system's POPIA-compliant data model.

- **Entity Framework Core:** EF Core provides a strongly-typed, code-first abstraction over PostgreSQL, allowing the team to manage the database schema through migrations and interact with data using C# objects. This reduced raw SQL errors and accelerated backend development significantly.

- **React + Vite:** React was chosen to build a dynamic, component-based user interface that scales as the platform grows. It is one of the three explicitly permitted frontend frameworks (React, Vue, Angular) in the project brief. Vite provides extremely fast hot module replacement during development and optimised production builds that feed directly into the Electron packager.

- **TypeScript:** TypeScript was a core requirement in the proposal to ensure a type-safe, structured codebase. It enforces compatibility with backend entity shapes, catches errors at compile time, and improves overall code reliability — particularly important when the same data models are referenced across both the React UI and the Electron main process.

- **Tailwind CSS + DaisyUI:** Tailwind allows rapid, consistent UI development using utility classes, removing the need to write custom CSS from scratch. DaisyUI adds pre-built accessible components on top of Tailwind. Together they support the "corporate fun" visual design brief while ensuring fast, responsive, and consistent styling aligned with the Learn More brand across all screens of the desktop application.

## Technical Decisions

### Important Decisions Made Throughout the Project

- Building the frontend as a React + Vite web application first, then wrapping it with Electron, allowed the team to develop and test the UI rapidly in the browser before packaging it as a desktop application. This approach avoided the complexity of building directly in Electron from day one and kept the development workflow fast.
- Adopting a strict client-server separation from day one, with the backend and frontend developed as entirely independent workstreams, allowed the team to work in parallel without blocking each other.
- Choosing a code-first approach with Entity Framework Core migrations meant the database schema evolved alongside the codebase, with every change tracked in version control.
- Implementing BCrypt password hashing via BCrypt.Net-Next ensured that no plaintext passwords were ever stored, meeting the security requirements from day one.
- Using a centralised users table with a role ENUM (student, teacher, admin) rather than separate tables per role kept the identity system clean, normalised, and scalable.

## Structure of Application

The application follows a three-tier architecture: an Electron desktop shell wrapping a React frontend, communicating with an ASP.NET Core backend over HTTP REST.

*(Image placeholder: [103, 296, 899, 515])*

## Architecture

- **Identity and Registration**
  - **Users:** Central authentication table for all roles. Stores only name, surname, student number, gender, email, and hashed password. Role controlled by ENUM (student, teacher, admin).
  - **Subjects:** The institutional course catalogue (e.g., "Development/DV")
  - **Courses:** Active instances of a subject for a given year and term, assigned to a specific teacher.
  - **Enrollments:** Bridge table linking students to specific course instances.

- **Scheduling Engine**
  - **Timetables:** User-specific master schedule linked to their profile.
  - **Classes:** Scheduled sessions link a course to a room and time slot, surfacing on the user's personal timetable dashboard.
  - **Events:** User created personal calendar entries
  - **Materials:** Course-specific uploaded resources (PDFs, links, slides).

- **Assessment Pipeline**
  - **Assignments:** Faculty creates a deliverable for a course (prompt, due date, maximum marks).
  - **Submissions:** Students submit work that links the file/link to both the assignment and their user ID.
  - **Grades:** Linked directly to the submission record, ensuring every grade is traceable to a specific piece of submitted work.
  - **Feedback:** Lecturer commentary, also linked to the submission record.
  - **Notes:** Personal notes per user.
  - **Announcements:** Course specific or system wide announcements.

## Key Entities

| Entity | Key Relationships |
| :--- | :--- |
| User | Has a role; enrolls in Courses; submits Assignments; has Notes; Events; Timetable |
| Course | Belongs to a Subject; has Modules, Enrollments, Assignments, Announcements |
| CourseModule | Belongs to a Course; contains CourseModuleItems |
| Assignment | Belongs to a Course; has many Submissions |
| Submission | Belongs to an Assignment and a User; has Grade and Feedback |
| Grade | Linked to a Submission and a User |
| Enrollment | Links a Student User to a Course |
| Timetable | User-specific schedule record |
| Class | Scheduled session links Course, room, and time |
| Event | Personal calendar entry for a User |
| Note | Personal notes for a User |
| Announcement | Linked to a Course or system-wide |
| Material | Study material attached to a Course or Module |
| Feedback | Associated with a specific Submission record |

**Figure 1: ER Diagram of Koru** *(Image placeholder)*

## Key API Endpoints

| Controller | Key Operations |
| :--- | :--- |
| UserController | Register, login, get/update, roles |
| CourseController | CRUD for courses |
| CourseModuleController | CRUD for modules |
| CourseModuleItemController | Module content items |
| AssignmentController | Create, update, retrieve |
| SubmissionController | Submit, retrieve, review |
| GradeController | Grade, retrieve grades |
| EnrollmentController | Enroll / unenroll |
| AnnouncementController | Post and retrieve |
| EventController | Calendar event management |
| TimetableController | Class scheduling |
| FeedbackController | Submission feedback |
| MaterialController | Course materials |
| NoteController | Personal notes |
| SubjectController | Academic subjects |

## Testing Approach

The team implemented a two-pronged testing strategy covering both the backend (.NET) and the frontend (React), with automated test runs and code coverage reporting on both sides of the stack.

**Backend:**
- Tool: xUnit.net (test framework) + FluentAssertions (assertion library)
- Coverage: ReportGenerator (MultiReport / 2x Cobertura)
- Command: dotnet test

The backend test suite was written using xUnit.net combined with FluentAssertions, which provides a more readable and expressive assertion syntax for verifying expected outcomes. Tests were written to cover controller logic across all 15 API controllers, as well as model validation and DTO behaviour.

Coverage was measured using Coverlet and visualised using ReportGenerator, producing a detailed HTML report broken down per class and method.

**Figure 2: Summary of Backend Coverage** *(Image placeholder)*

The risk hotspot identified by ReportGenerator was the `GoogleAuth()` method in `UserController`, which has a Cyclomatic Complexity of 22 reflecting the number of conditional paths involved in validating a Google OAuth token, checking email verification, matching existing accounts, and handling edge cases. This is the most complex method in the codebase and would benefit from further dedicated test cases to fully cover all branches.

`CourseModule` and `CourseModuleItem` controllers show 0% automated coverage; these were tested manually via Swagger UI throughout development but dedicated unit tests were not written for them within the project timeline.

**Frontend:**
- Tool: Vtest + React Testing Library
- Command: npm test

The frontend test suite covers the core authentication context, protected routing logic, and key reusable UI components. Tests verify that components render correctly, that the `AuthContext` provides the correct state, and that the `ProtectedRoute` correctly restricts or allows access based on user role.

**Figure 3: Summary of Frontend** *(Image placeholder)*

The `components` and `contexts` folders achieved full or near-full coverage, reflecting their importance as the foundation of the application. The `AuthContext` and `ProtectedRoute` are critical to the entire role-based access system and were prioritised accordingly.

The `services` folder achieved strong line coverage (98.14%) with lower branch coverage (62.5%), meaning the happy-path API calls are well tested but some error-handling branches (e.g. failed fetch responses) were not fully covered.

The `pages/profile` folder has the lowest coverage (~58%), as the profile pages contain complex multi-step UI flows and multiple sub-components that each fetch data independently, making them harder to unit test in isolation.

**Manual Testing:** Swagger UI was used throughout all four development sprints to manually test all 15 API controllers, verifying correct request/response behaviour, HTTP status codes, and data integrity for every endpoint before frontend integration. The packaged Electron application was also tested on both Windows and macOS to verify cross-platform compatibility.

## Test Report

### Test Types

| Test Type | Description | Status |
| :--- | :--- | :--- |
| Backend Unit Tests | xUnit.net tests covering all 15 API controllers, model validation, and DTO behaviour. FluentAssertions used for readable, expressive assertions. | PASSED |
| Frontend Unit Tests | Vtest + React Testing Library tests covering AuthContext, ProtectedRoute, and key reusable UI components. | PASSED |
| Manual Testing | All 15 API controllers tested via Swagger UI throughout development. | Done |
| Cross-Platform Testing | Electron application tested on both Windows and macOS environments. | Done |

### Number of Tests

| Metric | Result |
| :--- | :--- |
| Backend tests (xUnit.net) | 134 / 134 passed |
| Frontend tests (Vtest) | 82 / 82 passed |
| Total tests written | 216 |
| Total tests passed | 216 |
| Total tests failed | 0 |
| Backend test duration | 9.7s |
| Frontend test duration | 2.831s |
| Frontend test suites | 12 / 12 passed |
| API Endpoints Manually Verified | 15 / 15 |
| Platforms tested (Electron) | Windows, macOS |

### Code Coverage Metrics

**Backend (ReportGenerator - Coverlet / Cobertura):**
- Line coverage: 83.3% (1019 / 1222 coverable lines)
- Branch coverage: 76.4% (133 / 174 branches)

**Frontend (Vitest - Istanbul/c8):**
- Statements: 79.91% (199 / 249)
- Branches: 57.73% (112 / 194)
- Functions: 75% (72 / 96)
- Lines: 84.76% (178 / 210)

The backend achieved strong line coverage at 83.3%, meaning the vast majority of executable code in the API was exercised by tests. The 76.4% branch coverage indicates that most conditional logic paths were also tested, though some edge cases were not fully covered. The two controllers with 0% coverage (`CourseModuleController` and `CourseModuleItemController`) are a clear gap that would be the first priority in a future testing sprint.

On the frontend, the 100% coverage of the `components` and `contexts` folders reflects the team's correct prioritisation of the most critical shared code. The lower branch coverage overall (57.73%) is largely driven by the `pages/profile` folder (50.86% branches), where complex multi-step UI flows and role-specific rendering paths were harder to cover with unit tests alone. The `services` folder's high line coverage (98.14%) but lower branch coverage (62.5%) indicates that API service functions are well exercised on the happy path but error-handling branches were partially untested.

Overall, with 216 tests written and 216 passing the test suite demonstrates a stable, reliable codebase with no regressions at the point of final submission.

## External Feedback

The team presented an early version of the application to our UX lecturer, who provided direct feedback on three key concerns. The following explains what each concern meant, and how the team responded with concrete changes to the codebase.

### Key Issues Identified

**Hierarchy:**
- The lecturer's concern was that there was no clear visual hierarchy on screen. Information across the dashboards was presented at the same visual weight, making it difficult for users to know what to look at first, what was most important, and how sections related to each other.

**It was too complicated:**
- The lecturer felt the application was overwhelming, too much happening on screen at once, too many features crammed into single views, and interactions that were not intuitive for a non-technical user.

**Different classes should have different due dates:**
- The lecturer identified that the original assignment model treated due dates as a global setting, meaning a single assignment deadline applied uniformly without considering that different classes or course instances might need different submission windows.

### Incorporation of Feedback

**Hierarchy:**
- Rikus restructured all three role-specific dashboards into a deliberate three-column grid layout, giving each section of the screen a clear and distinct purpose.
- A unified `Dashboard.jsx` was introduced as a "traffic controller" — a single route that determines which role-specific dashboard to render based on the logged-in user's role. This replaced the previous approach of separate, inconsistently structured pages that felt like different apps.
- A `HeaderTopBar` component was added across all pages, providing consistent breadcrumb navigation with a colour-coded role badge (e.g., "COURSES / DV300") so users always know where they are in the application. This directly addresses hierarchy by anchoring the user's context at the top of every screen.
- Within content areas like analytics and the admin dashboard, Rikus introduced a consistent card system using `rounded-[28px]` containers, icon-labelled stat cards (e.g., Total Students, Pending to Grade), and clearly weighted typography so the visual hierarchy guides the eye naturally from the most important information down to supporting detail.

**It was too complicated:**
- The single biggest response to this feedback was Rikus beginning the decomposition of the monolithic `teacherCourses.jsx` file — which had grown to approximately 125KB and ~3,500 lines with 15+ features packed into one component — into a dedicated folder of focused, single-purpose components.
- This separation meant that each view within the teacher's course management area became its own focused screen rather than one giant, scrollable wall of UI. Teachers see one thing at a time, navigating between course content, assignments, and student management as distinct sections rather than all at once.
- The use of Framer Motion animations (`fadeUp`, `slideUp` transitions) was also deliberate in response to this feedback. Staggered entrance animations draw the user's attention to one section at a time as content loads, rather than everything appearing on screen simultaneously, which felt overwhelming in the earlier version.

**Different classes should have different due dates:**
- This feedback drove both a backend data model change and a frontend UI update. The team extended the `Assignment` model and the database schema to support three distinct date fields per assignment, each scoped to the specific course the assignment belongs to.
- On the frontend, Rikus updated the `CreateAssignmentDrawer` to expose all three date fields clearly with distinct labelled inputs.
- Since every assignment is linked to a specific course, a teacher can create the same assignment for two different courses and set entirely different open, due, and close dates for each one, directly addressing the lecturer's concern.
- The `TodayTimeline` component on the student dashboard also reads the due date of each assignment and plots it as a time block on the day's schedule, so students can see at a glance which submissions are due today alongside their regular classes.

## Challenges and Future Implementation

### Challenges

- **Electron Integration and Cross-Platform Packaging:** Configuring Electron to correctly wrap the React + Vite application and package it for both Windows and macOS introduced OS-specific challenges that were not present during browser-based development. Ensuring that the Electron main process communicated correctly with the React renderer, and that the packaged build behaved consistently across both operating systems, required dedicated time and iteration.

- **Component Complexity:** The `teacherCourses.jsx` component grew organically to over 125KB and approximately 3,500 lines of code as features were added across sprints. Fitting course CRUD, module management, assignment handling, grading, and more into a single file made debugging and team collaboration increasingly difficult as the project progressed.

- **Enforcing POPIA Compliance:** Ensuring no South African ID numbers or dates of birth were captured anywhere in the system required active enforcement at both the database schema and application form level throughout the entire development cycle. (If you can find the user, we messed up)

- **Building a Unified System Across Three Roles:** Designing a clean, consistent experience for three very different user types while keeping the codebase maintainable was more complex than initially scoped. At times, role-specific views began to diverge in structure and visual design.

- **Calendar Code Duplication:** The student and teacher calendar components ended up being approximately 95% identical code. What started as a quick shortcut became a maintenance burden as any change or bug fix needed to be applied in two places.

- **Database Relationship Design:** Correctly modelling the full assessment pipeline (assignments → submissions → grades → feedback) in Entity Framework Core required multiple iterations of migrations to get the referential integrity and normalisation right.

- **Merge Conflicts/Overwrites:** At key points, there were merge conflicts and accidental overwrites, notably in `TeacherCourses` which would require backtracking and resolving conflicts. (Much to Victor's chagrin)

### Highlights

- Successfully delivering 15 fully functional REST API controllers covering the entire academic system scope.
- Packaging and running the full application as a native Electron desktop app on both Windows and macOS.
- Building a cohesive, role-differentiated UI with a strong visual identity across all three user types.
- Receiving praise from the client and lecturers, ie. "It is very pretty"
- Growing closer as a team and developers throughout the processes (Love you guys)

### Potential Improvements

**Short Term:**
- Decompose `teacherCourses.jsx` into 10-15 focused, individually testable components with dedicated data-fetching hooks.
- Extract a shared `<BaseCalendar>` component to eliminate the ~95% code duplication between student and teacher calendar views.
- Replace all browser `alert()` / `confirm()` dialogs with custom Toast notifications and ConfirmDialog modals.
- Add loading states (skeleton loaders), error states, and empty states to all data-driven components.
- Build a standardised, reusable component library: `<Button>`, `<Card>`, `<Input>`, `<Modal>`, `<Toast>`, `<ConfirmDialog>`, `<SkeletonLoader>`.

**Medium Term:**
- Unify role-based URL routing: replace `/studentDashboard`, `/teacherCourses` etc. with `/dashboard`, `/courses`, `/calendar` (role determined by context).
- Leverage Electron's native capabilities more deeply — e.g., desktop notifications for assignment deadlines, system tray presence, and offline caching of recently viewed content via Electron's local storage APIs.
- Implement full CI/CD pipelines with automated test runs before any code is merged, including automated Electron build checks for both platforms.

## Additional Features and Optimisations

**Additional Features:**
- Multiple theme options - currently only a dark mode is available and a user selected theme would add more customisation and visual interest.
- Real-time desktop notifications via Electron's native notification API. Push alerts directly to the OS notification centre for new assignments, grades, and announcements.
- Discussion forums: course-specific boards for student-teacher collaboration.
- Plagiarism checker integration for assignment submissions.
- CSV / PDF export for grade reports and analytics dashboards.
- Auto-updater: use Electron's built-in auto-update mechanism to push new application versions to users without requiring manual reinstall.

**Performance Optimisations:**
- Add pagination to admin data tables currently rendering all rows at once.
- Add memoisation (`React.memo`, `useMemo`) to prevent unnecessary re-renders in complex components like `weeklyHorizontalTimeline.jsx`.
- Scope the WebGL Orb visual effect to specific pages rather than loading it on every screen.
- Add virtual scrolling for large data sets in analytics and grade tables.

## Conclusion

Koru was built to solve a real, specific problem: a client whose educational institution was held back by severely fragmented administrative systems. Our solution replaces that fragmentation with a single, centralised, POPIA-compliant Learning Management System delivered as a native cross-platform desktop application using Electron.

**What We Built:**
- A full-stack LMS packaged as an Electron desktop application running natively on Windows and macOS — directly meeting the client's core platform requirement
- Three distinct, fully functional user roles (Admin, Teacher, Student) each with their own dashboard and workflows.
- A secure ASP.NET Core Web API with 15 REST controllers and a normalised PostgreSQL database enforcing POPIA compliance by design.
- A React + Vite frontend with role-based routing, an interactive calendar, analytics dashboards, an assignment submission and grading pipeline, and personal timetable and note management.

**What We Learned:**
- Full-stack development across a real-world, client-driven brief.
- How to work as a team and delegate work across developers.
- Packaging and distributing a desktop application with Electron across two operating systems.
- POPIA compliance and data privacy enforcement by design.
- Responding constructively to external feedback and using it to improve.
