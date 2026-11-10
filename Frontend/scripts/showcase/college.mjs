// First-year university programming (Python), modelled on courses such as UCT CSC1015F. This
// module is the step up from school: recursion and algorithm efficiency (Big-O) are not in the
// CAPS curriculum. Students are 18 or 19: precise, adult, still plain.

const BINARY_SEARCH = `def binary_search(items, target, low, high):
    """Return the index of target in the sorted list items[low..high], or -1."""
    if low > high:
        return -1
    mid = (low + high) // 2
    if items[mid] == target:
        return mid
    if items[mid] < target:
        return binary_search(items, target, mid + 1, high)
    return binary_search(items, target, low, mid - 1)
`;

const search = (list, target) => `items = ${list}\nprint(binary_search(items, ${target}, 0, len(items) - 1))`;

export default {
    code: "CS-101",
    name: "Computer Science 1: Programming and Problem Solving",
    description: "First-year programming in Python: problem solving, functions and lists, then recursion and the efficiency of algorithms.",
    module: "Recursion and algorithm efficiency",

    home: [
        { t: "h1", text: "Computer Science 1: Programming and Problem Solving" },
        "This module takes you past school programming. You will write **recursive** functions, use recursion to draw fractals and to search, and learn to reason about **how fast** an algorithm is with **Big-O notation**. Neither topic is in the school curriculum, so nothing here assumes you have seen it.",
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "You should already be able to" }, { t: "bullets", items: ["Write functions with parameters and return values", "Loop over lists with `for` and `while`", "Use `if`, `elif` and `else`"] }],
                [{ t: "h3", text: "By the end you can" }, { t: "bullets", items: ["Identify the base case and recursive case of a problem", "Implement recursive binary search and merge", "Count the steps an algorithm takes", "Classify code as O(1), O(log n), O(n) or O(n²)"] }],
            ],
        },
        { t: "callout", variant: "info", text: "All code runs in real Python 3 in your browser. Marked labs run hidden tests as well as the visible example, so test your own edge cases (empty lists, one element, the first and last positions) before you press **Check**." },
    ],

    pages: [
        {
            title: "Thinking recursively",
            blocks: [
                { t: "hero", title: "Thinking recursively", subtitle: "Solve a problem by solving a smaller copy of it.", emoji: "🪞", theme: "purple" },
                "A **recursive** function calls itself on a smaller input. Every correct recursive function has two parts:",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Base case" }, "An input small enough to answer directly, with no further call. It stops the recursion. For factorial: 0! = 1."],
                        [{ t: "h3", text: "Recursive case" }, "Express the answer in terms of the same problem on a **smaller** input, so that every chain of calls reaches the base case. For factorial: n! = n × (n − 1)!"],
                    ],
                },
                { t: "code", lang: "python", code: "def factorial(n):\n    if n == 0:                       # base case\n        return 1\n    return n * factorial(n - 1)      # recursive case\n\nprint(factorial(4))   # 24" },
                {
                    t: "diagram",
                    code: "sequenceDiagram\n  participant M as main\n  participant F4 as factorial(4)\n  participant F3 as factorial(3)\n  participant F2 as factorial(2)\n  participant F1 as factorial(1)\n  participant F0 as factorial(0)\n  M->>F4: call\n  F4->>F3: 4 * factorial(3)\n  F3->>F2: 3 * factorial(2)\n  F2->>F1: 2 * factorial(1)\n  F1->>F0: 1 * factorial(0)\n  F0-->>F1: return 1 (base case)\n  F1-->>F2: return 1\n  F2-->>F3: return 2\n  F3-->>F4: return 6\n  F4-->>M: return 24",
                    caption: "Each call waits for the one below it. The multiplications happen on the way back up.",
                },
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Write `sum_to(n)` **recursively** (no loops, no `sum`): it returns 1 + 2 + … + n, and `sum_to(0)` returns 0. The tests call your function, for example `print(sum_to(5))`, which should print 15.",
                    starter: "def sum_to(n):\n    # Base case: what is the sum when n is 0?\n    # Recursive case: how does sum_to(n) relate to sum_to(n - 1)?\n    pass\n",
                    solution: "def sum_to(n):\n    if n == 0:\n        return 0\n    return n + sum_to(n - 1)\n",
                    tests: [
                        { name: "sum_to(5)", append: "print(sum_to(5))" },
                        { name: "The base case, sum_to(0)", append: "print(sum_to(0))", hidden: true },
                        { name: "sum_to(1)", append: "print(sum_to(1))", hidden: true },
                        { name: "sum_to(100)", append: "print(sum_to(100))", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint", text: "Follow the shape of `factorial`: the base case returns 0 instead of 1, and the recursive case adds `n` instead of multiplying. Trace `sum_to(3)` by hand: 3 + sum_to(2) = 3 + 2 + sum_to(1) = 3 + 2 + 1 + sum_to(0) = 6." },
                { t: "callout", variant: "warning", text: "Without a base case, or with a recursive case that does not get smaller, the calls never stop. Python gives up after about 1000 nested calls with a `RecursionError`." },
            ],
        },
        {
            title: "Recursion that draws",
            blocks: [
                "A **fractal** is a shape built from smaller copies of itself, which makes it a natural fit for recursion. A tree is a trunk with two smaller trees growing out of the top. The base case is the tip of a twig, where a flower is drawn instead.",
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Run the program to grow a jacaranda. Then change `ANGLE` (try 15 and 40) and `DEPTH` (try 4 and 9) and run it again. Every extra level doubles the number of tips.",
                    starter: `import turtle

ANGLE = 25    # degrees between each branch and its parent
DEPTH = 8     # how many times the tree splits
SHRINK = 0.72 # each branch is this fraction of its parent

t = turtle.Turtle()
t.speed(0)
t.hideturtle()
turtle.bgcolor("#fdf6e3")


def branch(length, depth):
    if depth == 0:                       # base case: a flower at the tip
        t.dot(7, "#8e6bbf")
        return
    t.pensize(depth)
    t.pencolor("#5b3a29" if depth > 3 else "#4f7942")
    t.forward(length)
    t.left(ANGLE)
    branch(length * SHRINK, depth - 1)   # the left subtree
    t.right(2 * ANGLE)
    branch(length * SHRINK, depth - 1)   # the right subtree
    t.left(ANGLE)
    t.penup()
    t.backward(length)                   # back to where this branch started
    t.pendown()


t.penup()
t.goto(0, -220)
t.setheading(90)                         # point straight up
t.pendown()
branch(110, DEPTH)
`,
                },
                { t: "callout", variant: "info", text: "Notice the last three lines of `branch`: every call returns the turtle to where it started, facing the same way. That **invariant** is what lets the parent call carry on as if nothing happened." },
                { t: "h2", text: "The Koch snowflake" },
                "Replace a straight line with four lines a third as long, with a bump in the middle. Then do the same to each of those four lines, and so on. Three Koch curves make a snowflake.",
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Run it with `ORDER` from 0 to 4. How many line segments does order 4 draw? (Each order multiplies the count by 4.)",
                    starter: `import turtle

ORDER = 3

t = turtle.Turtle()
t.speed(0)
t.hideturtle()
t.pensize(2)
t.color("#1f6fb2", "#d6eaf8")


def koch(length, order):
    if order == 0:                       # base case: a straight line
        t.forward(length)
        return
    for turn in (60, -120, 60, 0):       # four smaller curves, with turns between them
        koch(length / 3, order - 1)
        t.left(turn)


t.penup()
t.goto(-150, 87)
t.pendown()
t.begin_fill()
for side in range(3):
    koch(300, ORDER)
    t.right(120)
t.end_fill()
`,
                },
                { t: "reveal", title: "Answer", text: "Order 0 draws 3 segments (a triangle). Each order multiplies that by 4, so order 4 draws 3 × 4⁴ = 768 segments. The tree with `DEPTH = 8` draws 2⁸ − 1 = 255 branches and 256 flowers. Recursive drawings grow exponentially with depth." },
            ],
        },
        {
            title: "Binary search, recursively",
            blocks: [
                "Binary search is recursive by nature: compare the target with the middle item of a **sorted** list, then search **one half** of the list in exactly the same way. The base case is an empty range: there is nothing left, so the target is not there.",
                { t: "algo", prompt: "Search for 64 in 15 sorted numbers. Watch the range shrink by half each step.", algorithm: "binary", data: [3, 8, 12, 19, 25, 31, 40, 47, 52, 58, 64, 71, 77, 85, 93], target: 64 },
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Base case" }, "`low > high`: the range is empty. Return -1."],
                        [{ t: "h3", text: "Recursive case" }, "Let `mid = (low + high) // 2`. If `items[mid]` is the target, return `mid`. Otherwise search `low..mid - 1` or `mid + 1..high`."],
                    ],
                },
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Write `binary_search(items, target, low, high)` **recursively**. It returns the index of `target` in the sorted list `items` between positions `low` and `high` inclusive, or `-1` if it is not there. The tests call it on the whole list, for example `binary_search(items, 25, 0, len(items) - 1)`.",
                    starter: "def binary_search(items, target, low, high):\n    \"\"\"Return the index of target in the sorted list items[low..high], or -1.\"\"\"\n    # Base case: the range low..high is empty\n    # Recursive case: look at the middle item, then search one half\n    pass\n",
                    solution: BINARY_SEARCH,
                    tests: [
                        { name: "Finds 25 in [3, 8, 12, 19, 25, 31, 40, 47]", append: search("[3, 8, 12, 19, 25, 31, 40, 47]", 25) },
                        { name: "A value that is not in the list", append: search("[3, 8, 12, 19, 25, 31, 40, 47]", 30), hidden: true },
                        { name: "The first item", append: search("[3, 8, 12, 19, 25, 31, 40, 47]", 3), hidden: true },
                        { name: "The last item", append: search("[3, 8, 12, 19, 25, 31, 40, 47]", 47), hidden: true },
                        { name: "A one-element list that holds the target", append: search("[7]", 7), hidden: true },
                        { name: "A one-element list without the target", append: search("[7]", 2), hidden: true },
                        { name: "An empty list", append: search("[]", 5), hidden: true },
                    ],
                },
                { t: "reveal", title: "Why pass low and high instead of slicing?", text: "`binary_search(items[mid + 1:], target)` looks neater, but every slice **copies** part of the list, which costs time proportional to its length. Passing `low` and `high` keeps each call to a constant amount of work, so the whole search stays O(log n). It also keeps the indexes relative to the original list." },
            ],
        },
        {
            title: "How fast? Counting steps and Big-O",
            blocks: [
                "To compare algorithms independently of the computer, count the **basic steps** (here: comparisons) as the input size **n** grows. **Big-O notation** describes how that count grows for large n, ignoring constant factors and smaller terms: 3n² + 5n + 2 is O(n²).",
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Run this. It counts the comparisons that linear and binary search make in the worst case (the target is bigger than every item). Then predict both numbers for n = 2 000 000, add `2_000_000` to the list of sizes and run it again to check.",
                    starter: `def linear_count(items, target):
    count = 0
    for item in items:
        count += 1
        if item == target:
            break
    return count


def binary_count(items, target):
    low, high = 0, len(items) - 1
    count = 0
    while low <= high:
        mid = (low + high) // 2
        count += 1
        if items[mid] == target:
            break
        elif items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return count


print(f"{'n':>9} {'linear':>9} {'binary':>7}")
for n in [10, 100, 1_000, 10_000, 100_000, 1_000_000]:
    items = list(range(n))
    target = n                     # not in the list, and bigger than every item
    print(f"{n:>9} {linear_count(items, target):>9} {binary_count(items, target):>7}")
`,
                },
                {
                    t: "sort",
                    prompt: "Sort each piece of code by how its running time grows with n, the length of the list `items`.",
                    groups: {
                        "O(1)": ["`items[0]`: read the first item", "`len(items)`: Python stores the length"],
                        "O(log n)": ["Binary search in the sorted list", "`while n > 1: n = n // 2`"],
                        "O(n)": ["Linear search for a value", "`max(items)`", "One `for` loop that adds up the items"],
                        "O(n²)": ["Bubble sort", "Two nested loops that compare every pair of items"],
                    },
                },
                {
                    t: "fillTable",
                    prompt: "Fill in n² and the number of times n can be halved before it reaches 1 (that is log₂ n). Type whole numbers without spaces.",
                    headers: ["n", "n²", "Halvings to reach 1 (log₂ n)"],
                    rows: [
                        ["8", "?64", "?3"],
                        ["16", "?256", "?4"],
                        ["64", "?4096", "?6"],
                        ["1024", "?1048576", "?10"],
                    ],
                },
                { t: "callout", variant: "success", text: "Read the table as a warning. For n = 1024 an O(log n) algorithm does about 10 steps and an O(n²) one about a million. Doubling n adds **one** step to the first and **multiplies** the second by four." },
            ],
        },
        {
            title: "Merge sort against bubble sort",
            blocks: [
                "Bubble sort compares neighbours and makes up to n − 1 passes over the list, so it does about n²/2 comparisons: O(n²). Step through it to recall how much work that is.",
                { t: "algo", prompt: "Count the comparisons bubble sort makes on 7 numbers.", algorithm: "bubble", data: [38, 27, 43, 3, 9, 82, 10], target: 38 },
                "**Merge sort** is recursive. Base case: a list of 0 or 1 items is already sorted. Recursive case: split the list in half, sort each half recursively, then **merge** the two sorted halves into one.",
                {
                    t: "diagram",
                    code: "flowchart TD\n  A[\"38 27 43 3 9 82 10 15\"] --> B[\"38 27 43 3\"]\n  A --> C[\"9 82 10 15\"]\n  B --> D[\"38 27\"]\n  B --> E[\"43 3\"]\n  C --> F[\"9 82\"]\n  C --> G[\"10 15\"]\n  D --> H[\"27 38\"]\n  E --> I[\"3 43\"]\n  F --> J[\"9 82\"]\n  G --> K[\"10 15\"]\n  H --> L[\"3 27 38 43\"]\n  I --> L\n  J --> M[\"9 10 15 82\"]\n  K --> M\n  L --> N[\"3 9 10 15 27 38 43 82\"]\n  M --> N",
                    caption: "Split down to pairs (each pair is split into single items and merged, shown as one step), then merge back up. There are log₂ 8 = 3 levels of merging and each level handles all 8 items: O(n log n).",
                },
                { t: "code", lang: "python", code: "def merge_sort(items):\n    if len(items) <= 1:                  # base case\n        return items\n    mid = len(items) // 2\n    left = merge_sort(items[:mid])       # sort each half recursively\n    right = merge_sort(items[mid:])\n    return merge(left, right)            # the part you write below" },
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Write `merge(left, right)`. Both lists are already sorted. Return **one new sorted list** with every item from both, in a single pass: repeatedly take the smaller front item, then add whatever is left. Do not use `sort` or `sorted`. The tests print the result, for example `print(merge([1, 4, 9], [2, 3, 10]))`.",
                    starter: "def merge(left, right):\n    result = []\n    i = 0  # next position in left\n    j = 0  # next position in right\n    # While both lists have items left, append the smaller front item.\n    # Then append whatever is left in either list.\n    return result\n",
                    solution: "def merge(left, right):\n    result = []\n    i = 0\n    j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result\n",
                    tests: [
                        { name: "merge([1, 4, 9], [2, 3, 10])", append: "print(merge([1, 4, 9], [2, 3, 10]))" },
                        { name: "The left list is empty", append: "print(merge([], [5, 6]))", hidden: true },
                        { name: "The right list is empty", append: "print(merge([1, 2], []))", hidden: true },
                        { name: "Both lists are empty", append: "print(merge([], []))", hidden: true },
                        { name: "Duplicates are kept", append: "print(merge([2, 2, 5], [2, 3]))", hidden: true },
                        { name: "Lists of different lengths", append: "print(merge([10], [1, 2, 3, 20]))", hidden: true },
                        { name: "Used by merge_sort", append: "def merge_sort(items):\n    if len(items) <= 1:\n        return items\n    mid = len(items) // 2\n    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))\n\nprint(merge_sort([38, 27, 43, 3, 9, 82, 10, 15]))", hidden: true },
                    ],
                },
                {
                    t: "quiz",
                    pass: 60,
                    questions: [
                        { q: "What is the time complexity of merge sort?", options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], answer: 2 },
                        { q: "An O(n²) sort takes 2 seconds for 10 000 items. Roughly how long for 20 000 items?", options: ["2 seconds", "4 seconds", "8 seconds", "16 seconds"], answer: 2 },
                        { q: "What must every recursive function have so that it stops?", options: ["A loop", "A base case that every chain of calls reaches", "A global variable", "A return value of 0"], answer: 1 },
                        { q: "About how many comparisons does binary search need, at most, on 1 000 000 sorted items?", options: ["20", "1 000", "500 000", "1 000 000"], answer: 0 },
                        { q: "What does merge sort cost that bubble sort does not?", options: ["Nothing: it is better in every way", "Extra memory for the merged lists, about n items", "It only works on numbers", "It needs the list to be sorted first"], answer: 1 },
                    ],
                },
            ],
        },
    ],
};
