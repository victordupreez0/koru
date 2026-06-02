# LearnOnline - Quick Start

## Backend (ASP.NET Core)
1. Open a terminal in the `Backend` folder.

2. Run:
  
  cd LearnOnline
  dotnet watch run
   dotnet run
3. The API will be available at the URL shown in the terminal.


## Frontend (React + Vite)
1. Open a terminal in the `Frontend` folder.
2. Install dependencies:
   npm install
3. Start the dev server:
   npm run dev
4. Open the local URL (shown in the terminal) in your browser.

### Folder Structure

```
src/
  components/
    UI/                # Reusable UI elements (buttons, cards, nav items, etc.)
    menu.jsx           # The top navigation bar
    sideMenu.jsx       # The vertical side navigation
    courseGlance.jsx   # Course overview logic
    courseGlanceDisplay.jsx # Course display logic
  App.jsx, main.jsx, etc.
```

- **UI/**: Contains all small, reusable UI components (e.g., navItem, toDoItem, nextClassItem, announcementsItem, etc.).
- **menu.jsx**: The main top navigation bar for the app.
- **sideMenu.jsx**: The floating vertical menu (usually bottom left).
- **courseGlance.jsx**: Handles course overview logic and display.
- **courseGlanceDisplay.jsx**: Handles the display of course details.

### Using Tailwind CSS

- Tailwind is already set up in this project.
- You can use Tailwind utility classes directly in your JSX, e.g.:
  `<div className="bg-white p-4 rounded-lg shadow-md">Hello</div>`
- Custom styles and plugins (like DaisyUI) are included in `src/index.css`.
- For custom scrollbars, see the `.scrollbar-black` class in `src/index.css`.
- If you want to add new Tailwind classes, just use them in your components—no extra setup needed.

For Tailwind https://tailwindcss.com/docs

For Solar icons check here: https://solar-icons.vercel.app/icons (Use these icons, NOT REACT ICONS)

For DaisyUI elements check here: https://daisyui.com/components/ (simply copy jsx code and paste inside your component)

---

## Testing

### Backend (xUnit + Coverlet)

- **Location**: `Backend/LearnOnline.Tests`
- **Framework**: xUnit with EF Core InMemory provider, Moq, FluentAssertions
- **Tests**: 134 (covers every controller's CRUD paths plus auth/Google flows)

Run from the repo root:

```
dotnet test Backend/LearnOnline.Tests/LearnOnline.Tests.csproj
```

Generate the HTML coverage report (the colourful per-file web view):

```
dotnet test Backend/LearnOnline.Tests/LearnOnline.Tests.csproj --collect:"XPlat Code Coverage" --results-directory reports/backend/raw
reportgenerator -reports:"reports/backend/raw/**/coverage.cobertura.xml" -targetdir:"reports/backend/html" -reporttypes:"Html;TextSummary" -title:"LearnOnline Backend Coverage" -classfilters:"-TodoApi.Migrations.*;-LearnOnline.Data.DbSeeder;-LearnOnline.Data.RealDataSeeder;-Program;-Microsoft.AspNetCore.OpenApi.Generated;-System.Runtime.CompilerServices.*"
```

Open `reports/backend/html/index.html` in a browser for the coverage dashboard. Summary text lives at `reports/backend/html/Summary.txt`.

One-time setup (already done locally):

```
dotnet tool install -g dotnet-reportgenerator-globaltool
```

### Frontend (Jest + React Testing Library)

- **Location**: `Frontend/tests`
- **Framework**: Jest 30, jsdom, React Testing Library, Babel transform
- **Tests**: 82 (API services, AuthContext, ProtectedRoute, ChipListEditor, profile utils)

Run from `Frontend/`:

```
npm test
npm run test:coverage
```

Open `reports/frontend/index.html` for the coverage dashboard.

### Quick reference — what to screenshot for the brief

| Brief item | Source |
| --- | --- |
| Terminal: backend test run (134 passed) | output of `dotnet test ...` |
| Terminal: frontend test run (82 passed) | output of `npm test` |
| Backend coverage web view | `reports/backend/html/index.html` |
| Frontend coverage web view | `reports/frontend/index.html` |
| Coverage summary numbers | `reports/backend/html/Summary.txt` and the Jest terminal summary |

