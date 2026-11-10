// Grade 11, Information Technology (CAPS, Delphi): one-dimensional and parallel arrays, linear
// search, bubble sort, linear against binary search, and single-table SQL. Learners are 16 or 17:
// precise wording, Delphi naming conventions (iCount, sName, arrMarks, tblLearners).
//
// The Pascal runner ignores anything after "end.", so the Pascal labs are tested through
// stdin (what the learner types) rather than `append`.

const NAMES = "('Thabo', 'Lerato', 'Aisha', 'Sipho', 'Naledi', 'Pieter', 'Zanele', 'Johan')";

const LEARNERS_SETUP = `CREATE TABLE tblLearners (
  LearnerID INTEGER PRIMARY KEY,
  Surname TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  Grade INTEGER NOT NULL,
  Mark INTEGER NOT NULL,
  Town TEXT NOT NULL
);
INSERT INTO tblLearners (LearnerID, Surname, FirstName, Grade, Mark, Town) VALUES
  (1, 'Mokoena', 'Thabo', 11, 72, 'Soweto'),
  (2, 'Dlamini', 'Lerato', 10, 85, 'Durban'),
  (3, 'Patel', 'Aisha', 11, 91, 'Durban'),
  (4, 'Nkosi', 'Sipho', 12, 64, 'Pretoria'),
  (5, 'Khumalo', 'Naledi', 11, 88, 'Soweto'),
  (6, 'Venter', 'Pieter', 11, 47, 'Pretoria'),
  (7, 'Botha', 'Johan', 10, 80, 'Cape Town'),
  (8, 'Zulu', 'Zanele', 12, 93, 'Durban');`;

export default {
    code: "IT-G11",
    name: "Information Technology: Grade 11",
    description: "Arrays, searching, sorting and SQL queries in Delphi, following the CAPS Grade 11 programme.",
    module: "Arrays, searching and sorting",

    home: [
        { t: "h1", text: "Information Technology: Grade 11" },
        "This module covers the data structures and algorithms in the Grade 11 programme: **arrays** and **parallel arrays**, **linear search**, **bubble sort**, how **binary search** compares with linear search, and querying a database with **SELECT … WHERE**.",
        { t: "callout", variant: "info", text: "Every program here is console Delphi. Where your school projects use `redOutput.Lines.Add(…)`, these pages use `WriteLn(…)`. The logic is identical." },
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "How the pages work" }, { t: "bullets", items: ["Read the short explanation", "Step through the algorithm animations", "Write code in the labs and press **Run**", "Press **Check** to have your work marked"] }],
                [{ t: "h3", text: "What you should know already" }, { t: "bullets", items: ["Variables and data types", "`if`, `for`, `while` and `repeat` loops", "Writing a procedure and a function"] }],
            ],
        },
        {
            t: "flashcards",
            title: "Terms in this module",
            cards: [
                ["Array", "A data structure that stores a fixed number of values of the same type under one name."],
                ["Index", "The position of an element in an array. Delphi arrays are usually declared from 1, as in `array[1..8]`."],
                ["Parallel arrays", "Two or more arrays where the same index refers to the same thing: `arrNames[3]` and `arrMarks[3]` belong to the same learner."],
                ["Linear search", "Checks the elements one by one from the start until the value is found or the array ends."],
                ["Binary search", "Repeatedly checks the middle of a sorted array and discards the half that cannot contain the value."],
                ["Primary key", "A field whose value is unique for every record in a table, such as `LearnerID`."],
            ],
        },
    ],

    pages: [
        {
            title: "Arrays",
            blocks: [
                { t: "hero", title: "Arrays", subtitle: "Many values, one name, an index for each.", emoji: "📊", theme: "ocean" },
                "Eight learners wrote an IT test. Instead of eight variables (`iMark1`, `iMark2`, …) you declare one **array** of eight integers and use a loop to process every element.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "code", lang: "delphi", code: "var\n  arrMarks: array[1..8] of Integer;\n  i, iTotal: Integer;\n\n// one element\narrMarks[3] := 91;\n\n// every element\niTotal := 0;\nfor i := 1 to 8 do\n  iTotal := iTotal + arrMarks[i];" }],
                        [{ t: "bullets", items: ["`1..8` is the **index range**: the array has exactly 8 elements.", "`arrMarks[i]` is the element at index `i`. The index can be any integer expression, such as `arrMarks[i + 1]`.", "Every element has the same type, here `Integer`."] }],
                    ],
                },
                { t: "h2", text: "The class marks" },
                { t: "table", header: ["Index", "1", "2", "3", "4", "5", "6", "7", "8"], rows: [["arrMarks", "72", "58", "91", "64", "85", "47", "77", "70"]] },
                {
                    t: "fillTable",
                    prompt: "Use the array above. Write the value of each expression.",
                    headers: ["Expression", "Value"],
                    rows: [
                        ["arrMarks[1]", "?72"],
                        ["arrMarks[8]", "?70"],
                        ["arrMarks[2] + arrMarks[4]", "?122"],
                        ["arrMarks[i + 1] when i = 4", "?85"],
                        ["The index of the lowest mark", "?6"],
                    ],
                },
                { t: "callout", variant: "warning", text: "`arrMarks[9]` does not exist. Reading or writing outside the index range is a **range error**, one of the most common array bugs. Check the first and last values of your loop counter." },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "The program reads eight marks into `arrMarks`. Complete it so it prints exactly three lines: `Total: …`, then `Average: …` with **one decimal place** (use `rAverage:0:1`), then `Highest: …`.",
                    starter: `program ClassMarks;
var
  arrMarks: array[1..8] of Integer;
  i, iTotal, iHighest: Integer;
  rAverage: Real;
begin
  for i := 1 to 8 do
  begin
    Write('Mark ', i, ': ');
    ReadLn(arrMarks[i]);
  end;

  iTotal := 0;
  // Add every mark to iTotal, then work out rAverage and iHighest.

  WriteLn('Total: ', iTotal);
end.`,
                    solution: `program ClassMarks;
var
  arrMarks: array[1..8] of Integer;
  i, iTotal, iHighest: Integer;
  rAverage: Real;
begin
  for i := 1 to 8 do
  begin
    Write('Mark ', i, ': ');
    ReadLn(arrMarks[i]);
  end;

  iTotal := 0;
  iHighest := arrMarks[1];
  for i := 1 to 8 do
  begin
    iTotal := iTotal + arrMarks[i];
    if arrMarks[i] > iHighest then
      iHighest := arrMarks[i];
  end;
  rAverage := iTotal / 8;

  WriteLn('Total: ', iTotal);
  WriteLn('Average: ', rAverage:0:1);
  WriteLn('Highest: ', iHighest);
end.`,
                    tests: [
                        { name: "The class marks from the table", stdin: "72\n58\n91\n64\n85\n47\n77\n70" },
                        { name: "The highest mark is the first one", stdin: "98\n55\n63\n38\n90\n71\n82\n40", hidden: true },
                        { name: "The highest mark is the last one", stdin: "61\n45\n72\n38\n66\n59\n80\n94", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint: where should iHighest start?", text: "Start `iHighest` at `arrMarks[1]`, not at an arbitrary number. Then compare every element with it and replace it whenever you find a bigger one." },
            ],
        },
        {
            title: "Linear search",
            blocks: [
                "A **linear search** looks for a value by checking the elements one at a time, from index 1 onwards. It stops as soon as it finds the value, or when there are no elements left. The array does **not** have to be sorted.",
                { t: "algo", prompt: "Step through a linear search for 47 in the class marks. Count the checks.", algorithm: "linear", data: [72, 58, 91, 64, 85, 47, 77, 70], target: 47 },
                { t: "h2", text: "Parallel arrays" },
                "The class list is stored in two **parallel arrays**: `arrNames[i]` and `arrMarks[i]` describe the same learner. Find a name in `arrNames` and the same index gives you the mark.",
                { t: "table", header: ["Index", "1", "2", "3", "4", "5", "6", "7", "8"], rows: [["arrNames", "Thabo", "Lerato", "Aisha", "Sipho", "Naledi", "Pieter", "Zanele", "Johan"], ["arrMarks", "72", "58", "91", "64", "85", "47", "77", "70"]] },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "Complete the function `FindLearner`. It must return the **index** of `sName` in `arrNames`, or **0** if the name is not there. Compare with `UpperCase` on both sides so that `naledi` also finds `Naledi`. The main program is done: do not change it.",
                    starter: `program FindALearner;
var
  arrNames: array[1..8] of String = ${NAMES};
  arrMarks: array[1..8] of Integer = (72, 58, 91, 64, 85, 47, 77, 70);
  sName: String;
  iPos: Integer;

function FindLearner(sName: String): Integer;
var
  i: Integer;
begin
  Result := 0;
  // Check arrNames[1] to arrNames[8] and set Result to the index of sName.
end;

begin
  Write('Name to find: ');
  ReadLn(sName);
  iPos := FindLearner(sName);
  if iPos = 0 then
    WriteLn(sName, ' is not in the class.')
  else
    WriteLn(arrNames[iPos], ' is at position ', iPos, ' and scored ', arrMarks[iPos], '.');
end.`,
                    solution: `program FindALearner;
var
  arrNames: array[1..8] of String = ${NAMES};
  arrMarks: array[1..8] of Integer = (72, 58, 91, 64, 85, 47, 77, 70);
  sName: String;
  iPos: Integer;

function FindLearner(sName: String): Integer;
var
  i: Integer;
  bFound: Boolean;
begin
  Result := 0;
  bFound := False;
  i := 1;
  while (i <= 8) and not bFound do
  begin
    if UpperCase(arrNames[i]) = UpperCase(sName) then
    begin
      bFound := True;
      Result := i;
    end;
    i := i + 1;
  end;
end;

begin
  Write('Name to find: ');
  ReadLn(sName);
  iPos := FindLearner(sName);
  if iPos = 0 then
    WriteLn(sName, ' is not in the class.')
  else
    WriteLn(arrNames[iPos], ' is at position ', iPos, ' and scored ', arrMarks[iPos], '.');
end.`,
                    tests: [
                        { name: "Finds Naledi", stdin: "Naledi" },
                        { name: "Finds the first name in the list", stdin: "Thabo", hidden: true },
                        { name: "Finds the last name in the list", stdin: "Johan", hidden: true },
                        { name: "Ignores upper and lower case", stdin: "sipho", hidden: true },
                        { name: "A name that is not in the class", stdin: "Bongani", hidden: true },
                    ],
                },
                {
                    t: "reveal",
                    title: "Two ways to stop early",
                    blocks: [
                        "The model answer uses a `while` loop with a Boolean flag `bFound`, the pattern most Delphi textbooks use. A `for` loop with `Exit` also stops as soon as the name is found:",
                        { t: "code", lang: "delphi", code: "for i := 1 to 8 do\n  if UpperCase(arrNames[i]) = UpperCase(sName) then\n  begin\n    Result := i;\n    Exit;\n  end;" },
                        "A `for` loop without `Exit` also gives the right answer when the names are unique, but it always checks all 8 elements.",
                    ],
                },
            ],
        },
        {
            title: "Sorting an array",
            blocks: [
                "**Bubble sort** compares each pair of neighbouring elements and swaps them if they are in the wrong order. After the first pass the largest value has \"bubbled\" to the last position; each further pass puts one more value in place. An array of 8 elements needs at most 7 passes.",
                { t: "algo", prompt: "Watch the largest value move to the end on the first pass.", algorithm: "bubble", data: [72, 58, 91, 64, 85, 47], target: 72 },
                {
                    t: "columns",
                    layout: "wide-right",
                    cols: [
                        [{ t: "code", lang: "delphi", code: "iTemp := arrMarks[j];\narrMarks[j] := arrMarks[j + 1];\narrMarks[j + 1] := iTemp;" }],
                        ["A **swap** needs a temporary variable. Write `arrMarks[j] := arrMarks[j + 1]` first without `iTemp` and the old value of `arrMarks[j]` is lost: both elements end up the same."],
                    ],
                },
                {
                    t: "order",
                    prompt: "Put the lines of an ascending bubble sort of `arrMarks[1..8]` in the right order.",
                    code: true,
                    items: [
                        "for i := 1 to 7 do",
                        "  for j := 1 to 8 - i do",
                        "    if arrMarks[j] > arrMarks[j + 1] then",
                        "    begin",
                        "      iTemp := arrMarks[j];",
                        "      arrMarks[j] := arrMarks[j + 1];",
                        "      arrMarks[j + 1] := iTemp;",
                        "    end;",
                    ],
                },
                { t: "h2", text: "Rank the class" },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "This bubble sort puts the class in order from the **highest** mark to the lowest, but the swap is missing. Write it. Because the arrays are parallel, swap the **names** as well as the marks, or the names end up next to the wrong marks. Use `iTemp` and `sTemp`.",
                    starter: `program RankTheClass;
var
  arrNames: array[1..8] of String = ${NAMES};
  arrMarks: array[1..8] of Integer;
  i, j, iTemp: Integer;
  sTemp: String;
begin
  for i := 1 to 8 do
  begin
    Write('Mark for ', arrNames[i], ': ');
    ReadLn(arrMarks[i]);
  end;

  for i := 1 to 7 do
    for j := 1 to 8 - i do
      if arrMarks[j] < arrMarks[j + 1] then
      begin
        // Swap arrMarks[j] and arrMarks[j + 1], and arrNames[j] and arrNames[j + 1].
      end;

  for i := 1 to 8 do
    WriteLn(i, '. ', arrNames[i], ' ', arrMarks[i]);
end.`,
                    solution: `program RankTheClass;
var
  arrNames: array[1..8] of String = ${NAMES};
  arrMarks: array[1..8] of Integer;
  i, j, iTemp: Integer;
  sTemp: String;
begin
  for i := 1 to 8 do
  begin
    Write('Mark for ', arrNames[i], ': ');
    ReadLn(arrMarks[i]);
  end;

  for i := 1 to 7 do
    for j := 1 to 8 - i do
      if arrMarks[j] < arrMarks[j + 1] then
      begin
        iTemp := arrMarks[j];
        arrMarks[j] := arrMarks[j + 1];
        arrMarks[j + 1] := iTemp;
        sTemp := arrNames[j];
        arrNames[j] := arrNames[j + 1];
        arrNames[j + 1] := sTemp;
      end;

  for i := 1 to 8 do
    WriteLn(i, '. ', arrNames[i], ' ', arrMarks[i]);
end.`,
                    tests: [
                        { name: "The class marks", stdin: "72\n58\n91\n64\n85\n47\n77\n70" },
                        { name: "Marks that are in reverse order", stdin: "20\n30\n40\n50\n60\n70\n80\n90", hidden: true },
                        { name: "Marks that are already in order", stdin: "90\n80\n70\n60\n50\n40\n30\n20", hidden: true },
                    ],
                },
                {
                    t: "reveal",
                    title: "Selection sort, the other sort in the syllabus",
                    blocks: [
                        "Selection sort finds the smallest remaining element and swaps it into position `i`. It makes at most one swap per pass.",
                        { t: "code", lang: "delphi", code: "for i := 1 to 7 do\nbegin\n  iMin := i;\n  for j := i + 1 to 8 do\n    if arrMarks[j] < arrMarks[iMin] then\n      iMin := j;\n  iTemp := arrMarks[i];\n  arrMarks[i] := arrMarks[iMin];\n  arrMarks[iMin] := iTemp;\nend;" },
                    ],
                },
            ],
        },
        {
            title: "Linear search versus binary search",
            blocks: [
                "**Binary search** only works on a **sorted** array. It checks the middle element. If that is the value, it stops. If the value is bigger, the left half is discarded; if smaller, the right half. Every check halves the part that is still searched.",
                { t: "algo", prompt: "Search for 71 in 15 sorted numbers. How many checks does it take?", algorithm: "binary", data: [3, 8, 12, 19, 25, 31, 40, 47, 52, 58, 64, 71, 77, 85, 93], target: 71 },
                { t: "code", lang: "delphi", code: "iLow := 1;\niHigh := 15;\nbFound := False;\nwhile (iLow <= iHigh) and not bFound do\nbegin\n  iMid := (iLow + iHigh) div 2;\n  if arrNumbers[iMid] = iTarget then\n    bFound := True\n  else if arrNumbers[iMid] < iTarget then\n    iLow := iMid + 1\n  else\n    iHigh := iMid - 1;\nend;" },
                {
                    t: "fillTable",
                    prompt: "Count one **check** each time the target is compared with an element. Fill in the most checks each search can need (the worst case, for example when the value is not in the array). Type whole numbers without spaces.",
                    headers: ["Elements in the sorted array", "Linear search: most checks", "Binary search: most checks"],
                    rows: [
                        ["7", "?7", "?3"],
                        ["15", "?15", "?4"],
                        ["31", "?31", "?5"],
                        ["1023", "?1023", "?10"],
                        ["1 000 000", "1 000 000", "?20"],
                    ],
                },
                {
                    t: "reveal",
                    title: "See the pattern",
                    text: "With 7 elements, the first check leaves at most 3, the second at most 1, and the third settles it. Each time the array (roughly) doubles in size, binary search needs only **one more** check, while linear search needs twice as many. 2²⁰ is just over a million, so 20 checks are enough for a million sorted elements.",
                },
                { t: "table", header: ["", "Linear search", "Binary search"], rows: [["Array must be sorted", "No", "Yes"], ["Most checks for n elements", "n", "about log₂ n"], ["Best for", "Small or unsorted arrays", "Large sorted arrays that are searched often"]] },
                {
                    t: "quiz",
                    pass: 75,
                    questions: [
                        { q: "What must be true before you can use binary search?", options: ["The array must have an odd number of elements", "The array must be sorted", "The value must be in the array", "The array must hold integers"], answer: 1 },
                        { q: "A sorted array of 63 names is searched with binary search. What is the most checks it can need?", options: ["6", "7", "32", "63"], answer: 0 },
                        { q: "In the code above, which index is checked first when iLow = 1 and iHigh = 15?", options: ["1", "7", "8", "15"], answer: 2 },
                        { q: "You search an **unsorted** array of 20 elements once. Which method is the sensible choice?", options: ["Binary search, because it is always faster", "Linear search, because sorting first takes more work than one linear search", "Neither: unsorted arrays cannot be searched"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Databases: SELECT … WHERE",
            blocks: [
                "A **database table** stores records (rows) made of fields (columns). Each record has a **primary key**, a field whose value is unique, so every learner can be identified even if two have the same name. Here is the design of `tblLearners`:",
                { t: "table", header: ["Field", "Data type", "Notes"], rows: [["LearnerID", "Integer (AutoNumber)", "Primary key"], ["Surname", "Text", ""], ["FirstName", "Text", ""], ["Grade", "Integer", "10, 11 or 12"], ["Mark", "Integer", "Latest IT mark, 0 to 100"], ["Town", "Text", ""]] },
                { t: "table", header: ["LearnerID", "Surname", "FirstName", "Grade", "Mark", "Town"], rows: [["1", "Mokoena", "Thabo", "11", "72", "Soweto"], ["2", "Dlamini", "Lerato", "10", "85", "Durban"], ["3", "Patel", "Aisha", "11", "91", "Durban"], ["4", "Nkosi", "Sipho", "12", "64", "Pretoria"], ["5", "Khumalo", "Naledi", "11", "88", "Soweto"], ["6", "Venter", "Pieter", "11", "47", "Pretoria"], ["7", "Botha", "Johan", "10", "80", "Cape Town"], ["8", "Zulu", "Zanele", "12", "93", "Durban"]] },
                { t: "code", lang: "sql", code: "SELECT FirstName, Surname      -- which fields, in this order\nFROM tblLearners               -- which table\nWHERE Town = 'Durban'          -- which records\nORDER BY Surname               -- optional: sort the result (add DESC for Z to A)" },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "List the **Grade 11** learners. Select exactly two fields, in this order: `FirstName`, `Surname`.",
                    setup: LEARNERS_SETUP,
                    starter: "SELECT *\nFROM tblLearners",
                    solution: "SELECT FirstName, Surname\nFROM tblLearners\nWHERE Grade = 11",
                    tests: [{ name: "The Grade 11 learners" }],
                },
                {
                    t: "codelab",
                    language: "sql",
                    prompt: "List the learners with a mark of **80 or more**, sorted by surname from A to Z. Select `Surname`, `FirstName`, `Mark` in that order.",
                    setup: LEARNERS_SETUP,
                    ordered: true,
                    starter: "SELECT Surname, FirstName, Mark\nFROM tblLearners",
                    solution: "SELECT Surname, FirstName, Mark\nFROM tblLearners\nWHERE Mark >= 80\nORDER BY Surname",
                    tests: [{ name: "Marks of 80 or more, by surname" }],
                },
                { t: "reveal", title: "Hint: 80 or more", text: "\"80 or more\" includes 80 itself, so use `>=`. Johan Botha has exactly 80: check that he is in your result." },
                { t: "callout", variant: "info", blocks: ["In a Delphi project the same query runs through an ADO query component:", { t: "code", lang: "delphi", code: "qryLearners.SQL.Text := 'SELECT FirstName, Surname FROM tblLearners WHERE Grade = 11';\nqryLearners.Open;" }] },
            ],
        },
    ],
};
