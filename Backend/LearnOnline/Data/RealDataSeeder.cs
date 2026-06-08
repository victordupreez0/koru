using LearnOnline.Models;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Data
{
    // ─────────────────────────────────────────────────────────────────────────────
    //  RealDataSeeder  –  university-scale seed for LearnOnline
    //
    //  Run-once: if >100 students already exist the method returns immediately.
    //  First run: clears every table, then seeds fresh data.
    //
    //  Staff accounts (password: dev@123)
    //    devadmin@learnonline.co.za  – Dev Admin (admin)
    //    karl@learnonline.co.za      – Karl van Heerden  (VC300)
    //    william@learnonline.co.za   – William Basson    (DV300, CC200, CC300)
    //    tsungai@learnonline.co.za   – Tsungai Katsuro   (DV200, DV300)
    //    simba@learnonline.co.za     – Simba Zengeni     (DV300)
    //    allen@learnonline.co.za     – Allen Laing       (VC200)
    //    talya@learnonline.co.za     – Talya Bekker      (DV100)
    // ─────────────────────────────────────────────────────────────────────────────
    public static class RealDataSeeder
    {
        private const string Hash = "$2b$10$Cma9hPOlUNJt2VNaK0etgO1ZhFefacPgubTlhcnMvwcNPZfNAnx.2";

        // ─── Name pools (South African diversity) ────────────────────────────────

        private static readonly string[] AllFirstNames =
        {
            // Male
            "Sipho","Thabo","Lungelo","Andile","Bongani","Siyanda","Mpho","Khaya",
            "Ntuthuko","Sandile","Lwazi","Sbusiso","Nkosinathi","Thandolwethu","Lindani",
            "Mthokozisi","Nhlanhla","Sifiso","Qhawe","Musa",
            "Johann","Pieter","Francois","Riaan","Gerrit","Daniel","Wian","Morne","Nico","Deon",
            "Jason","Kyle","Sean","Ethan","Jordan","Tristan","Blake","Cameron","Dylan","Tyler",
            "Roshan","Sanjay","Priyesh","Arjun","Kiran","Devesh","Vikesh",
            "Mohammed","Tariq","Yusuf","Zayd","Imran","Ridwaan",
            "Luca","Marco","Alex","Ryan","Luke","Austin","Keanu",
            // Female
            "Nokwanda","Zanele","Nandi","Akhona","Zinhle","Siphokazi","Nomvula","Thandeka",
            "Snenhlanhla","Nokukhanya","Phindile","Bongiwe","Lungisa","Ntombi","Nompumelelo",
            "Siphokuhle","Ntombizodwa","Zintle","Olwethu","Asanda",
            "Anke","Marlize","Chantelle","Liezel","Elzette","Jana","Rudi","Cari","Ilse","Mia",
            "Michelle","Jessica","Tamara","Ashley","Megan","Kaylee","Samantha","Caitlin","Amy","Sarah",
            "Priya","Kavita","Shivana","Yashna","Anisha","Neesha","Reshma",
            "Fatima","Aisha","Zainab","Mariam","Hafsa","Ruqayyah","Hana",
            "Lerato","Dineo","Palesa","Mapule","Katlego","Nthabiseng","Refilwe","Boitumelo"
        };

        private static readonly string[] AllLastNames =
        {
            "Nkosi","Dlamini","Khumalo","Mthembu","Ndlovu","Molefe","Sithole",
            "Mahlangu","Mkhize","Ntuli","Buthelezi","Shabalala","Cele","Mabaso",
            "Zwane","Khoza","Majola","Msomi","Msweli","Ngcobo","Mthethwa","Zulu",
            "van Wyk","Botha","Coetzee","du Plessis","Joubert",
            "Pretorius","de Beer","Swart","le Roux","van Niekerk","Potgieter","Visser","Venter",
            "Smith","Williams","Brown","Adams","Thomas","Peterson","Harris","Davids",
            "Chetty","Pillay","Naidoo","Singh","Patel","Govender","Reddy","Moodley",
            "Mohamed","Abdullah","Cassim","Isaacs","Jacobs","Hendricks","Petersen","Arendse",
            "du Toit","Smit","Nel","Steyn","de Villiers","Lombard","Cronje","Loubser"
        };

        // ─── Feedback pools ───────────────────────────────────────────────────────

        private static readonly string[] PositiveFeedback =
        {
            "Excellent work. Your implementation demonstrates a thorough understanding of the core concepts. The code is clean, well-structured, and your documentation is detailed. This is the standard to maintain.",
            "Outstanding submission. The attention to detail in both the design and technical execution is impressive. Your reflective writing shows genuine depth of thinking. Keep it up.",
            "Very strong work overall. The solution is elegant and shows initiative beyond the brief requirements. The visual hierarchy and user experience are particularly well-considered.",
            "Distinction-level submission. Your research is comprehensive, the analysis is well-argued, and the presentation is polished. It is clear you invested significant time and thought.",
            "Superb execution. The problem-solving approach is evident in the quality of the outcome. Your written component is especially strong - the kind of clarity that stands out in a large class."
        };

        private static readonly string[] GoodFeedback =
        {
            "Good work on this submission. The core requirements have been met and your execution is competent. To push towards a distinction, deepen your critical analysis and refine the finer details.",
            "Solid effort. The fundamentals are all present and your work shows a good grasp of the material. Some areas could benefit from more polish and closer attention to the brief specifics.",
            "A good submission overall. Your technical implementation is sound, but your written reflection could go further. Move beyond description and interrogate the 'why' behind your decisions.",
            "Well done. This hits the requirements of the brief. For future submissions, pay closer attention to the rubric criteria around research depth and contextual positioning.",
            "Good work. You have demonstrated competence across most areas. The main area for growth is how you document and articulate your process - the thinking needs to be more visible in the work."
        };

        private static readonly string[] AverageFeedback =
        {
            "Your submission meets the minimum requirements but lacks depth. The execution is inconsistent - some sections show real promise while others feel underdeveloped. Review this feedback carefully.",
            "There is a solid foundation here, but the work needs more rigour. Your research is thin and the analysis lacks specificity. Please engage with the recommended readings before the next brief.",
            "Average submission. The technical requirements are partially met, but there are noticeable gaps. Please attend the next feedback session and bring your work for a one-on-one review.",
            "This submission is borderline passing. The core idea is there but the execution is rushed. Spend more time on refinement and make sure you are addressing all rubric points explicitly.",
            "Adequate work but you are capable of more. The presentation is inconsistent and some technical requirements are missing. Please come to consultation hours to discuss how to improve."
        };

        private static readonly string[] PoorFeedback =
        {
            "Unfortunately this submission does not meet the required standard. Key rubric criteria are not addressed and the work appears incomplete. Please come to consultation hours to discuss a path forward.",
            "This submission is below the minimum pass mark. The fundamental requirements of the brief have not been met. I strongly advise you to review the brief, attend tutorials, and resubmit if possible.",
            "The work submitted is insufficient. There is evidence of understanding in parts, but the execution is too underdeveloped to pass. Please reach out so we can identify where the gaps are.",
            "Below pass. The submission does not demonstrate adequate grasp of the course outcomes. You will need to speak to me urgently about your academic standing in this course.",
            "Not passing. This needs significant rework. Please book a consultation slot before the next assignment deadline - the sooner the better."
        };

        // ─── Entry point ──────────────────────────────────────────────────────────

        public static void Seed(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // Run-once guard - only skip if THIS seeder's data is already present AND correct.
            // Verify devteacher exists, >100 students exist, AND DV300 is actually assigned to devteacher.
            var existingDevTeacher = context.Users.FirstOrDefault(u => u.Email == "devteacher@learnonline.co.za");
            if (existingDevTeacher != null && context.Users.Count(u => u.Role == UserRole.student) > 100)
            {
                var dv300OK = context.Courses
                    .Include(c => c.Subject)
                    .Any(c => c.Subject.Code == "DV300" && c.TeacherId == existingDevTeacher.Id);
                var hasUngradedWork = context.Assignments.Any(a => a.Title == "Interactive Website Project");
                if (dv300OK && context.Attendances.Any() && hasUngradedWork) return;
            }

            // Rebuild Announcements table (prevents schema drift across restarts)
            context.Database.ExecuteSqlRaw(@"DROP TABLE IF EXISTS ""Announcements"" CASCADE;");
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE ""Announcements"" (
                    ""Id"" text NOT NULL,
                    ""Title"" text NOT NULL,
                    ""DatePosted"" timestamp with time zone NOT NULL,
                    ""Preview"" text NOT NULL,
                    ""Label"" text NOT NULL,
                    ""Color"" text NOT NULL,
                    ""CourseId"" text NOT NULL,
                    ""LecturerId"" text NOT NULL,
                    CONSTRAINT ""PK_Announcements"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Announcements_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_Announcements_Users_LecturerId"" FOREIGN KEY (""LecturerId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );");

            // Clear every table in FK-safe order (Announcements already empty above)
            ClearAll(context);

            // ─── 1. Staff Accounts ────────────────────────────────────────────────
            var admin      = MakeUser("devadmin@learnonline.co.za",   "Dev",     "Admin",       UserRole.admin);
            var devTeacher = MakeUser("devteacher@learnonline.co.za", "Dev",     "Teacher",     UserRole.teacher);
            var karl       = MakeUser("karl@learnonline.co.za",       "Karl",    "van Heerden", UserRole.teacher);
            var william    = MakeUser("william@learnonline.co.za",    "William", "Basson",      UserRole.teacher);
            var tsungai    = MakeUser("tsungai@learnonline.co.za",    "Tsungai", "Katsuro",     UserRole.teacher);
            var simba      = MakeUser("simba@learnonline.co.za",      "Simba",   "Zengeni",     UserRole.teacher);
            var allen      = MakeUser("allen@learnonline.co.za",      "Allen",   "Laing",       UserRole.teacher);
            var talya      = MakeUser("talya@learnonline.co.za",      "Talya",   "Bekker",      UserRole.teacher);
            var devStudent = MakeUser("devstudent@learnonline.co.za", "Dev",     "Student",     UserRole.student);
            context.Users.AddRange(admin, devTeacher, karl, william, tsungai, simba, allen, talya, devStudent);
            context.SaveChanges();

            // ─── 2. Subjects & Courses ────────────────────────────────────────────
            var (_, dv100) = MakeCourse(context, admin.Id, "DV100", "Interactive Development 100",
                "Foundations of web development: semantic HTML, CSS layout systems, and vanilla JavaScript.",
                "Semester 1", 2026, talya.Id, 30);

            var (_, dv200) = MakeCourse(context, admin.Id, "DV200", "Interactive Development 200",
                "React, REST APIs, and full-stack JavaScript fundamentals with Node and Express.",
                "Semester 1", 2026, tsungai.Id, 30);

            var (_, dv300) = MakeCourse(context, admin.Id, "DV300", "Interactive Development 300",
                "Enterprise full-stack development, API architecture, cloud deployment, and team engineering practices.",
                "Semester 1", 2026, devTeacher.Id, 30);

            var (_, cc200) = MakeCourse(context, admin.Id, "CC200", "Creative Computing 200",
                "Digital design principles, typography, layout systems, and image-making workflows using industry software.",
                "Semester 1", 2026, william.Id, 50);

            var (_, cc300) = MakeCourse(context, admin.Id, "CC300", "Creative Computing 300",
                "Generative art and creative coding with p5.js, and physical computing with Arduino.",
                "Semester 1", 2026, william.Id, 30);

            var (_, vc200) = MakeCourse(context, admin.Id, "VC200", "Visual Communication 200",
                "Photography, visual research methodology, and image-making as critical practice.",
                "Semester 1", 2026, allen.Id, 30);

            var (_, vc300) = MakeCourse(context, admin.Id, "VC300", "Visual Communication 300",
                "Advanced visual culture, semiotics, and the critical analysis of contemporary media systems.",
                "Semester 1", 2026, karl.Id, 300);

            // ─── 3. Students & Enrolments ─────────────────────────────────────────
            var dv100Students = GenStudents(context,   0,  20);
            var dv200Students = GenStudents(context,  20,  20);
            var dv300Students = GenStudents(context,  40,  20);
            var cc200Students = GenStudents(context,  60,  40);
            var cc300Students = GenStudents(context, 100,  20);
            var vc200Students = GenStudents(context, 120,  20);
            var vc300Students = GenStudents(context, 140, 250);
            context.SaveChanges();

            Enrol(context, dv100Students, dv100.Id);
            Enrol(context, dv200Students, dv200.Id);
            Enrol(context, dv300Students, dv300.Id);
            Enrol(context, cc200Students, cc200.Id);
            Enrol(context, cc300Students, cc300.Id);
            Enrol(context, vc200Students, vc200.Id);
            Enrol(context, vc300Students, vc300.Id);
            // Enrol devstudent in every course so the dev account can browse all of them
            var devStudentList = new List<User> { devStudent };
            Enrol(context, devStudentList, dv100.Id);
            Enrol(context, devStudentList, dv200.Id);
            Enrol(context, devStudentList, dv300.Id);
            Enrol(context, devStudentList, cc200.Id);
            Enrol(context, devStudentList, cc300.Id);
            Enrol(context, devStudentList, vc200.Id);
            Enrol(context, devStudentList, vc300.Id);
            context.SaveChanges();

            // ─── 4. Assignments (4 per course: 2 past+graded, 2 upcoming) ────────
            // Past: IsClosed=true, DueDate in March 2026, every student has a graded submission
            // Upcoming: IsClosed=false, DueDate June 2-16 2026, no submissions yet

            // DV100
            var dv100A1 = MakeAssignment(context, dv100.Id,
                "HTML & CSS Portfolio Page",
                "Build a responsive personal portfolio page using semantic HTML5 and CSS Grid/Flexbox. The page must include a hero section, about, projects, and a contact form with basic validation.",
                100, SA(2, 23), SA(3, 14), true);
            var dv100A2 = MakeAssignment(context, dv100.Id,
                "JavaScript Fundamentals Project",
                "Create a dynamic to-do list application using vanilla JavaScript. Implement full CRUD operations, local storage persistence, and real-time input validation.",
                100, SA(3, 9), SA(3, 28), true);
            var dv100A3 = MakeAssignment(context, dv100.Id,
                "Responsive Web Design Challenge",
                "Redesign a provided desktop-only website to be fully responsive across mobile, tablet, and desktop breakpoints using CSS media queries and a mobile-first approach.",
                100, SA(5, 19), SA(6, 7), false);
            MakeAssignment(context, dv100.Id,
                "Interactive Form Validation App",
                "Build a multi-step registration form with real-time client-side validation, accessible error messaging, and an animated confirmation screen using JavaScript and CSS transitions.",
                50, SA(5, 26), SA(6, 14), false);
            var dv100Ungraded = MakeAssignment(context, dv100.Id,
                "Interactive Website Project",
                "Create a multi-page interactive website showcasing dynamic visual elements, API fetches, and form inputs.",
                100, SA(5, 10), SA(6, 12), false);

            // DV200
            var dv200A1 = MakeAssignment(context, dv200.Id,
                "React Component Library",
                "Design and build a reusable React component library containing a Button, Card, Modal, Input, and Navbar component. Document each component with JSDoc and usage examples in a README.",
                100, SA(2, 23), SA(3, 12), true);
            var dv200A2 = MakeAssignment(context, dv200.Id,
                "REST API Integration Project",
                "Connect a React front-end to a public REST API of your choice. Implement search, filtering, and pagination. Handle loading states, empty states, and API errors gracefully.",
                100, SA(3, 9), SA(3, 26), true);
            MakeAssignment(context, dv200.Id,
                "Full-Stack CRUD Application",
                "Build a full-stack application with a Node/Express back-end and React front-end. Implement full CRUD on a resource of your choosing with a PostgreSQL database and a RESTful API.",
                100, SA(5, 19), SA(6, 9), false);
            MakeAssignment(context, dv200.Id,
                "Authentication System Implementation",
                "Extend your CRUD application with JWT-based authentication: registration, login, protected routes, refresh tokens, and a user profile page with avatar upload.",
                50, SA(5, 26), SA(6, 16), false);
            var dv200Ungraded = MakeAssignment(context, dv200.Id,
                "React Native Mobile App",
                "Build a mobile app with React Native including navigation, list views, and details page.",
                100, SA(5, 10), SA(6, 12), false);

            // DV300
            var dv300A1 = MakeAssignment(context, dv300.Id,
                "Technical Architecture Document",
                "Design and document the full system architecture for your term project. Include an ERD, API endpoint map, deployment pipeline diagram, security considerations, and technology justification.",
                100, SA(2, 20), SA(3, 10), true);
            var dv300A2 = MakeAssignment(context, dv300.Id,
                "Sprint 1: Working Prototype",
                "Deliver a working vertical slice of your term project: authentication, at least one complete feature end-to-end, a deployed staging environment on Render or Vercel, and a code review session.",
                100, SA(3, 6), SA(3, 24), true);
            MakeAssignment(context, dv300.Id,
                "API Documentation Review",
                "Submit a fully documented Swagger/OpenAPI specification covering all endpoints in your project API. Include request/response schemas, error codes, authentication details, and usage examples.",
                50, SA(5, 19), SA(6, 5), false);
            MakeAssignment(context, dv300.Id,
                "Full-Stack Application - Sprint 2",
                "Complete the full feature set of your term project, implement automated testing for all critical paths, record a 5-minute walkthrough video, and present a live demo to the class.",
                100, SA(5, 26), SA(6, 13), false);
            var dv300Ungraded = MakeAssignment(context, dv300.Id,
                "Cloud Deployment Sprints",
                "Document cloud deployment strategies, CI/CD pipelines, and scale systems.",
                100, SA(5, 10), SA(6, 12), false);

            // CC200
            var cc200A1 = MakeAssignment(context, cc200.Id,
                "Digital Illustration Series",
                "Create a series of three cohesive digital illustrations using Adobe Illustrator. The series must share a consistent visual language, a defined colour palette, and a clear typographic system.",
                100, SA(2, 20), SA(3, 8), true);
            var cc200A2 = MakeAssignment(context, cc200.Id,
                "Typography & Layout Fundamentals",
                "Design a 4-page editorial spread for a provided article using Adobe InDesign. Apply principles of visual hierarchy, a grid system, typographic rhythm, and consistent use of negative space.",
                100, SA(3, 6), SA(3, 22), true);
            MakeAssignment(context, cc200.Id,
                "Motion Graphics Concept",
                "Produce a 15-30 second motion graphic explainer using Adobe After Effects. Submit a storyboard, low-fidelity animatic, and a final rendered export at 1080p.",
                100, SA(5, 19), SA(6, 4), false);
            MakeAssignment(context, cc200.Id,
                "Brand Identity System Draft",
                "Design the foundational brand identity for a fictitious company: primary and secondary logos, colour palette with hex values, typeface selection with rationale, and a one-page brand style guide.",
                50, SA(5, 26), SA(6, 12), false);
            var cc200Ungraded = MakeAssignment(context, cc200.Id,
                "Brand Visual Guidelines",
                "Develop standard brand guidelines for typography, colors, and layout constraints.",
                100, SA(5, 10), SA(6, 12), false);

            // CC300
            var cc300A1 = MakeAssignment(context, cc300.Id,
                "Generative Art Portfolio",
                "Create three distinct generative artworks in p5.js exploring different algorithms (Perlin noise, recursion, cellular automata). Each piece must include a 150-word artist statement.",
                100, SA(2, 20), SA(3, 13), true);
            var cc300A2 = MakeAssignment(context, cc300.Id,
                "Physical Computing Prototype",
                "Build and document an interactive physical computing prototype using Arduino. The prototype must respond to at least two types of sensor input and produce a meaningful, context-aware output.",
                100, SA(3, 9), SA(3, 27), true);
            MakeAssignment(context, cc300.Id,
                "Creative Coding Exhibition Piece",
                "Develop a standalone interactive artwork intended for public exhibition. The piece must support real-time audience interaction, run autonomously for 30+ minutes, and be self-explanatory without signage.",
                100, SA(5, 19), SA(6, 6), false);
            MakeAssignment(context, cc300.Id,
                "Interactive Installation Brief",
                "Submit a detailed written brief (1500 words + visual references) for your end-of-year interactive installation. Include concept rationale, technical specifications, floor plan, and visitor experience flow.",
                50, SA(5, 26), SA(6, 16), false);
            var cc300Ungraded = MakeAssignment(context, cc300.Id,
                "Generative Audio Art Piece",
                "Code an interactive generative sound generator using p5.sound library.",
                100, SA(5, 10), SA(6, 12), false);

            // VC200
            var vc200A1 = MakeAssignment(context, vc200.Id,
                "Visual Research Document",
                "Compile a 20-page visual research document exploring your chosen visual theme. Cite at least 10 academic or professional sources and contextualise each image within the broader visual discourse.",
                100, SA(2, 23), SA(3, 11), true);
            var vc200A2 = MakeAssignment(context, vc200.Id,
                "Image-Making Workshop Series",
                "Complete the three in-class workshop exercises (studio photography, found-image collage, and darkroom print) and submit a 500-word written reflection connecting the three methods.",
                100, SA(3, 9), SA(3, 25), true);
            MakeAssignment(context, vc200.Id,
                "Photography Series: Urban Spaces",
                "Produce a series of 12 photographs responding to the theme Threshold. Submit edited JPEGs at 300 dpi and a 500-word artist statement explaining your formal and conceptual decisions.",
                100, SA(5, 19), SA(6, 3), false);
            MakeAssignment(context, vc200.Id,
                "Visual Narrative Board",
                "Create a 10-panel visual narrative using a combination of photography, illustration, and text. The narrative must be fully legible to a viewer without any accompanying caption or explanation.",
                50, SA(5, 26), SA(6, 15), false);
            var vc200Ungraded = MakeAssignment(context, vc200.Id,
                "Photojournalism Portfolio",
                "Submit a photojournalism sequence of 8 edited photos responding to a local news theme.",
                100, SA(5, 10), SA(6, 12), false);

            // VC300
            var vc300A1 = MakeAssignment(context, vc300.Id,
                "Semiotic Analysis Essay",
                "Write a 2000-word essay applying Saussurean and Peircean semiotic theory to analyse a contemporary advertising campaign. Include a visual appendix of the images you have analysed.",
                100, SA(2, 16), SA(3, 7), true);
            var vc300A2 = MakeAssignment(context, vc300.Id,
                "Visual Systems Case Study",
                "Select a real-world visual system (wayfinding, brand identity, publication design) and produce a 15-slide case study deck analysing its visual grammar, cultural context, and effectiveness.",
                100, SA(3, 4), SA(3, 21), true);
            MakeAssignment(context, vc300.Id,
                "Contemporary Media Critique",
                "Write a 1500-word critical analysis of a chosen digital media artefact (social media campaign, meme culture, deepfake, or algorithmic image). Engage with at least 5 peer-reviewed sources.",
                100, SA(5, 19), SA(6, 10), false);
            MakeAssignment(context, vc300.Id,
                "Final Visual Culture Presentation",
                "Deliver a 10-minute in-class presentation on a self-chosen visual culture topic. Submit your slide deck and a 300-word abstract one week before your allocated presentation slot.",
                50, SA(5, 26), SA(6, 14), false);
            var vc300Ungraded = MakeAssignment(context, vc300.Id,
                "Semiotics and Visual Analysis Critique",
                "Write a critique of digital interface semantics using Barthes' framework.",
                100, SA(5, 10), SA(6, 12), false);

            context.SaveChanges();

            // ─── 5. Submissions & Grades (past assignments only) ──────────────────
            SeedGradedWork(context, dv100Students, dv100A1, talya.Id,   1, "DV100");
            SeedGradedWork(context, dv100Students, dv100A2, talya.Id,   2, "DV100");
            SeedGradedWork(context, dv200Students, dv200A1, tsungai.Id, 1, "DV200");
            SeedGradedWork(context, dv200Students, dv200A2, tsungai.Id, 2, "DV200");
            SeedGradedWork(context, dv300Students, dv300A1, devTeacher.Id, 1, "DV300");
            SeedGradedWork(context, dv300Students, dv300A2, devTeacher.Id, 2, "DV300");
            SeedGradedWork(context, cc200Students, cc200A1, william.Id, 1, "CC200");
            SeedGradedWork(context, cc200Students, cc200A2, william.Id, 2, "CC200");
            SeedGradedWork(context, cc300Students, cc300A1, william.Id, 1, "CC300");
            SeedGradedWork(context, cc300Students, cc300A2, william.Id, 2, "CC300");
            SeedGradedWork(context, vc200Students, vc200A1, allen.Id,   1, "VC200");
            SeedGradedWork(context, vc200Students, vc200A2, allen.Id,   2, "VC200");
            SeedGradedWork(context, vc300Students, vc300A1, karl.Id,    1, "VC300");
            SeedGradedWork(context, vc300Students, vc300A2, karl.Id,    2, "VC300");
            // devstudent gets graded submissions for all past assignments too
            SeedGradedWork(context, devStudentList, dv100A1, talya.Id,   1, "DV100");
            SeedGradedWork(context, devStudentList, dv100A2, talya.Id,   2, "DV100");
            SeedGradedWork(context, devStudentList, dv200A1, tsungai.Id, 1, "DV200");
            SeedGradedWork(context, devStudentList, dv200A2, tsungai.Id, 2, "DV200");
            SeedGradedWork(context, devStudentList, dv300A1, devTeacher.Id, 1, "DV300");
            SeedGradedWork(context, devStudentList, dv300A2, devTeacher.Id, 2, "DV300");
            SeedGradedWork(context, devStudentList, cc200A1, william.Id, 1, "CC200");
            SeedGradedWork(context, devStudentList, cc200A2, william.Id, 2, "CC200");
            SeedGradedWork(context, devStudentList, cc300A1, william.Id, 1, "CC300");
            SeedGradedWork(context, devStudentList, cc300A2, william.Id, 2, "CC300");
            SeedGradedWork(context, devStudentList, vc200A1, allen.Id,   1, "VC200");
            SeedGradedWork(context, devStudentList, vc200A2, allen.Id,   2, "VC200");
            SeedGradedWork(context, devStudentList, vc300A1, karl.Id,    1, "VC300");
            SeedGradedWork(context, devStudentList, vc300A2, karl.Id,    2, "VC300");
            context.SaveChanges();

            // Seed ungraded work submitted by half of the students (including devStudent)
            SeedUngradedWork(context, dv100Students, devStudent, dv100Ungraded, "DV100");
            SeedUngradedWork(context, dv200Students, devStudent, dv200Ungraded, "DV200");
            SeedUngradedWork(context, dv300Students, devStudent, dv300Ungraded, "DV300");
            SeedUngradedWork(context, cc200Students, devStudent, cc200Ungraded, "CC200");
            SeedUngradedWork(context, cc300Students, devStudent, cc300Ungraded, "CC300");
            SeedUngradedWork(context, vc200Students, devStudent, vc200Ungraded, "VC200");
            SeedUngradedWork(context, vc300Students, devStudent, vc300Ungraded, "VC300");
            context.SaveChanges();

            // ─── 5b. Attendance (12 weekly sessions per course, Feb–May 2026) ──────
            SeedAttendance(context, dv100.Id, talya.Id,      dv100Students, devStudent);
            SeedAttendance(context, dv200.Id, tsungai.Id,    dv200Students, devStudent);
            SeedAttendance(context, dv300.Id, devTeacher.Id, dv300Students, devStudent);
            SeedAttendance(context, cc200.Id, william.Id,    cc200Students, devStudent);
            SeedAttendance(context, cc300.Id, william.Id,    cc300Students, devStudent);
            SeedAttendance(context, vc200.Id, allen.Id,      vc200Students, devStudent);
            SeedAttendance(context, vc300.Id, karl.Id,       vc300Students, devStudent);
            context.SaveChanges();

            // ─── 6. Announcements (12-15 per course, dating back to Feb 2026) ────

            // DV100 - Talya Bekker
            context.Announcements.AddRange(
                Ann(dv100.Id, talya.Id, "Welcome to DV100 - Semester 1, 2026",
                    "Welcome everyone! This semester we will cover the full foundations of web development - from semantic HTML through CSS layout systems to dynamic JavaScript applications. Please read the course outline document in the Modules section before our first class on Monday.",
                    "Notice", "#e83e8c", SA(2, 3, 9, 0)),
                Ann(dv100.Id, talya.Id, "Dev Environment Setup: Install These Before Monday",
                    "Before our first practical session you need VS Code, Node.js v22 LTS, the Live Server extension, and a GitHub account. Step-by-step installation guides for Windows and Mac have been posted in the Modules section under Week 1 Resources.",
                    "Resource", "#17a2b8", SA(2, 9, 9, 0)),
                Ann(dv100.Id, talya.Id, "Week 3 Recap - CSS Box Model & Flexbox",
                    "Great session yesterday! The Box Model and Flexbox notes are now uploaded. If you are still confused about the difference between margin, border, and padding - the interactive MDN visualiser linked in the notes is gold. Practice the Flexbox Froggy exercises before next week.",
                    "Update", "#6c757d", SA(2, 17, 9, 0)),
                Ann(dv100.Id, talya.Id, "Attendance Policy - Important Reminder",
                    "A minimum of 80% attendance is required to qualify for final assessments. If you are unable to attend a session, please send me an email before the class, not after. Three unexcused absences will trigger an academic warning.",
                    "Notice", "#e83e8c", SA(2, 23, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 1 Brief Released: HTML & CSS Portfolio Page",
                    "Assignment 1 is now live in the Assignments section. You have three weeks to build a responsive personal portfolio page. Read the rubric carefully - semantic HTML structure and accessibility criteria are heavily weighted. Due: 14 March at 23:59.",
                    "Deadline", "#FF8731", SA(3, 2, 9, 0)),
                Ann(dv100.Id, talya.Id, "Open Q&A Session - Thursday 14:00",
                    "I am holding an open Q&A on Thursday at 14:00 via the usual Zoom link for Assignment 1 questions. Come with specific questions - the more targeted, the more useful the session will be for everyone.",
                    "Update", "#6c757d", SA(3, 9, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 1 Grades & Feedback Released",
                    "Grades and written feedback for Assignment 1 have been released. Most of you have done well on structure, but several submissions lost marks on responsiveness and semantic tag usage. Please review the feedback before starting Assignment 2.",
                    "Update", "#20c997", SA(3, 18, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 2 Brief: JavaScript Fundamentals Project",
                    "Assignment 2 is now live. You will be building a dynamic to-do list app using vanilla JavaScript - no frameworks allowed. Focus on clean logic and event handling. Due: 28 March at 23:59.",
                    "Deadline", "#FF8731", SA(3, 23, 9, 0)),
                Ann(dv100.Id, talya.Id, "Mid-Semester Check-In Notes",
                    "We are halfway through the semester. If you are falling behind, now is the time to act - not the week before submission. Consultation slots are Tuesdays 10:00-12:00. Book via the link in my email signature.",
                    "Notice", "#e83e8c", SA(4, 7, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 2 Grades Released",
                    "Assignment 2 grades are up. The JavaScript logic in most submissions was solid, but error handling and edge-case coverage were weak across the board. The feedback document posted in Modules explains the common mistakes in detail.",
                    "Update", "#20c997", SA(4, 8, 9, 0)),
                Ann(dv100.Id, talya.Id, "No Class - Public Holiday (27 April)",
                    "There is no class on Monday 27 April. The week's content will be self-directed - please complete the CSS Animation reading and the interactive exercises linked in Week 13 of the Modules section.",
                    "Notice", "#6c757d", SA(4, 24, 9, 0)),
                Ann(dv100.Id, talya.Id, "JavaScript DOM Manipulation - Workshop Recap",
                    "This week's workshop notes on DOM manipulation and event delegation have been uploaded. If you missed the session, the recording is on the student portal. The follow-along code repo is linked in the notes.",
                    "Resource", "#17a2b8", SA(5, 5, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 3 Brief Released: Responsive Web Design Challenge",
                    "Assignment 3 is now live. You will be making a desktop-only site fully responsive using a mobile-first CSS approach. Assets and the brief PDF are in the Assignments section. Due: 7 June at 23:59.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(dv100.Id, talya.Id, "Assignment 4 Brief Released: Interactive Form Validation",
                    "Assignment 4 is now live and is the final graded submission of the semester. Build a multi-step form with full client-side validation. Due: 14 June at 23:59. This one is weighted at 50 marks so budget your time accordingly.",
                    "Deadline", "#FF8731", SA(5, 26, 9, 0))
            );

            // DV200 - Tsungai Katsuro
            context.Announcements.AddRange(
                Ann(dv200.Id, tsungai.Id, "Welcome to DV200 - React & REST APIs",
                    "Welcome back! DV200 picks up where DV100 left off - we are going deep into React, REST APIs, and full-stack JavaScript. Expect to be challenged. The pace is faster than first year; please keep up with the weekly reading.",
                    "Notice", "#20c997", SA(2, 3, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Vite + React Setup Guide",
                    "We are using Vite this semester, not Create React App - it is faster and closer to industry practice. The setup guide with troubleshooting steps is in Modules under Week 1. If you hit errors, post in the class Discord before emailing me.",
                    "Resource", "#17a2b8", SA(2, 9, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Week 3 - Component Architecture & Props",
                    "This week's lecture notes on component design patterns and the single-responsibility principle have been uploaded. The key takeaway: keep your components small, focused, and dumb where possible. Smart logic lives in hooks or context.",
                    "Update", "#6c757d", SA(2, 16, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "GitHub Submission Policy - Read Before Assignment 1",
                    "All assignments must be submitted via GitHub Classroom. Create your repo from the invite link in the Assignment section, not from scratch. Submissions without a proper commit history will lose marks for process documentation.",
                    "Notice", "#20c997", SA(2, 24, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 1 Brief: React Component Library",
                    "Assignment 1 is now live. You are building a small but production-quality React component library. Think Shadcn/Material UI at a tiny scale. Focus on reusability, clear prop APIs, and thorough documentation. Due: 12 March.",
                    "Deadline", "#FF8731", SA(3, 2, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "React Hooks Deep Dive - Session Recording Posted",
                    "The recording of Wednesday's hooks deep dive (useState, useEffect, useCallback, useMemo, useRef) is now on the portal. There is a follow-along challenge in the Modules section that I expect you to complete before Thursday.",
                    "Update", "#6c757d", SA(3, 11, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 1 Grades & Feedback Released",
                    "Assignment 1 has been marked. Overall, good component structure and naming conventions. The main area of weakness was prop type validation and missing JSDoc documentation. Detailed feedback is in your GitHub repo as comments.",
                    "Update", "#20c997", SA(3, 18, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 2 Brief: REST API Integration Project",
                    "Assignment 2 is now live. Choose any public REST API and build a polished React front-end around it. The brief is in the Assignments section. Focus on handling all data states: loading, error, empty, and populated. Due: 26 March.",
                    "Deadline", "#FF8731", SA(3, 23, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Code Review Sessions Starting Monday",
                    "Starting Monday I will be running 30-minute code review slots (sign-up sheet in the server). This is voluntary but strongly recommended before final submission. Show up with your repo open and questions prepared.",
                    "Notice", "#20c997", SA(4, 1, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 2 Grades & Feedback Released",
                    "Assignment 2 marks are up. Strong work on data fetching and component rendering. The recurring issue was poor error handling - several apps just crashed on 404 or network failure. Read the feedback notes on graceful degradation in Modules.",
                    "Update", "#20c997", SA(4, 9, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "State Management Workshop - Notes & Code Posted",
                    "Notes from Monday's Zustand vs Context API workshop are up. My recommendation: Context for lightweight shared state, Zustand for anything that needs middleware or complex logic. The decision tree diagram is in the Week 10 folder.",
                    "Resource", "#17a2b8", SA(4, 21, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Backend Integration Begins - Week 11",
                    "From next week we shift to Node.js and Express. Make sure your Node environment is set up correctly (guide in Modules). We will be writing our first REST API from scratch on Monday - bring your laptop and be ready to code.",
                    "Update", "#6c757d", SA(5, 6, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 3 Brief: Full-Stack CRUD Application",
                    "Assignment 3 is now live - this is the big one for the semester. You will be building a complete full-stack app with an Express/Node back-end and React front-end, connected to a real PostgreSQL database. Due: 9 June.",
                    "Deadline", "#FF8731", SA(5, 20, 9, 0)),
                Ann(dv200.Id, tsungai.Id, "Assignment 4 Brief: Authentication System",
                    "Assignment 4 extends your CRUD app with JWT authentication. This is worth 50 marks. I will be checking for secure password hashing, token expiry handling, and protected routes. Due: 16 June. Start early.",
                    "Deadline", "#FF8731", SA(5, 27, 9, 0))
            );

            // DV300 - Dev Teacher (co-taught with Tsungai Katsuro & Simba Zengeni)
            context.Announcements.AddRange(
                Ann(dv300.Id, devTeacher.Id, "Welcome to DV300 - Industry-Ready Development",
                    "Welcome to third year. DV300 is not a course - it is a simulation of industry. You will work in teams, manage sprints, document your architecture, and deploy to production. Set your expectations accordingly. Onboarding brief is in Modules.",
                    "Notice", "#1a1a8c", SA(2, 2, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Technical Spec Template Released",
                    "The architecture document template is now in the Modules section. Read it before Monday's session. Your Tech Spec (Assignment 1) will be assessed against this structure - no surprises if you follow it.",
                    "Resource", "#17a2b8", SA(2, 9, 9, 0)),
                Ann(dv300.Id, tsungai.Id, "System Architecture Lecture Recap - Week 3",
                    "Notes from Wednesday's architecture session are uploaded. Key concepts: separation of concerns, the role of an API gateway, stateless vs stateful design, and why your database schema is your most important architectural decision.",
                    "Update", "#6c757d", SA(2, 17, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Assignment 1 Brief: Technical Architecture Document",
                    "Assignment 1 is live. You will design and document the full system architecture for your term project. ERD, API map, deployment pipeline, security model - it all needs to be there. Due: 10 March at 23:59.",
                    "Deadline", "#FF8731", SA(2, 24, 9, 0)),
                Ann(dv300.Id, tsungai.Id, "Architecture Peer Review Session - Thursday",
                    "On Thursday we will do structured peer reviews of your draft architecture documents. Bring a printed or shared copy. You will give feedback to two peers using the rubric checklist posted in Modules.",
                    "Update", "#6c757d", SA(3, 3, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Assignment 1 Grades Released",
                    "Architecture documents have been marked. Strong work on ERDs overall - the deployment pipeline diagrams were the weakest area. Several submissions lacked a security section entirely. Feedback is inline in your submitted documents.",
                    "Update", "#20c997", SA(3, 12, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Sprint 1 Brief Released",
                    "Sprint 1 is now live. You have until 24 March to deliver a working vertical slice: auth, one complete feature deployed to a live staging URL, and a 10-minute code review on Monday the 23rd. Brief is in Assignments.",
                    "Deadline", "#FF8731", SA(3, 16, 9, 0)),
                Ann(dv300.Id, simba.Id, "Sprint 1 Code Review - Booking Slots Open",
                    "Sprint 1 code review slots are now open in the booking sheet (link in server). Each team gets 20 minutes. Come with your staging URL live, your repo open, and be ready to explain every line you wrote.",
                    "Notice", "#1a1a8c", SA(3, 19, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Sprint 1 Grades & Feedback Released",
                    "Sprint 1 results are up. Most teams have solid auth flows. The common failure mode: inconsistent API error handling on the front-end. Read the shared feedback document in Modules - it applies to almost everyone.",
                    "Update", "#20c997", SA(4, 1, 9, 0)),
                Ann(dv300.Id, tsungai.Id, "API Design Workshop - OpenAPI & Swagger",
                    "This week's workshop slides and the Swagger sandbox we used are in Modules. Your OpenAPI spec for Assignment 3 should follow the patterns we practiced. If your endpoints are not documented in Swagger you will lose marks.",
                    "Resource", "#17a2b8", SA(4, 8, 9, 0)),
                Ann(dv300.Id, simba.Id, "Cloud Deployment Workshop - Render & Vercel Recap",
                    "Notes and commands from today's cloud deployment session are posted. Environment variable management, database connection pooling, and CI/CD basics via GitHub Actions were all covered. The repo template we used is pinned in the server.",
                    "Resource", "#17a2b8", SA(4, 22, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Code Quality & PR Review Standards",
                    "From now on, all code changes must go through a pull request reviewed by at least one teammate. The PR checklist template is in Modules. I will be checking your commit histories and PR comments when I mark Sprint 2.",
                    "Notice", "#1a1a8c", SA(5, 5, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Assignment 3 Brief: API Documentation Review",
                    "Assignment 3 is live. Your entire API must be fully documented in Swagger/OpenAPI format. All endpoints, schemas, error codes, and auth flows. Due: 5 June. This is a 50-mark assignment - do not underestimate it.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(dv300.Id, devTeacher.Id, "Sprint 2 Brief Released - Final Project Milestone",
                    "Sprint 2 is the final milestone of your term project. Full feature set, automated tests on critical paths, a live walkthrough demo to the class, and a recorded video walkthrough. Due: 13 June. No extensions.",
                    "Deadline", "#FF8731", SA(5, 26, 9, 0))
            );

            // CC200 - William Basson
            context.Announcements.AddRange(
                Ann(cc200.Id, william.Id, "Welcome to CC200 - Digital Design Foundations",
                    "Welcome to Creative Computing 200! This semester is all about building your visual language through digital tools. We will cover Illustrator, InDesign, After Effects, and brand identity design. Check the kit list in Modules - CC licence required.",
                    "Notice", "#fd7e14", SA(2, 3, 9, 0)),
                Ann(cc200.Id, william.Id, "Adobe Creative Cloud - Student Licence Setup",
                    "If you have not activated your student Adobe CC licence yet, do it today - the link is in your student email. You need Illustrator, InDesign, and After Effects for this semester. IT can help if you get stuck - Room 203.",
                    "Resource", "#17a2b8", SA(2, 10, 9, 0)),
                Ann(cc200.Id, william.Id, "Week 3 - Visual Language Workshop Notes",
                    "This week's workshop on colour theory, visual hierarchy, and Gestalt principles has been summarised in a PDF in Modules. These concepts will be assessed in Assignment 1 - know them well.",
                    "Update", "#6c757d", SA(2, 17, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 1 Brief: Digital Illustration Series",
                    "Assignment 1 is live. You are creating three cohesive digital illustrations in Illustrator. They must share a visual language - consistent colour palette, type system, and compositional logic. Due: 8 March at 23:59.",
                    "Deadline", "#FF8731", SA(2, 23, 9, 0)),
                Ann(cc200.Id, william.Id, "Illustration Techniques Workshop - Recap",
                    "Today's workshop on vector illustration techniques (pen tool precision, gradient meshes, Live Paint) has been recorded. The recording is on the portal - watch it before attempting the second illustration in your series.",
                    "Update", "#6c757d", SA(3, 3, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 1 Grades & Feedback Released",
                    "Assignment 1 has been marked. Overall results were strong - the cohesive series concept landed well in most submissions. The main weaknesses: rough pen tool paths and colour palettes that were too safe. Read the inline feedback on your submitted files.",
                    "Update", "#20c997", SA(3, 11, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 2 Brief: Typography & Layout Fundamentals",
                    "Assignment 2 is now live. You will be designing a 4-page editorial spread in InDesign for a provided article. Baseline grid usage and typographic hierarchy are the core assessment criteria. Due: 22 March.",
                    "Deadline", "#FF8731", SA(3, 16, 9, 0)),
                Ann(cc200.Id, william.Id, "Typography Workshop - Notes & Font Resources",
                    "This week's workshop notes on typographic systems - type pairing, grid construction, and InDesign master pages - are in Modules. The Adobe Fonts library linked in the notes has everything you need. No free fonts from DaFont.",
                    "Resource", "#17a2b8", SA(3, 25, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 2 Grades Released",
                    "Assignment 2 results are up. InDesign proficiency has improved significantly. The weakest area: too many submissions ignored the baseline grid entirely. If your spreads look uneven it is almost always a grid problem. Feedback is on your files.",
                    "Update", "#20c997", SA(4, 2, 9, 0)),
                Ann(cc200.Id, william.Id, "Motion Graphics - After Effects Introduction",
                    "We start After Effects next week. If you have never used it before, watch the two intro tutorials in Modules before Monday. Come with AE installed and verified working - do not arrive and spend the first 30 minutes installing software.",
                    "Notice", "#fd7e14", SA(4, 9, 9, 0)),
                Ann(cc200.Id, william.Id, "Visual Identity - Brand Theory Lecture Notes",
                    "Notes from Monday's brand identity theory lecture are uploaded. Key concept: a brand system is a set of rules, not a set of assets. Your brand identity brief (Assignment 4) needs to demonstrate this understanding.",
                    "Update", "#6c757d", SA(4, 22, 9, 0)),
                Ann(cc200.Id, william.Id, "Motion Design Workshop Recap - Easing & Timing",
                    "The workshop on animation timing and easing curves is summarised in the PDF in Modules. The twelve principles of animation apply to motion graphics - the list is in Week 12 of Modules. Assignment 3 will be assessed against these principles.",
                    "Resource", "#17a2b8", SA(5, 6, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 3 Brief: Motion Graphics Concept",
                    "Assignment 3 is live. You are producing a 15-30 second motion graphic explainer in After Effects. Submit your storyboard, animatic, and final export. Due: 4 June.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(cc200.Id, william.Id, "Assignment 4 Brief: Brand Identity System Draft",
                    "Assignment 4 is the final graded piece of the semester. Design a complete foundational brand identity for a fictitious company. Logo, colour palette, typeface, brand style guide - all of it. Due: 12 June. 50 marks.",
                    "Deadline", "#FF8731", SA(5, 26, 9, 0))
            );

            // CC300 - William Basson
            context.Announcements.AddRange(
                Ann(cc300.Id, william.Id, "Welcome to CC300 - Generative Art & Physical Computing",
                    "Welcome to CC300. This year we go beyond the screen - generative code, physical interaction, and work designed for real exhibition spaces. This is the most open-ended course in the programme; the brief is deliberately broad. Bring your ambition.",
                    "Notice", "#7b2d8b", SA(2, 3, 9, 0)),
                Ann(cc300.Id, william.Id, "p5.js Setup & Your First Sketch",
                    "Set up the p5.js editor at editor.p5js.org and complete the Hello Circle tutorial in Modules before Monday. We will be building on this in class. If you want to use VS Code locally instead, the setup guide is also in Modules.",
                    "Resource", "#17a2b8", SA(2, 10, 9, 0)),
                Ann(cc300.Id, william.Id, "Week 3 - Generative Systems Lecture Notes",
                    "Notes from Wednesday's lecture on generative systems, emergence, and parametric design are in Modules. The key reading is Galanter's 'What is Generative Art?' - this paper will come up in your artist statements.",
                    "Update", "#6c757d", SA(2, 17, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 1 Brief: Generative Art Portfolio",
                    "Assignment 1 is live. Three generative artworks in p5.js, each using a different algorithm. Artist statements for each. The brief PDF with algorithm prompts is in the Assignments section. Due: 13 March.",
                    "Deadline", "#FF8731", SA(2, 23, 9, 0)),
                Ann(cc300.Id, william.Id, "Noise Functions Workshop - Code & Notes Posted",
                    "The Perlin noise and domain warping workshop code is on the class GitHub. Fork it and experiment. If your sketches look too uniform, you are probably not varying the noise seed or amplitude enough - the notes explain the parameters.",
                    "Resource", "#17a2b8", SA(3, 4, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 1 Grades & Feedback Released",
                    "Assignment 1 has been marked. Strong conceptual work across the board - the generative logic is getting more sophisticated. The main gap: artist statements that describe what the code does rather than why it matters. That distinction is critical.",
                    "Update", "#20c997", SA(3, 16, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 2 Brief: Physical Computing Prototype",
                    "Assignment 2 is live. Build a physical computing prototype with Arduino - at least two sensor types, a meaningful output, and full documentation (schematic, code comments, process photos). Due: 27 March.",
                    "Deadline", "#FF8731", SA(3, 20, 9, 0)),
                Ann(cc300.Id, william.Id, "Arduino Kit Collection - Room 205",
                    "Arduino kits are available for loan from Room 205 (bring your student card). Each kit includes an Uno R3, breadboard, LEDs, resistors, potentiometer, photoresistor, servo, and an HC-SR04 ultrasonic sensor. Loan period: 2 weeks.",
                    "Resource", "#17a2b8", SA(3, 21, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 2 Grades & Feedback Released",
                    "Physical computing prototypes have been assessed. Great range of sensor applications. The documentation was the differentiator - the best submissions had clear schematics and well-commented code. Vague or missing process documentation cost marks across the cohort.",
                    "Update", "#20c997", SA(4, 3, 9, 0)),
                Ann(cc300.Id, william.Id, "Exhibition Space Briefing - End-of-Year Show",
                    "A brief on the end-of-year exhibition space has been posted in Modules. Read it before we discuss your Assignment 3 concepts on Thursday. You need to know your physical constraints before you design for them.",
                    "Notice", "#7b2d8b", SA(4, 10, 9, 0)),
                Ann(cc300.Id, william.Id, "Visitor Experience Design - Lecture Notes",
                    "Notes from Monday's lecture on designing interactive experiences for uninstructed visitors are in Modules. The key principle: the piece must communicate its own interaction model. If you need to explain it, the design is incomplete.",
                    "Update", "#6c757d", SA(4, 21, 9, 0)),
                Ann(cc300.Id, william.Id, "Exhibition Theme Announced: Signal / Noise",
                    "The end-of-year exhibition theme has been confirmed: Signal / Noise. Your Assignment 3 and 4 work should respond to this theme conceptually, not just formally. Think about what you are amplifying and what you are filtering.",
                    "Notice", "#7b2d8b", SA(5, 5, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 3 Brief: Creative Coding Exhibition Piece",
                    "Assignment 3 is live. Build a standalone interactive artwork for public exhibition under the Signal/Noise theme. It must run autonomously for 30+ minutes. Due: 6 June.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(cc300.Id, william.Id, "Assignment 4 Brief: Interactive Installation Written Brief",
                    "Assignment 4 is your written brief for the end-of-year installation. 1500 words, visual references, floor plan, technical spec, visitor experience flow. This is 50 marks. Due: 16 June.",
                    "Deadline", "#FF8731", SA(5, 26, 9, 0))
            );

            // VC200 - Allen Laing
            context.Announcements.AddRange(
                Ann(vc200.Id, allen.Id, "Welcome to VC200 - Photography & Visual Research",
                    "Welcome to Visual Communication 200. This semester we are developing your eye and your analytical voice through photography and visual research. The studio is yours - use the booking system responsibly and leave it clean.",
                    "Notice", "#17a2b8", SA(2, 3, 9, 0)),
                Ann(vc200.Id, allen.Id, "Studio Booking & Equipment Policy",
                    "The studio booking system link is in Modules. Camera kit loans are handled by the equipment room (bring your student card). Return everything by 17:00 on the loan date - late returns will result in loan privileges being suspended.",
                    "Resource", "#6c757d", SA(2, 10, 9, 0)),
                Ann(vc200.Id, allen.Id, "Week 3 - Visual Research Methods Lecture Notes",
                    "Notes from Wednesday's lecture on visual research methodologies - the archive, the field, the studio - are in Modules. Assignment 1 asks you to engage with all three. Start collecting images for your research document now.",
                    "Update", "#6c757d", SA(2, 17, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 1 Brief: Visual Research Document",
                    "Assignment 1 is live. You will compile a 20-page visual research document on a chosen visual theme. Minimum 10 cited sources. Each image must be contextualised, not just described. Due: 11 March.",
                    "Deadline", "#FF8731", SA(2, 24, 9, 0)),
                Ann(vc200.Id, allen.Id, "Research Workshop Recap - Finding & Citing Sources",
                    "Today's workshop on academic image sourcing - JSTOR, the South African Visual Arts Journal, Aperture archive, and Getty Research - is summarised in Modules. Your visual research must cite credible sources, not Pinterest.",
                    "Resource", "#17a2b8", SA(3, 4, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 1 Grades & Feedback Released",
                    "Assignment 1 grades are posted. The visual breadth in most documents was impressive. The main issue: contextualisation was often superficial - describing an image's content rather than its cultural or historical significance. Feedback is on each submission.",
                    "Update", "#20c997", SA(3, 13, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 2 Brief: Image-Making Workshop Series",
                    "Assignment 2 covers the three in-class workshops: studio photography (Week 7), found-image collage (Week 8), darkroom printing (Week 9). Attendance is mandatory. Written reflection due: 25 March.",
                    "Deadline", "#FF8731", SA(3, 17, 9, 0)),
                Ann(vc200.Id, allen.Id, "Darkroom Session - Preparation Reminder",
                    "For Thursday's darkroom session: wear clothes you do not mind getting chemical marks on, tie back long hair, and read the darkroom safety document in Modules before you arrive. No phones in the darkroom.",
                    "Notice", "#17a2b8", SA(3, 24, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 2 Grades & Feedback Released",
                    "Workshop series reflections have been marked. Strong personal voice in most submissions. The collage workshop produced the most interesting work this semester. Feedback is on your submitted documents.",
                    "Update", "#20c997", SA(4, 3, 9, 0)),
                Ann(vc200.Id, allen.Id, "Photography Field Trip - Cape Town City Bowl, 18 April",
                    "We are doing a half-day photography field trip to the CBD on Saturday 18 April, 08:00-12:00. This directly feeds into Assignment 3's Threshold theme. Attendance is not compulsory but strongly recommended. Details and waiver in Modules.",
                    "Notice", "#17a2b8", SA(4, 9, 9, 0)),
                Ann(vc200.Id, allen.Id, "Threshold Theme - Conceptual Depth Notes",
                    "Notes from Thursday's seminar on the concept of Threshold - physical, psychological, temporal, cultural - are in Modules. Assignment 3 rewards conceptual depth alongside technical photographic quality. Start thinking before you start shooting.",
                    "Update", "#6c757d", SA(4, 23, 9, 0)),
                Ann(vc200.Id, allen.Id, "Photography Ethics & Consent Guidelines",
                    "Before shooting for Assignment 3 in public or semi-public spaces, read the photography ethics and consent guide in Modules. Photographing people in recognisable circumstances without consent is not acceptable - there are no exceptions.",
                    "Notice", "#17a2b8", SA(5, 7, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 3 Brief: Photography Series - Urban Spaces",
                    "Assignment 3 is now live. 12 photographs on the theme Threshold, artist statement, edited at 300 dpi. Due: 3 June. This is your primary individual portfolio piece for the semester.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(vc200.Id, allen.Id, "Assignment 4 Brief: Visual Narrative Board",
                    "Assignment 4 is live. Create a 10-panel visual narrative combining photography, illustration, and text. No caption - the images must carry the story on their own. Due: 15 June. 50 marks.",
                    "Deadline", "#FF8731", SA(5, 27, 9, 0))
            );

            // VC300 - Karl van Heerden
            context.Announcements.AddRange(
                Ann(vc300.Id, karl.Id, "Welcome to VC300 - Visual Culture in the 21st Century",
                    "Welcome to Visual Communication 300. This course operates at the intersection of visual theory, critical thinking, and cultural analysis. You are not here to make things - you are here to understand why things look the way they do, and what that means. The reading schedule is in Modules.",
                    "Notice", "#6d2b91", SA(2, 2, 9, 0)),
                Ann(vc300.Id, karl.Id, "Semiotic Theory Reading List",
                    "The core reading list for Semester 1 is now in Modules. Begin with Saussure's Course in General Linguistics (Part 1) and Barthes' Mythologies (selected chapters). These are non-negotiable foundations for Assignment 1.",
                    "Resource", "#17a2b8", SA(2, 9, 9, 0)),
                Ann(vc300.Id, karl.Id, "Week 3 - Barthes, Myth & Ideology",
                    "This week we examined how visual myths operate to naturalise ideology. The lecture recording and annotated slides are in Modules. The key question for your assignment: how does the sign conceal its own construction?",
                    "Update", "#6c757d", SA(2, 16, 9, 0)),
                Ann(vc300.Id, karl.Id, "Assignment 1 Brief: Semiotic Analysis Essay",
                    "Assignment 1 is now live. A 2000-word semiotic analysis of a contemporary advertising campaign using Saussure and Peirce. The brief, essay scaffold, and rubric are all in the Assignments section. Due: 7 March.",
                    "Deadline", "#FF8731", SA(2, 23, 9, 0)),
                Ann(vc300.Id, karl.Id, "Essay Clinics - Book a Slot",
                    "I am holding essay clinic slots on Thursdays 14:00-16:00 for the next two weeks (sign-up sheet in Modules). Bring a draft or at least an argument outline. These are limited to 20 students so book early.",
                    "Notice", "#6d2b91", SA(3, 2, 9, 0)),
                Ann(vc300.Id, karl.Id, "Academic Writing Workshop - Notes Posted",
                    "The academic writing workshop notes on argumentative structure, use of evidence, and referencing visual sources using Harvard style are in Modules. The referencing guide is particularly relevant - images must be cited like any other source.",
                    "Resource", "#17a2b8", SA(3, 9, 9, 0)),
                Ann(vc300.Id, karl.Id, "Assignment 1 Grades & Feedback Released",
                    "Essay grades are posted. The semiotic analysis was the best performance in this cohort in several years. Strong close reading skills are evident. The main weaknesses: lack of a clear argument and incomplete secondary source engagement.",
                    "Update", "#20c997", SA(3, 14, 9, 0)),
                Ann(vc300.Id, karl.Id, "Assignment 2 Brief: Visual Systems Case Study",
                    "Assignment 2 is live. Select a real-world visual system and produce a 15-slide case study. This is an analytical exercise, not a design exercise. Due: 21 March.",
                    "Deadline", "#FF8731", SA(3, 17, 9, 0)),
                Ann(vc300.Id, karl.Id, "Presentation Format & Slide Design Standards",
                    "A guide on academic presentation design - hierarchy, restraint, image citation - has been posted in Modules. Your Case Study deck will be assessed partly on its visual quality. Do not use default PowerPoint templates.",
                    "Resource", "#17a2b8", SA(3, 24, 9, 0)),
                Ann(vc300.Id, karl.Id, "Assignment 2 Grades Released",
                    "Case study decks have been assessed. Excellent range of subject choices this year. The analysis was generally rigorous. Key takeaway: a case study makes an argument - it is not a tour. Several submissions were excellent tours. Feedback is on each submission.",
                    "Update", "#20c997", SA(4, 1, 9, 0)),
                Ann(vc300.Id, karl.Id, "Guest Lecture - Dr Nadia Jacobson on Digital Visual Cultures",
                    "We have a guest lecture next Tuesday at 11:00 from Dr Nadia Jacobson (UCT Visual Studies): Algorithmic Curation and the Death of the Accidental Image. Attendance is expected. It is directly relevant to Assignments 3 and 4.",
                    "Notice", "#6d2b91", SA(4, 7, 9, 0)),
                Ann(vc300.Id, karl.Id, "Algorithmic Image & AI - Lecture Notes Posted",
                    "Notes from Monday's lecture on the algorithmic image, AI-generated visuals, and the crisis of visual authenticity are in Modules. This is the emerging discourse you need to engage with in Assignment 3 if you choose this topic.",
                    "Update", "#6c757d", SA(4, 21, 9, 0)),
                Ann(vc300.Id, karl.Id, "Meme Culture & Visual Semiotics - Workshop Notes",
                    "The notes from our workshop on meme culture as a site of visual semiotic production - the remix, the modification, the derivative sign - are in Modules. Meme analysis is a legitimate and rich area for Assignment 3.",
                    "Resource", "#17a2b8", SA(5, 5, 9, 0)),
                Ann(vc300.Id, karl.Id, "Assignment 3 Brief: Contemporary Media Critique",
                    "Assignment 3 is live. A 1500-word critical analysis of a digital media artefact of your choosing. Minimum 5 peer-reviewed sources. Due: 10 June.",
                    "Deadline", "#FF8731", SA(5, 19, 9, 0)),
                Ann(vc300.Id, karl.Id, "Final Presentation Brief Released",
                    "Assignment 4 - the final presentation - brief is now live. 10-minute in-class presentation, slide deck, and a 300-word abstract due one week before your slot. Presentation slots will be allocated in Week 15. 50 marks.",
                    "Deadline", "#FF8731", SA(5, 26, 9, 0))
            );
            context.SaveChanges();

            // ─── 7. Calendar Events (rolling 8-week window) ───────────────────────
            SeedEvents(context, dv100.Id, dv200.Id, dv300.Id, cc200.Id, cc300.Id, vc200.Id, vc300.Id,
                       devTeacher.Id, tsungai.Id, simba.Id);
            context.SaveChanges();
        }

        // ─── Helpers ──────────────────────────────────────────────────────────────

        private static void ClearAll(AppDbContext context)
        {
            // Delete in FK-safe order. Announcements is already empty (table was just rebuilt).
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Feedbacks"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Grades"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Submissions"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Assignments"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Attendances"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""CheckInSessions"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Events"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""TodoItems"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""CourseModuleItems"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""CourseModules"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Notes"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Materials"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Enrollments"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Classes"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Timetables"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Courses"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Subjects"";");
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Users"";");
        }

        private static User MakeUser(string email, string first, string last, UserRole role) =>
            new User { Email = email, PasswordHash = Hash, FirstName = first, LastName = last, Role = role };

        private static (Subject, Course) MakeCourse(AppDbContext context, string adminId,
            string code, string name, string desc, string term, int year, string teacherId, int capacity)
        {
            var subject = new Subject { Name = name, Code = code, Description = desc, CreatedBy = adminId };
            context.Subjects.Add(subject);
            context.SaveChanges();
            var course = new Course { Term = term, Year = year, Capacity = capacity, SubjectId = subject.Id, TeacherId = teacherId };
            context.Courses.Add(course);
            context.SaveChanges();
            return (subject, course);
        }

        private static List<User> GenStudents(AppDbContext context, int offset, int count)
        {
            var list = new List<User>();
            for (int i = 0; i < count; i++)
            {
                int n = offset + i;
                string first = AllFirstNames[n % AllFirstNames.Length];
                string last  = AllLastNames[(n * 3 + 7) % AllLastNames.Length];
                string email = $"{ToEmailPart(first)}.{ToEmailPart(last)}{(n + 1):D4}@learnonline.co.za";
                var u = new User { Email = email, PasswordHash = Hash, FirstName = first, LastName = last, Role = UserRole.student };
                context.Users.Add(u);
                list.Add(u);
            }
            return list;
        }

        private static string ToEmailPart(string name) =>
            name.ToLower()
                .Replace(" ", "")
                .Replace("a\u0308", "a").Replace("e\u0308", "e").Replace("u\u0308", "u")
                .Replace("a\u0301", "a").Replace("e\u0301", "e").Replace("i\u0301", "i")
                .Replace("o\u0301", "o").Replace("u\u0301", "u").Replace("n\u0303", "n")
                .Replace("c\u0327", "c");

        private static void Enrol(AppDbContext context, List<User> students, string courseId)
        {
            var baseDate = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc);
            for (int i = 0; i < students.Count; i++)
            {
                context.Enrollments.Add(new Enrollment
                {
                    CourseId  = courseId,
                    StudentId = students[i].Id,
                    Status    = "Active",
                    EnrolledAt = baseDate.AddDays(i % 14).AddHours(i % 10)
                });
            }
        }

        private static Assignment MakeAssignment(AppDbContext context, string courseId,
            string title, string desc, int maxPoints, DateTime openDate, DateTime dueDate, bool isClosed)
        {
            var a = new Assignment
            {
                CourseId    = courseId,
                Title       = title,
                Description = desc,
                MaxPoints   = maxPoints,
                OpenDate    = openDate,
                DueDate     = dueDate,
                CreatedAt   = openDate.AddDays(-1),
                IsClosed    = isClosed,
                Type        = "online"
            };
            context.Assignments.Add(a);
            return a;
        }

        private static void SeedGradedWork(AppDbContext context, List<User> students,
            Assignment assignment, string teacherId, int assignmentOffset, string courseCode)
        {
            var dueDate  = assignment.DueDate!.Value;
            var gradedAt = dueDate.AddDays(7);
            var maxPts   = assignment.MaxPoints ?? 100;

            for (int i = 0; i < students.Count; i++)
            {
                DateTime submittedAt;
                string   status;

                if (i % 20 == 19)
                {
                    // ~5%: late submissions
                    submittedAt = dueDate.AddHours(9 + (i % 12));
                    status = "Late";
                }
                else if (i % 10 == 9)
                {
                    // ~10%: last-minute (within the final hour)
                    submittedAt = dueDate.AddHours(-1);
                    status = "Graded";
                }
                else
                {
                    // ~85%: submitted 1-5 days before the deadline
                    submittedAt = dueDate.AddDays(-((i % 5) + 1)).AddHours(-(i % 16));
                    status = "Graded";
                }

                var submission = new Submission
                {
                    AssignmentId = assignment.Id,
                    StudentId    = students[i].Id,
                    SubmittedAt  = submittedAt,
                    Status       = status,
                    FileUrl      = $"/uploads/{courseCode.ToLower()}/{ToSlug(assignment.Title)}/{students[i].Id}.pdf"
                };
                context.Submissions.Add(submission);

                var points = CalcGrade(i, assignmentOffset, maxPts);

                context.Grades.Add(new Grade
                {
                    SubmissionId = submission.Id,
                    PointsEarned = points,
                    GradedAt     = gradedAt.AddHours(i % 48),
                    GradedBy     = teacherId,
                    IsReleased   = true
                });

                context.Feedbacks.Add(new Feedback
                {
                    SubmissionId = submission.Id,
                    TeacherId    = teacherId,
                    Content      = CalcFeedback(points, maxPts),
                    CreatedAt    = gradedAt.AddHours(i % 48)
                });
            }
        }

        private static void SeedUngradedWork(AppDbContext context, List<User> students, User devStudent,
            Assignment assignment, string courseCode)
        {
            var dueDate = assignment.DueDate!.Value;
            var submittedAt = dueDate.AddDays(-2);

            // Get all enrolled students
            var allCourseStudents = students.Concat(new[] { devStudent }).ToList();

            // We want half of them to submit.
            // Let's ensure devStudent is one of them.
            // Let's say we select devStudent, and then every 2nd student from the rest.
            int countToSubmit = allCourseStudents.Count / 2;
            if (countToSubmit < 1) countToSubmit = 1;

            var submitters = new List<User> { devStudent };
            var remainingStudents = students.Where(s => s.Id != devStudent.Id).ToList();

            for (int i = 0; i < remainingStudents.Count && submitters.Count < countToSubmit; i++)
            {
                if (i % 2 == 0)
                {
                    submitters.Add(remainingStudents[i]);
                }
            }

            // If we still need more to reach half (due to rounding/odd numbers)
            for (int i = 0; i < remainingStudents.Count && submitters.Count < countToSubmit; i++)
            {
                if (!submitters.Contains(remainingStudents[i]))
                {
                    submitters.Add(remainingStudents[i]);
                }
            }

            foreach (var student in submitters)
            {
                var submission = new Submission
                {
                    AssignmentId = assignment.Id,
                    StudentId    = student.Id,
                    SubmittedAt  = submittedAt,
                    Status       = "Submitted",
                    FileUrl      = $"/uploads/{courseCode.ToLower()}/{ToSlug(assignment.Title)}/{student.Id}.pdf"
                };
                context.Submissions.Add(submission);
            }
        }

        private static void SeedAttendance(AppDbContext context,
            string courseId, string teacherId, List<User> students, User devStudent)
        {
            var sessionTypes = new[] {
                "Lecture", "Lecture", "Tutorial", "Lecture",  "Practical",
                "Lecture", "Tutorial", "Lecture",  "Lecture",  "Practical",
                "Tutorial", "Lecture"
            };
            var times = new Dictionary<string, string>
            {
                ["Lecture"]   = "09:00",
                ["Tutorial"]  = "14:00",
                ["Practical"] = "11:00"
            };
            var startDate = new DateTime(2026, 2, 9, 0, 0, 0, DateTimeKind.Utc);
            var all = new List<User>(students) { devStudent };

            for (int s = 0; s < sessionTypes.Length; s++)
            {
                var date        = startDate.AddDays(s * 7);
                var sessionType = sessionTypes[s];
                var time        = times[sessionType];

                for (int i = 0; i < all.Count; i++)
                {
                    var roll = (i * 3 + s * 7) % 20;
                    string status = roll switch
                    {
                        3 or 13 => "Absent",
                        7       => "Late",
                        _       => "Present"
                    };
                    context.Attendances.Add(new Attendance
                    {
                        CourseId    = courseId,
                        StudentId   = all[i].Id,
                        Date        = date,
                        Status      = status,
                        SessionType = sessionType,
                        Time        = time,
                        RecordedById = teacherId,
                        RecordedAt  = date.AddHours(2)
                    });
                }
            }
        }

        private static decimal CalcGrade(int idx, int offset, int maxPoints)
        {
            // Produces a realistic distribution:
            // ~5% fail (<50), ~20% struggle (50-64), ~60% pass (65-79), ~15% excel (80+)
            int bucket = (idx * 7 + offset * 13) % 100;
            int raw;
            if (bucket < 5)
                raw = 30 + ((idx + offset) % 20);           // 30-49
            else if (bucket < 25)
                raw = 50 + ((idx * 3 + offset * 5) % 15);   // 50-64
            else if (bucket < 85)
                raw = 65 + ((idx * 11 + offset * 7) % 15);  // 65-79
            else
                raw = 80 + ((idx * 17 + offset * 3) % 18);  // 80-97
            raw = Math.Min(raw, 100);
            return Math.Round((decimal)raw / 100m * maxPoints, 0);
        }

        private static string CalcFeedback(decimal points, int maxPoints)
        {
            double pct  = (double)points / maxPoints * 100;
            int    seed = (int)(points * 7 + maxPoints) % 5;
            if (pct >= 80) return PositiveFeedback[seed % PositiveFeedback.Length];
            if (pct >= 65) return GoodFeedback[seed % GoodFeedback.Length];
            if (pct >= 50) return AverageFeedback[seed % AverageFeedback.Length];
            return PoorFeedback[seed % PoorFeedback.Length];
        }

        private static Announcement Ann(string courseId, string lecturerId,
            string title, string preview, string label, string color, DateTime datePosted) =>
            new Announcement
            {
                CourseId   = courseId,
                LecturerId = lecturerId,
                Title      = title,
                Preview    = preview,
                Label      = label,
                Color      = color,
                DatePosted = datePosted
            };

        private static void SeedEvents(AppDbContext context,
            string dv100Id, string dv200Id, string dv300Id,
            string cc200Id, string cc300Id, string vc200Id, string vc300Id,
            string williamId, string tsungaiId, string simbaId)
        {
            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Events"";");

            var saZ       = TimeSpan.FromHours(2);
            var todaySa   = DateTimeOffset.UtcNow.ToOffset(saZ).Date;
            int diff      = (7 + (todaySa.DayOfWeek - DayOfWeek.Monday)) % 7;
            var mondaySa  = todaySa.AddDays(-diff);
            var weekStart = new DateTimeOffset(mondaySa, saZ).UtcDateTime;

            // Weekly schedule (SA times stored as UTC, SA = UTC+2):
            //  Mon 09:00-11:00  VC300    (Karl,    online)
            //  Mon 11:00-12:00  DV300    (William, theory, online)
            //  Mon 14:00-16:00  DV100    (Talya,   practical)
            //  Tue 09:00-11:00  DV200    (Tsungai, theory)
            //  Tue 13:00-17:00  CC200    (William, practical)
            //  Wed 09:00-11:00  VC200    (Allen,   theory)
            //  Wed 14:00-18:00  DV300    (Tsungai+Simba, practical, hybrid)
            //  Thu 11:00-14:00  DV200    (Tsungai, practical)
            //  Thu 16:00-18:00  CC300    (William, CUBE)

            for (int i = -2; i < 6; i++) // 2 weeks back, 6 weeks forward
            {
                var w = weekStart.AddDays(i * 7);

                context.Events.Add(new Event { CourseId = vc300Id, Title = "VC300 - Lecture",    Description = "Visual Culture 300|Online",          EventType = "class", StartTime = w.AddDays(0).AddHours(7),  EndTime = w.AddDays(0).AddHours(9),  CreatedBy = "Karl van Heerden",  BgColor = "#6d2b91", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = dv300Id, Title = "DV300 - Theory",     Description = "Development 300 Theory|Online",      EventType = "class", StartTime = w.AddDays(0).AddHours(9),  EndTime = w.AddDays(0).AddHours(10), CreatedBy = "William Basson",    BgColor = "#1a1a8c", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = dv100Id, Title = "DV100 - Practical",  Description = "Development 100 Practical|Room 207", EventType = "class", StartTime = w.AddDays(0).AddHours(12), EndTime = w.AddDays(0).AddHours(14), CreatedBy = "Talya Bekker",      BgColor = "#e83e8c", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = dv200Id, Title = "DV200 - Theory",     Description = "Development 200 Theory|Room 101",    EventType = "class", StartTime = w.AddDays(1).AddHours(7),  EndTime = w.AddDays(1).AddHours(9),  CreatedBy = "Tsungai Katsuro",   BgColor = "#20c997", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = cc200Id, Title = "CC200 - Practical",  Description = "Creative Computing 200|Room 202",    EventType = "class", StartTime = w.AddDays(1).AddHours(11), EndTime = w.AddDays(1).AddHours(15), CreatedBy = "William Basson",    BgColor = "#fd7e14", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = vc200Id, Title = "VC200 - Theory",     Description = "Visual Communication 200|Room 106",  EventType = "class", StartTime = w.AddDays(2).AddHours(7),  EndTime = w.AddDays(2).AddHours(9),  CreatedBy = "Allen Laing",       BgColor = "#17a2b8", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = dv300Id, Title = "DV300 - Practical",  Description = "Development 300 Practical|C1 Hybrid",EventType = "class", StartTime = w.AddDays(2).AddHours(12), EndTime = w.AddDays(2).AddHours(16), CreatedBy = "Tsungai Katsuro",   BgColor = "#1a1a8c", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = dv200Id, Title = "DV200 - Practical",  Description = "Development 200 Practical|Room 101", EventType = "class", StartTime = w.AddDays(3).AddHours(9),  EndTime = w.AddDays(3).AddHours(12), CreatedBy = "Tsungai Katsuro",   BgColor = "#20c997", TextColor = "#ffffff" });
                context.Events.Add(new Event { CourseId = cc300Id, Title = "CC300 - Studio",     Description = "Creative Computing 300|CUBE",        EventType = "class", StartTime = w.AddDays(3).AddHours(14), EndTime = w.AddDays(3).AddHours(16), CreatedBy = "William Basson",    BgColor = "#7b2d8b", TextColor = "#ffffff" });
            }
        }

        // SA local time -> UTC helper (year is always 2026 in seed data)
        private static DateTime SA(int month, int day, int hour = 23, int minute = 59) =>
            new DateTimeOffset(2026, month, day, hour, minute, 0, TimeSpan.FromHours(2)).UtcDateTime;

        private static string ToSlug(string title) =>
            title.ToLower()
                 .Replace(" ", "_")
                 .Replace("-", "")
                 .Replace(":", "")
                 .Replace("/", "")
                 .Replace(",", "")
                 .Replace(".", "")
                 .Replace("&", "and");
    }
}
