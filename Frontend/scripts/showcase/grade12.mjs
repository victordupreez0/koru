// Grade 12, Information Technology (CAPS, Delphi): object-oriented programming (a user-defined
// class with constructor, accessor, mutator and auxiliary methods), two-dimensional arrays, and
// SQL with aggregate functions, grouping and two tables. Learners are 17 or 18: precise, adult.
//
// The Pascal runner ignores anything after "end.", so the Pascal labs are tested through
// stdin (what the learner types) rather than `append`.

const SCHOOL_SETUP = `CREATE TABLE tblLearners (
  LearnerID INTEGER PRIMARY KEY,
  Surname TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  Class TEXT NOT NULL,
  Town TEXT NOT NULL
);
CREATE TABLE tblResults (
  ResultID INTEGER PRIMARY KEY,
  LearnerID INTEGER NOT NULL REFERENCES tblLearners (LearnerID),
  Subject TEXT NOT NULL,
  Mark INTEGER NOT NULL
);
INSERT INTO tblLearners (LearnerID, Surname, FirstName, Class, Town) VALUES
  (1, 'Mokoena', 'Thabo', '12A', 'Soweto'),
  (2, 'Dlamini', 'Lerato', '12B', 'Durban'),
  (3, 'Patel', 'Aisha', '12A', 'Durban'),
  (4, 'Nkosi', 'Sipho', '12B', 'Pretoria'),
  (5, 'Khumalo', 'Naledi', '12A', 'Soweto'),
  (6, 'Venter', 'Pieter', '12B', 'Pretoria'),
  (7, 'Botha', 'Johan', '12A', 'Cape Town'),
  (8, 'Zulu', 'Zanele', '12B', 'Durban');
INSERT INTO tblResults (ResultID, LearnerID, Subject, Mark) VALUES
  (1, 1, 'IT', 72), (2, 2, 'IT', 85), (3, 3, 'IT', 91), (4, 5, 'IT', 88), (5, 6, 'IT', 47), (6, 8, 'IT', 93),
  (7, 1, 'Mathematics', 65), (8, 2, 'Mathematics', 78), (9, 3, 'Mathematics', 95), (10, 4, 'Mathematics', 52),
  (11, 5, 'Mathematics', 81), (12, 6, 'Mathematics', 39), (13, 7, 'Mathematics', 70), (14, 8, 'Mathematics', 88),
  (15, 1, 'English', 74), (16, 2, 'English', 80), (17, 4, 'English', 61), (18, 5, 'English', 57), (19, 7, 'English', 68);`;

// The class used on pages 1 and 2. TO_STRING is the one method body learners write on page 2.
const classCode = (toString) => `program LearnerReport;

type
  TLearner = class
  private
    fName: String;
    fTest1: Integer;
    fTest2: Integer;
  public
    constructor Create(sName: String; iTest1, iTest2: Integer);
    function GetName: String;
    procedure SetTest2(iMark: Integer);
    function CalcAverage: Real;
    function HasPassed: Boolean;
    function ToString: String; override;
  end;

constructor TLearner.Create(sName: String; iTest1, iTest2: Integer);
begin
  fName := sName;
  fTest1 := iTest1;
  fTest2 := iTest2;
end;

function TLearner.GetName: String;
begin
  Result := fName;
end;

procedure TLearner.SetTest2(iMark: Integer);
begin
  fTest2 := iMark;
end;

function TLearner.CalcAverage: Real;
begin
  Result := (fTest1 + fTest2) / 2;
end;

function TLearner.HasPassed: Boolean;
begin
  Result := CalcAverage >= 50;
end;

function TLearner.ToString: String;
${toString}

var
  objLearner: TLearner;
  sName: String;
  iTest1, iTest2, iNewMark: Integer;
begin
  Write('Name: ');
  ReadLn(sName);
  Write('Test 1: ');
  ReadLn(iTest1);
  Write('Test 2: ');
  ReadLn(iTest2);
  objLearner := TLearner.Create(sName, iTest1, iTest2);
  WriteLn(objLearner.ToString);

  Write('Rewrite mark for test 2: ');
  ReadLn(iNewMark);
  objLearner.SetTest2(iNewMark);
  WriteLn(objLearner.ToString);
  objLearner.Free;
end.`;

const SALES = `  arrItems: array[1..3] of String = ('Pies', 'Vetkoek', 'Juice');
  arrDays: array[1..4] of String = ('Mon', 'Tue', 'Wed', 'Thu');
  arrSales: array[1..3, 1..4] of Integer = (
    (24, 31, 18, 27),
    (15, 22, 19, 30),
    (40, 35, 28, 33));`;

export default {
    code: "IT-G12",
    name: "Information Technology: Grade 12",
    description: "Object-oriented Delphi, two-dimensional arrays and SQL across two tables, following the CAPS Grade 12 programme.",
    module: "Objects, 2-D arrays and SQL",

    home: [
        { t: "h1", text: "Information Technology: Grade 12" },
        "This module covers the Grade 12 programming and database content that the final practical examination tests: **classes and objects**, **two-dimensional arrays**, and **SQL** with aggregate functions, grouping and queries over two tables.",
        { t: "callout", variant: "info", text: "Programs here are console Delphi: `WriteLn` replaces `redOutput.Lines.Add`. In your PAT and in the examination, a class lives in its own unit (for example `uLearner.pas`); here it sits above the main program so that everything runs in one window." },
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "Programming" }, { t: "bullets", items: ["Define a class with private fields", "Write constructor, accessor, mutator and auxiliary methods", "Process a 2-D array by rows and by columns"] }],
                [{ t: "h3", text: "Databases" }, { t: "bullets", items: ["`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`", "`GROUP BY` and `HAVING`", "Join two tables with `WHERE`, subqueries, `UPDATE`", "Keys, relationships and normalisation"] }],
            ],
        },
    ],

    pages: [
        {
            title: "Classes and objects",
            blocks: [
                { t: "hero", title: "Classes and objects", subtitle: "A class is the design. An object is one thing built from it.", emoji: "🧩", theme: "night" },
                "A **class** defines the data an object stores (its **fields**) and what it can do (its **methods**). The fields are **private**, so code outside the class can only reach them through the public methods. This is **encapsulation**: the object protects its own data.",
                {
                    t: "diagram",
                    code: "classDiagram\n  class TLearner {\n    -fName : String\n    -fTest1 : Integer\n    -fTest2 : Integer\n    +Create(sName, iTest1, iTest2)\n    +GetName() String\n    +SetTest2(iMark)\n    +CalcAverage() Real\n    +HasPassed() Boolean\n    +ToString() String\n  }",
                    caption: "The TLearner class. A minus sign means private, a plus sign means public.",
                },
                {
                    t: "code",
                    lang: "delphi",
                    code: "type\n  TLearner = class\n  private\n    fName: String;\n    fTest1: Integer;\n    fTest2: Integer;\n  public\n    constructor Create(sName: String; iTest1, iTest2: Integer);\n    function GetName: String;\n    procedure SetTest2(iMark: Integer);\n    function CalcAverage: Real;\n    function HasPassed: Boolean;\n    function ToString: String; override;\n  end;\n\nconstructor TLearner.Create(sName: String; iTest1, iTest2: Integer);\nbegin\n  fName := sName;\n  fTest1 := iTest1;\n  fTest2 := iTest2;\nend;\n\nfunction TLearner.CalcAverage: Real;\nbegin\n  Result := (fTest1 + fTest2) / 2;\nend;\n\n// In the main program: instantiate an object, use it, free it\nobjLearner := TLearner.Create('Naledi', 78, 85);\nWriteLn(objLearner.GetName);\nobjLearner.Free;",
                },
                {
                    t: "sort",
                    prompt: "Sort these method headers by the kind of method each one is.",
                    groups: {
                        Constructor: ["constructor Create(sName: String; iTest1, iTest2: Integer);"],
                        Accessor: ["function GetName: String;", "function GetTest1: Integer;"],
                        Mutator: ["procedure SetTest2(iMark: Integer);", "procedure SetName(sName: String);"],
                        Auxiliary: ["function CalcAverage: Real;", "function HasPassed: Boolean;", "function ToString: String;"],
                    },
                },
                {
                    t: "blanks",
                    prompt: "Complete the class declaration and the start of the constructor.",
                    code: true,
                    bank: true,
                    text: "type\n  TLearner = {{class}}\n  {{private}}\n    fName: String;\n    fTest1, fTest2: Integer;\n  {{public}}\n    {{constructor}} Create(sName: String; iTest1, iTest2: Integer);\n    function GetName: {{String}};\n    function ToString: String; {{override}};\n  end;\n\nconstructor {{TLearner}}.Create(sName: String; iTest1, iTest2: Integer);\nbegin\n  fName := sName;",
                    distractors: ["record", "procedure", "Integer", "TObject"],
                },
                { t: "reveal", title: "Why ToString says override", text: "Every Delphi class inherits from `TObject`, which already has a `ToString` method. `override` replaces that inherited version with yours. Without it, the compiler warns that your method hides the inherited one." },
            ],
        },
        {
            title: "Write a class",
            blocks: [
                "An **auxiliary method** does useful work with the object's own data. `ToString` is the classic example: it builds one line of text that describes the object, so the main program never has to reach into the private fields.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Useful here" }, { t: "bullets", items: ["`FloatToStrF(rValue, ffFixed, 6, 1)` turns a real into text with one decimal", "`IntToStr(iValue)` turns an integer into text", "`+` joins strings"] }],
                        [{ t: "h3", text: "Expected format" }, { t: "code", lang: "delphi", code: "Lerato: average 77.5, passed\nSipho: average 35.5, failed" }],
                    ],
                },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "Write the body of `TLearner.ToString`. It must return the name, `: average `, the average with **one decimal**, then `, passed` or `, failed`, exactly as in the examples. Use `CalcAverage` and `HasPassed`: do not repeat their calculations. The main program creates an object, prints it, changes test 2 with the mutator and prints it again.",
                    starter: classCode("begin\n  // Build the text with fName, CalcAverage and HasPassed.\n  Result := fName;\nend;"),
                    solution: classCode("var\n  sResult: String;\nbegin\n  if HasPassed then\n    sResult := 'passed'\n  else\n    sResult := 'failed';\n  Result := fName + ': average ' + FloatToStrF(CalcAverage, ffFixed, 6, 1) + ', ' + sResult;\nend;"),
                    tests: [
                        { name: "Lerato passes, then improves", stdin: "Lerato\n71\n84\n90" },
                        { name: "A learner who fails, then passes after the rewrite", stdin: "Sipho\n30\n41\n76", hidden: true },
                        { name: "An average of exactly 50 is a pass", stdin: "Pieter\n48\n52\n40", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint", text: "Decide on `'passed'` or `'failed'` first with `if HasPassed then …`, and store it in a local variable. Then build `Result` in one statement with `+`." },
                {
                    t: "quiz",
                    pass: 67,
                    questions: [
                        { q: "What does `objLearner := TLearner.Create('Naledi', 78, 85);` do?", options: ["Declares the class TLearner", "Instantiates a new TLearner object and stores a reference to it in objLearner", "Copies an existing object", "Calls ToString"], answer: 1 },
                        { q: "The main form's unit (a different unit from the class) contains `WriteLn(objLearner.fName);`. What happens?", options: ["It prints the name", "It does not compile, because fName is private", "It prints an empty string", "It runs, but only after Create"], answer: 1 },
                        { q: "Which method is a mutator?", options: ["GetName", "CalcAverage", "SetTest2", "ToString"], answer: 2 },
                    ],
                },
            ],
        },
        {
            title: "Two-dimensional arrays",
            blocks: [
                "A **two-dimensional array** stores a grid. `arrSales[iRow, iCol]` is the value in row `iRow`, column `iCol`. The tuck shop records how many of each item it sold on each day: rows are items, columns are days.",
                { t: "table", header: ["arrSales", "Mon (1)", "Tue (2)", "Wed (3)", "Thu (4)"], rows: [["Pies (1)", "24", "31", "18", "27"], ["Vetkoek (2)", "15", "22", "19", "30"], ["Juice (3)", "40", "35", "28", "33"]] },
                {
                    t: "fillTable",
                    prompt: "Use the grid above.",
                    headers: ["Expression", "Value"],
                    rows: [
                        ["arrSales[2, 3]", "?19"],
                        ["arrSales[3, 1]", "?40"],
                        ["arrSales[1, 4]", "?27"],
                        ["arrSales[r, c] when r = 2 and c = r + 2", "?30"],
                        ["Total of column 2 (Tue)", "?88"],
                    ],
                },
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Row totals" }, { t: "code", lang: "delphi", code: "for r := 1 to 3 do\nbegin\n  iTotal := 0;\n  for c := 1 to 4 do\n    iTotal := iTotal + arrSales[r, c];\n  // iTotal is row r's total\nend;" }],
                        [{ t: "h3", text: "Column totals" }, "Swap the loops: the **outer** loop runs over the columns, the inner loop over the rows. Reset the total at the start of each outer pass."],
                    ],
                },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "Print the total sold of each item, one line each (`Pies: 100`), and then the total sold on each day, one line each (`Mon: 79`). Seven lines in all, in the order of the arrays.",
                    starter: `program TuckShop;
var
${SALES}
  r, c, iTotal: Integer;
begin
  // Row totals: one line per item
  for r := 1 to 3 do
  begin
    iTotal := 0;
    // Add up row r here.
    WriteLn(arrItems[r], ': ', iTotal);
  end;

  // Column totals: one line per day
end.`,
                    solution: `program TuckShop;
var
${SALES}
  r, c, iTotal: Integer;
begin
  for r := 1 to 3 do
  begin
    iTotal := 0;
    for c := 1 to 4 do
      iTotal := iTotal + arrSales[r, c];
    WriteLn(arrItems[r], ': ', iTotal);
  end;

  for c := 1 to 4 do
  begin
    iTotal := 0;
    for r := 1 to 3 do
      iTotal := iTotal + arrSales[r, c];
    WriteLn(arrDays[c], ': ', iTotal);
  end;
end.`,
                    tests: [{ name: "Item totals, then day totals" }],
                },
                { t: "callout", variant: "success", text: "Check: the item totals and the day totals must add up to the same grand total, because both count every cell once. Here that is 322." },
            ],
        },
        {
            title: "SQL: grouping and aggregate functions",
            blocks: [
                "An **aggregate function** turns many records into one value. With **GROUP BY**, it gives one value per group instead. The queries on this page use `tblResults`: one record per learner per subject (`ResultID`, `LearnerID`, `Subject`, `Mark`).",
                {
                    t: "flashcards",
                    title: "SQL you should recognise",
                    cards: [
                        ["DISTINCT", "`SELECT DISTINCT Subject FROM tblResults` lists each subject once."],
                        ["BETWEEN", "`WHERE Mark BETWEEN 50 AND 59` includes both 50 and 59."],
                        ["IN", "`WHERE Town IN ('Durban', 'Soweto')` matches any value in the list."],
                        ["LIKE", "`WHERE Surname LIKE 'K%'` matches surnames that start with K. `_` matches one character."],
                        ["IS NULL", "`WHERE Town IS NULL` finds empty fields. `= NULL` never matches."],
                        ["Calculated field", "`SELECT Mark * 0.25 AS Weighted FROM tblResults` creates a new column with its own name."],
                    ],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "Find the highest and the lowest **Mathematics** mark. Return one row with two columns named `Highest` and `Lowest`.",
                    setup: SCHOOL_SETUP,
                    starter: "SELECT Mark\nFROM tblResults\nWHERE Subject = 'Mathematics'",
                    solution: "SELECT MAX(Mark) AS Highest, MIN(Mark) AS Lowest\nFROM tblResults\nWHERE Subject = 'Mathematics'",
                    tests: [{ name: "Highest and lowest Mathematics mark" }],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "For each subject, show the subject, how many results it has and the average mark rounded to one decimal. Name the columns `Subject`, `NumResults`, `AvgMark`. Use `ROUND(AVG(Mark), 1)`.",
                    setup: SCHOOL_SETUP,
                    starter: "SELECT Subject, Mark\nFROM tblResults",
                    solution: "SELECT Subject, COUNT(*) AS NumResults, ROUND(AVG(Mark), 1) AS AvgMark\nFROM tblResults\nGROUP BY Subject",
                    tests: [{ name: "Count and average per subject" }],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "Which learners average **80 or more** over all their subjects? Show `LearnerID` and `AvgMark` (rounded to one decimal) for those learners only.",
                    setup: SCHOOL_SETUP,
                    starter: "SELECT LearnerID, Mark\nFROM tblResults",
                    solution: "SELECT LearnerID, ROUND(AVG(Mark), 1) AS AvgMark\nFROM tblResults\nGROUP BY LearnerID\nHAVING AVG(Mark) >= 80",
                    tests: [{ name: "Learners averaging 80 or more" }],
                },
                { t: "callout", variant: "warning", text: "**WHERE** filters records *before* they are grouped. **HAVING** filters the groups *after* the aggregate is calculated. A condition on `AVG(Mark)` or `COUNT(*)` belongs in HAVING." },
                {
                    t: "blanks",
                    prompt: "This query lists, for each learner, how many subjects they passed, but only learners who passed at least two. Complete it.",
                    code: true,
                    bank: true,
                    text: "SELECT LearnerID, {{COUNT}}(*) AS NumPassed\nFROM tblResults\n{{WHERE}} Mark >= 50\n{{GROUP BY}} LearnerID\n{{HAVING}} COUNT(*) >= 2\n{{ORDER BY}} NumPassed DESC",
                    distractors: ["SUM", "SORT BY", "DISTINCT"],
                },
            ],
        },
        {
            title: "SQL: two tables",
            blocks: [
                "The learners' details and their results are stored in **two tables** linked by `LearnerID`. It is the **primary key** of `tblLearners` and a **foreign key** in `tblResults`. One learner has many results: a **one-to-many** relationship.",
                {
                    t: "diagram",
                    code: "erDiagram\n  tblLearners ||--o{ tblResults : \"writes\"\n  tblLearners {\n    int LearnerID PK\n    string Surname\n    string FirstName\n    string Class\n    string Town\n  }\n  tblResults {\n    int ResultID PK\n    int LearnerID FK\n    string Subject\n    int Mark\n  }",
                    caption: "One learner writes zero or more results. Each result belongs to exactly one learner.",
                },
                { t: "code", lang: "sql", code: "SELECT FirstName, Subject, Mark\nFROM tblLearners, tblResults\nWHERE tblLearners.LearnerID = tblResults.LearnerID   -- the join condition\n  AND Class = '12A'" },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "List every **IT** result with the learner's name, highest mark first. Show `FirstName`, `Surname`, `Mark` in that order. Join the tables with `WHERE`.",
                    setup: SCHOOL_SETUP,
                    ordered: true,
                    starter: "SELECT FirstName, Surname, Mark\nFROM tblLearners, tblResults\nWHERE Subject = 'IT'",
                    solution: "SELECT FirstName, Surname, Mark\nFROM tblLearners, tblResults\nWHERE tblLearners.LearnerID = tblResults.LearnerID\n  AND Subject = 'IT'\nORDER BY Mark DESC",
                    tests: [{ name: "IT results with names, highest first" }],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "Which learners scored **above the average IT mark**? Show `FirstName`, `Surname`, `Mark`. Use a subquery to calculate the average: do not type the number in.",
                    setup: SCHOOL_SETUP,
                    starter: "SELECT AVG(Mark)\nFROM tblResults\nWHERE Subject = 'IT'",
                    solution: "SELECT FirstName, Surname, Mark\nFROM tblLearners, tblResults\nWHERE tblLearners.LearnerID = tblResults.LearnerID\n  AND Subject = 'IT'\n  AND Mark > (SELECT AVG(Mark) FROM tblResults WHERE Subject = 'IT')",
                    tests: [{ name: "Above the IT average" }],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "Pieter Venter (LearnerID 6) rewrote IT and scored **58**. Write an `UPDATE` that changes only that one mark. End it with a semicolon. The check then lists every IT result.",
                    setup: SCHOOL_SETUP,
                    starter: "-- Check this as it is first: see what happens without a WHERE clause.\nUPDATE tblResults\nSET Mark = 58;",
                    solution: "UPDATE tblResults\nSET Mark = 58\nWHERE LearnerID = 6 AND Subject = 'IT';",
                    tests: [{ name: "Only Pieter's IT mark changed", append: "SELECT LearnerID, Subject, Mark FROM tblResults WHERE Subject = 'IT'" }],
                },
                {
                    t: "quiz",
                    pass: 60,
                    questions: [
                        { q: "Why is the learner's surname stored in tblLearners and not in every record of tblResults?", options: ["SQL cannot store text in tblResults", "To avoid redundant data: a surname change would otherwise have to be made in many records", "Because Surname is a foreign key", "So that the tables have the same number of fields"], answer: 1 },
                        { q: "Which field is the foreign key?", options: ["tblLearners.LearnerID", "tblResults.ResultID", "tblResults.LearnerID", "tblResults.Subject"], answer: 2 },
                        { q: "A field `Subjects` holds 'IT, Mathematics, English' for each learner. Which rule of normalisation does this break?", options: ["First normal form: every field must hold a single (atomic) value", "Every table needs at least five fields", "Primary keys must be numbers", "None: lists in a field are good design"], answer: 0 },
                        { q: "You leave out `tblLearners.LearnerID = tblResults.LearnerID` in a two-table query. What do you get?", options: ["An error", "Only the learners with results", "Every learner paired with every result (8 × 19 = 152 rows here)", "The same rows in a different order"], answer: 2 },
                        { q: "Which statement adds a new result?", options: ["UPDATE tblResults SET Mark = 76", "INSERT INTO tblResults (LearnerID, Subject, Mark) VALUES (7, 'IT', 76)", "SELECT 76 INTO tblResults", "ADD tblResults (7, 'IT', 76)"], answer: 1 },
                    ],
                },
            ],
        },
    ],
};
