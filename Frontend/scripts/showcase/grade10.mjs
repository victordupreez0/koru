// Grade 10, Information Technology (CAPS FET, Solution Development in Delphi): algorithms,
// IPO tables, flowcharts, pseudocode and trace tables (Term 1), decisions and data validation
// (Term 2), loops and the classic Grade 10 algorithms (Term 3). Code is Delphi console style;
// school code writes to a TRichEdit, here WriteLn does that job.

const delphi = (code) => ({ t: "code", lang: "delphi", code });

export default {
    code: "IT-G10",
    name: "Information Technology: Grade 10",
    description: "Solution Development in Delphi: plan with IPO tables and flowcharts, then code decisions, loops and the classic algorithms.",
    module: "Algorithms: from flowchart to code",

    home: [
        { t: "h1", text: "Information Technology: Grade 10" },
        "Solution Development is about 60% of IT, and it starts before you touch the keyboard. In this module you **plan** a solution (IPO table, flowchart, pseudocode), **code** it in Delphi, and **prove** it works with trace tables and test data.",
        {
            t: "table",
            header: ["Term", "Focus"],
            rows: [
                ["Term 1", "Algorithms, flowcharts, pseudocode, trace tables, IPO tables, variables, data types, operators"],
                ["Term 2", "if-then-else, nested if, case, Boolean operators, data validation"],
                ["Term 3", "for, while and repeat-until loops, string manipulation"],
            ],
        },
        { t: "callout", variant: "info", text: "The code labs run Delphi-style console Pascal in your browser. In the school lab you write the same logic in a form and use `redOutput.Lines.Add` where we use `WriteLn`." },
        { t: "callout", variant: "success", text: "Open **Modules** and start with *Plan before you code*." },
    ],

    pages: [
        {
            title: "Plan before you code: IPO and flowcharts",
            blocks: [
                { t: "hero", title: "Think first, type second", subtitle: "Every good program starts as a plan.", emoji: "🧭", theme: "night" },
                "An **algorithm** is a finite, ordered set of unambiguous steps that solves a problem. Programmers describe algorithms in more than one way before they code them.",
                {
                    t: "flashcards",
                    title: "The planning toolkit",
                    cards: [
                        ["Algorithm", "A finite, ordered set of unambiguous steps that solves a problem."],
                        ["Pseudocode", "Steps written in structured, code-like English. No language rules, but precise."],
                        ["Flowchart", "A diagram of an algorithm: ovals for start and stop, parallelograms for input and output, rectangles for processing, diamonds for decisions."],
                        ["Trace table", "A table that follows the value of each variable line by line, to check an algorithm by hand."],
                        ["IPO table", "Lists the Input, the Processing and the Output of a problem."],
                    ],
                },
                {
                    t: "columns",
                    layout: "wide-left",
                    cols: [
                        [{ t: "diagram", code: "flowchart TD\n  A([Start]) --> B[/Input iNum/]\n  B --> C{iNum mod 2 = 0?}\n  C -- Yes --> D[/Display Even/]\n  C -- No --> E[/Display Odd/]\n  D --> F([Stop])\n  E --> F", caption: "Is a number even or odd?" }],
                        [{ t: "table", header: ["I", "P", "O"], rows: [["iNum", "Find iNum mod 2. If it is 0, the number is even", "The message Even or Odd"]] }, "`mod` gives the remainder after division. An even number leaves remainder 0 when divided by 2."],
                    ],
                },
                {
                    t: "sort",
                    prompt: "A taxi association wants a program that works out a commuter's monthly fare. Sort each part into the IPO table.",
                    groups: {
                        Input: ["Number of trips this month", "Price of one trip"],
                        Processing: ["Multiply trips by the price", "Check that the number of trips is not negative"],
                        Output: ["Display the total fare", "Display an error message for invalid input"],
                    },
                },
                {
                    t: "order",
                    prompt: "Put this pseudocode in order. It works out whether a learner passes on the average of three tests.",
                    code: true,
                    items: ["Input iTest1, iTest2, iTest3", "iTotal ← iTest1 + iTest2 + iTest3", "rAverage ← iTotal / 3", "If rAverage >= 50 then", "    Display 'Pass'", "Else", "    Display 'Fail'"],
                },
            ],
        },
        {
            title: "Variables, data types and operators",
            blocks: [
                "A **variable** is a named place in memory that holds one value of one **data type**. Delphi programmers start the name with a letter that shows the type, so the code explains itself.",
                {
                    t: "table",
                    header: ["Data type", "Holds", "Example name"],
                    rows: [
                        ["Integer", "Whole numbers", "`iCount`"],
                        ["Real", "Numbers with decimals", "`rAverage`"],
                        ["String", "Text, any length", "`sName`"],
                        ["Boolean", "True or False", "`bFound`"],
                        ["Char", "Exactly one character", "`cLetter`"],
                    ],
                },
                {
                    t: "sort",
                    prompt: "Pick the best data type for each value. (Char gets its turn in the declarations below.)",
                    groups: {
                        Integer: ["Number of learners in a class: 32", "The year: 2026"],
                        Real: ["Price of a loaf of bread: R18.99", "Average mark: 67.5"],
                        String: ["A learner's surname: Mokoena", "A cell phone number: 082 555 1234"],
                        Boolean: ["Has the learner paid the trip fee?", "Is the number prime?"],
                    },
                },
                { t: "reveal", title: "Why is a phone number a String?", text: "You never do maths with it, and it starts with 0, which an Integer would throw away. Store numbers you calculate with as numbers, and identifiers as text." },
                {
                    t: "blanks",
                    prompt: "Complete the declarations so each variable has the right type.",
                    code: true,
                    bank: true,
                    text: "var\n  iCount: {{Integer}};\n  rAverage: {{Real}};\n  sName: {{String}};\n  bFound: {{Boolean}};\n  cLetter: {{Char}};",
                    distractors: ["Text", "Float"],
                },
                "Two operators work only on Integers. `div` divides and **throws away** the remainder. `mod` gives **only** the remainder. `/` always gives a Real.",
                {
                    t: "fillTable",
                    prompt: "Work out each expression.",
                    headers: ["Expression", "Result"],
                    rows: [["17 div 5", "3"], ["17 mod 5", "?2"], ["357 mod 10", "?7"], ["357 div 10", "?35"], ["357 div 100", "?3"], ["7 / 2", "?3.5"]],
                },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "**Isolate the digits.** Read a three-digit number and write the sum of its digits. Use `mod 10` for the units, `div 10` then `mod 10` for the tens, and `div 100` for the hundreds. Write exactly `Sum of digits: 15` for 357.",
                    starter: "program SumOfDigits;\nvar\n  iNum, iUnits, iTens, iHundreds, iSum: Integer;\nbegin\n  Write('Enter a three-digit number: ');\n  ReadLn(iNum);\n  // isolate the three digits here\n\n  WriteLn('Sum of digits: ', iSum);\nend.\n",
                    solution: "program SumOfDigits;\nvar\n  iNum, iUnits, iTens, iHundreds, iSum: Integer;\nbegin\n  Write('Enter a three-digit number: ');\n  ReadLn(iNum);\n  iUnits := iNum mod 10;\n  iTens := (iNum div 10) mod 10;\n  iHundreds := iNum div 100;\n  iSum := iUnits + iTens + iHundreds;\n  WriteLn('Sum of digits: ', iSum);\nend.\n",
                    tests: [
                        { name: "357", stdin: "357" },
                        { name: "100", stdin: "100", hidden: true },
                        { name: "999", stdin: "999", hidden: true },
                        { name: "405 (a zero in the middle)", stdin: "405", hidden: true },
                    ],
                },
            ],
        },
        {
            title: "Decisions: if-then-else and case",
            blocks: [
                "`if-then-else` chooses between two paths. When a path has more than one statement, wrap it in `begin … end`. There is **never** a semicolon straight before `else`.",
                delphi("if iMark >= 50 then\n  WriteLn('Pass')\nelse\n  WriteLn('Fail');"),
                "A **nested if** is an if inside another if. Here the outer if does **data validation** (is the mark possible at all?) and the inner if makes the real decision.",
                { t: "diagram", code: "flowchart TD\n  A[/Input iMark/] --> B{\"(iMark >= 0) and (iMark <= 100)?\"}\n  B -- No --> C[/Display Invalid mark/]\n  B -- Yes --> D{iMark >= 50?}\n  D -- Yes --> E[/Display Pass/]\n  D -- No --> F[/Display Fail/]", caption: "Validate first, then decide." },
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Boolean operators" }, "`and`, `or` and `not` combine conditions. In Delphi each comparison needs **brackets**: `(iMark >= 0) and (iMark <= 100)`."],
                        [{ t: "h3", text: "case" }, "When one Integer or Char picks from many options, `case` is neater than a chain of ifs. It accepts ranges like `80..100:`."],
                    ],
                },
                delphi("case iMark of\n  80..100: iLevel := 7;\n  70..79: iLevel := 6;\n  // ...\nend;"),
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "Read a mark out of 100 and write its achievement level, for example `Level 7`. Levels: 80-100 is 7, 70-79 is 6, 60-69 is 5, 50-59 is 4, 40-49 is 3, 30-39 is 2, 0-29 is 1. If the mark is below 0 or above 100, write `Invalid mark` instead.",
                    starter: "program AchievementLevel;\nvar\n  iMark, iLevel: Integer;\nbegin\n  Write('Enter the mark: ');\n  ReadLn(iMark);\n  // validate, then work out iLevel with a case statement\n\nend.\n",
                    solution: "program AchievementLevel;\nvar\n  iMark, iLevel: Integer;\nbegin\n  Write('Enter the mark: ');\n  ReadLn(iMark);\n  if (iMark < 0) or (iMark > 100) then\n    WriteLn('Invalid mark')\n  else\n  begin\n    case iMark of\n      80..100: iLevel := 7;\n      70..79: iLevel := 6;\n      60..69: iLevel := 5;\n      50..59: iLevel := 4;\n      40..49: iLevel := 3;\n      30..39: iLevel := 2;\n    else\n      iLevel := 1;\n    end;\n    WriteLn('Level ', iLevel);\n  end;\nend.\n",
                    tests: [
                        { name: "85", stdin: "85" },
                        { name: "80 (lowest Level 7)", stdin: "80", hidden: true },
                        { name: "79", stdin: "79", hidden: true },
                        { name: "50", stdin: "50", hidden: true },
                        { name: "49", stdin: "49", hidden: true },
                        { name: "30", stdin: "30", hidden: true },
                        { name: "29", stdin: "29", hidden: true },
                        { name: "0", stdin: "0", hidden: true },
                        { name: "100", stdin: "100", hidden: true },
                        { name: "101 is invalid", stdin: "101", hidden: true },
                        { name: "-5 is invalid", stdin: "-5", hidden: true },
                    ],
                },
                {
                    t: "quiz",
                    pass: 67,
                    questions: [
                        { q: "What is the value of `(5 > 3) and not (2 > 1)`?", options: ["True", "False"], answer: 1 },
                        { q: "Why does `if iMark >= 0 and iMark <= 100 then` give an error in Delphi?", options: ["`and` is worked out before `>=` and `<=`, so brackets are needed", "`and` cannot be used in an if", "Marks must be Real"], answer: 0 },
                        { q: "Which test data checks a boundary for Level 4?", options: ["55", "50 and 49", "75"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Loops and trace tables",
            blocks: [
                {
                    t: "table",
                    header: ["Loop", "Use it when", "Runs at least once?"],
                    rows: [
                        ["`for`", "You know how many times before the loop starts", "No (not if the start is past the end)"],
                        ["`while … do`", "You repeat while a condition is true, tested first", "No"],
                        ["`repeat … until`", "You repeat until a condition is true, tested last", "Yes"],
                    ],
                },
                "Read this loop. It adds up square numbers. Then prove what it does with a trace table: one row per pass of the loop.",
                delphi("iTotal := 0;\nfor iCount := 1 to 4 do\n  iTotal := iTotal + iCount * iCount;\nWriteLn(iTotal);"),
                {
                    t: "fillTable",
                    prompt: "Complete the trace table.",
                    headers: ["iCount", "iCount * iCount", "iTotal"],
                    rows: [["(start)", "", "0"], ["1", "1", "1"], ["2", "?4", "?5"], ["3", "?9", "?14"], ["4", "?16", "?30"]],
                },
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "**Sum.** Read n and use a `for` loop to add up 1 + 2 + … + n. Write `Sum = 15` when n is 5.",
                    starter: "program SumToN;\nvar\n  iLimit, iCount, iSum: Integer;\nbegin\n  Write('Enter n: ');\n  ReadLn(iLimit);\n\nend.\n",
                    solution: "program SumToN;\nvar\n  iLimit, iCount, iSum: Integer;\nbegin\n  Write('Enter n: ');\n  ReadLn(iLimit);\n  iSum := 0;\n  for iCount := 1 to iLimit do\n    iSum := iSum + iCount;\n  WriteLn('Sum = ', iSum);\nend.\n",
                    tests: [
                        { name: "n = 5", stdin: "5" },
                        { name: "n = 1", stdin: "1", hidden: true },
                        { name: "n = 10", stdin: "10", hidden: true },
                        { name: "n = 100", stdin: "100", hidden: true },
                    ],
                },
                "Now a loop where you **don't** know the count: how many digits does a number have? Keep chopping off the last digit with `div 10` and count the chops.",
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "**Count the digits.** Read a whole number (0 or more) and use a `repeat … until` loop to count its digits. Write `Digits: 4` for 2026. Remember that 0 has one digit.",
                    starter: "program CountDigits;\nvar\n  iNum, iDigits: Integer;\nbegin\n  Write('Enter a whole number: ');\n  ReadLn(iNum);\n  iDigits := 0;\n\n  WriteLn('Digits: ', iDigits);\nend.\n",
                    solution: "program CountDigits;\nvar\n  iNum, iDigits: Integer;\nbegin\n  Write('Enter a whole number: ');\n  ReadLn(iNum);\n  iDigits := 0;\n  repeat\n    iNum := iNum div 10;\n    Inc(iDigits);\n  until iNum = 0;\n  WriteLn('Digits: ', iDigits);\nend.\n",
                    tests: [
                        { name: "2026", stdin: "2026" },
                        { name: "7", stdin: "7", hidden: true },
                        { name: "0", stdin: "0", hidden: true },
                        { name: "1000000", stdin: "1000000", hidden: true },
                    ],
                },
                { t: "reveal", title: "Why repeat-until and not while?", text: "With `while iNum > 0 do`, the number 0 would never enter the loop and the answer would be 0 digits. `repeat` runs its body at least once, so 0 correctly has 1 digit." },
            ],
        },
        {
            title: "Classic algorithms",
            blocks: [
                "CAPS names a set of algorithms every Grade 10 learner must know: swap two values, sum, isolate the digits of a number, smallest and biggest, even, factors, prime, LCM and GCD, and find a character in a string. You have already met sum, isolate digits and even.",
                { t: "h2", text: "Swap two values" },
                "To swap two values you need a third, temporary variable. Without it, the first assignment destroys a value you still need.",
                {
                    t: "order",
                    prompt: "Put the lines in order so that iA and iB swap values, then display them.",
                    code: true,
                    items: ["iTemp := iA;", "iA := iB;", "iB := iTemp;", "WriteLn('A = ', iA, ', B = ', iB);"],
                },
                { t: "reveal", title: "What goes wrong without iTemp?", text: "Say iA is 5 and iB is 8. `iA := iB` makes iA 8. Then `iB := iA` makes iB 8 too. The 5 is gone." },
                { t: "h2", text: "Prime numbers" },
                "A prime has **exactly two** factors: 1 and itself. So use the **factors** algorithm: count how many numbers from 1 to iNum divide it with no remainder. If the count is 2, it is prime. (1 has only one factor, so it is not prime.)",
                {
                    t: "codelab",
                    language: "pascal",
                    prompt: "Read a whole number of 1 or more. Write `17 is prime` or `9 is not prime` (with the number that was typed).",
                    starter: "program PrimeCheck;\nvar\n  iNum, iFactor, iFactors: Integer;\nbegin\n  Write('Enter a whole number: ');\n  ReadLn(iNum);\n\nend.\n",
                    solution: "program PrimeCheck;\nvar\n  iNum, iFactor, iFactors: Integer;\nbegin\n  Write('Enter a whole number: ');\n  ReadLn(iNum);\n  iFactors := 0;\n  for iFactor := 1 to iNum do\n    if iNum mod iFactor = 0 then\n      Inc(iFactors);\n  if iFactors = 2 then\n    WriteLn(iNum, ' is prime')\n  else\n    WriteLn(iNum, ' is not prime');\nend.\n",
                    tests: [
                        { name: "17", stdin: "17" },
                        { name: "2, the only even prime", stdin: "2", hidden: true },
                        { name: "9", stdin: "9", hidden: true },
                        { name: "1", stdin: "1", hidden: true },
                        { name: "25", stdin: "25", hidden: true },
                        { name: "97", stdin: "97", hidden: true },
                    ],
                },
                { t: "h2", text: "GCD, the Euclidean way" },
                delphi("// Greatest common divisor of iA and iB\nwhile iB <> 0 do\nbegin\n  iTemp := iB;\n  iB := iA mod iB;\n  iA := iTemp;\nend;\nWriteLn('GCD: ', iA);"),
                {
                    t: "quiz",
                    pass: 60,
                    questions: [
                        { q: "What is the GCD of 12 and 18?", options: ["3", "6", "36"], answer: 1 },
                        { q: "LCM(a, b) = (a × b) div GCD(a, b). What is the LCM of 4 and 6?", options: ["2", "12", "24"], answer: 1 },
                        { q: "To find the highest of a list of winter temperatures (some below zero), what should rMax start as?", options: ["0", "The first temperature in the list", "100"], answer: 1 },
                        { q: "What does `Pos('a', 'Lerato')` return?", options: ["3", "4", "0"], answer: 1 },
                        { q: "In the GCD code above, when does the loop stop?", options: ["When iA mod iB is 0, so iB becomes 0", "After 10 passes", "When iA equals iB"], answer: 0 },
                    ],
                },
                { t: "callout", variant: "success", text: "Plan, code, trace, test. That cycle is Solution Development, and it works for every algorithm you will meet in Grades 11 and 12." },
            ],
        },
    ],
};
