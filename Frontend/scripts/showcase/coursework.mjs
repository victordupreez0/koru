// Assignments for each showcase course, in this order:
//   1 and 2: already marked (marks and comments released)
//   3: due in a few days (about half the class has handed in, nothing marked yet)
//   4: coming up (nobody has started)
// Each is [title, points, description]. The seeder adds the dates, submissions, marks,
// announcements, attendance and weekly class from these, relative to the day it runs.

export default {
    "CR-G01": [
        ["Draw a route to school", 10, "Draw a map from your home to school, with arrows showing the way. Ask a grown-up to take a photo and upload it."],
        ["Arrow treasure hunt", 10, "Hide a toy, then make arrow cards that lead a family member to it. Upload a photo of your arrow cards."],
        ["Be the robot", 10, "A family member gives you arrow commands to walk across the room. Upload a short video or a photo of you following them."],
        ["My arrow pattern", 10, "Make a pattern with arrow cards or drawings that repeats three times. Upload a photo."],
    ],
    "CR-G02": [
        ["Turn left, turn right", 20, "Follow the turn instructions on the worksheet and draw the path the robot takes."],
        ["Loop dance", 20, "Make up a dance with one move that repeats 4 times. Write it as a loop and upload a photo or a short video."],
        ["Secret code message", 20, "Write a short message in our picture code for a friend to work out. Upload a photo of your message."],
        ["Fix the buggy route", 20, "Each of the three robot routes on the worksheet has one mistake. Find it and draw the route that works."],
    ],
    "CR-G03": [
        ["Fwd, TL, TR maze", 20, "Write the code words that take the robot through the maze on the worksheet."],
        ["Repeat the square", 20, "Write a program with a repeat that walks the robot around a square. Test it with a toy and upload a photo."],
        ["Debug the delivery robot", 25, "The delivery robot keeps missing the house. Find the bug in each of the three programs and write the fixed code."],
        ["Design your own maze", 25, "Draw a 5 by 5 maze with a start and a finish, then write the shortest program that solves it."],
    ],
    "CR-G04": [
        ["Hello, me!", 20, "Build a block program that asks for your name and your favourite food, then says something back about both. Upload a screenshot."],
        ["Repeat a pattern", 20, "Use a repeat block to make a pattern of your choice. Upload a screenshot of your blocks."],
        ["Quiz bot", 30, "Make a block program that asks three questions and says whether each answer is right."],
        ["The sandwich algorithm", 20, "Write the exact steps for making a sandwich. Ask someone to follow them word for word, and write down what went wrong."],
    ],
    "CR-G05": [
        ["Jersey or T-shirt?", 30, "Build a program that asks for the temperature and uses if... else to say \"Take a jersey\" or \"Wear a T-shirt\"."],
        ["micro:bit name badge", 30, "In the MakeCode simulator, make the display scroll your name forever and show a heart when you press button A. Share your project link."],
        ["Guess my number", 40, "Write a program that asks for a guess and says \"Too high\", \"Too low\" or \"Correct!\". Upload a screenshot of your blocks."],
        ["Night light plan", 30, "Plan a micro:bit night light: draw a flowchart that switches the lights on when it gets dark and off when it is light."],
    ],
    "CR-G06": [
        ["Score keeper", 30, "Use a variable called iScore to keep score in a three-question quiz, and say the total at the end."],
        ["Polygon painter", 40, "Draw a triangle, a square and a hexagon, each with one repeat loop. Explain how you worked out each turn angle."],
        ["Tuck shop calculator", 40, "Ask how many items someone is buying and the price of one, then say the total in rands."],
        ["Flower power", 30, "Draw a flower by repeating one shape and turning a little each time. Upload your blocks and your drawing."],
    ],
    "CR-G07": [
        ["Class list", 30, "Store five names in a list, then use a for each loop to greet every person by name."],
        ["Random team picker", 40, "Pick learners at random from a list to make three teams, so that nobody is picked twice."],
        ["Grid of stars", 40, "Use a loop inside a loop to draw a 5 by 5 grid of shapes. Explain why it needs two loops."],
        ["Top score", 40, "Find the highest mark in a list of ten marks without using a sort block. Explain how your program works."],
    ],
    "CR-G08": [
        ["Shape from input", 40, "Ask how many sides and how long each side should be, then draw the shape with Python turtle."],
        ["Plant watering flowchart", 40, "Draw a flowchart for a system that waters the plants when the soil is dry and it is not raining."],
        ["Traffic light controller", 50, "Write a program that cycles through red, green and amber with the right timing, using a loop."],
        ["Smart system report", 30, "Choose a smart device at home. In one page, explain its inputs, its processing and its outputs."],
    ],
    "CR-G09": [
        ["Procedure toolkit", 40, "Write the procedures drawSquare and drawTriangle, each with a size parameter, and use them to draw a house."],
        ["Search the stock list", 50, "Write a linear search that finds a product in a list and says whether it is in stock."],
        ["Marks analyser", 50, "Given a list of marks, write procedures that work out the average, the highest mark and how many learners passed."],
        ["Debugging diary", 40, "Find and fix the three bugs in the program on the worksheet. Explain what each bug did and how you fixed it."],
    ],
    "IT-G10": [
        ["Flowchart to Delphi", 50, "Turn the flowchart for a VAT calculator into a working Delphi program."],
        ["Trace table practice", 40, "Complete the trace tables for the three algorithms on the worksheet."],
        ["PAT Phase 1: Defining the problem", 100, "Describe the problem your PAT solves, who will use it, and what goes in and what comes out. Use the Phase 1 template."],
        ["Loops and decisions practical", 60, "Write a Delphi program that reads ten marks and prints the average, the highest mark and the number of distinctions."],
    ],
    "IT-G11": [
        ["Rainfall array", 50, "Read twelve monthly rainfall figures into an array and print the wettest and the driest month."],
        ["Bubble sort by hand and in code", 60, "Show every pass of a bubble sort on the given list, then write it in Delphi."],
        ["Binary search practical", 60, "Implement binary search on a sorted array of learner numbers and count how many comparisons each search makes."],
        ["PAT Phase 2: Design", 100, "Hand in your PAT design: the data structures, a sketch of every screen, and the main algorithms in pseudocode."],
    ],
    "IT-G12": [
        ["The TLearner class", 60, "Write a TLearner class with private fields, a constructor, getters and a toString method, and a program that tests it."],
        ["Seating plan in a 2-D array", 60, "Store a 5 by 6 seating plan in a 2-D array and print who sits next to any learner you search for."],
        ["SQL queries practical", 80, "Write the eight SQL queries on the worksheet against tblLearners and tblResults."],
        ["PAT Phase 3: Final submission", 150, "Hand in your finished PAT: the program, the database and the user manual."],
    ],
    "CS-101": [
        ["Recursion warm-up", 50, "Write recursive Python functions for factorial, the sum of a number's digits and reversing a string, each with tests."],
        ["Big-O analysis", 50, "Give the Big-O of the six code fragments on the worksheet and justify each answer."],
        ["Merge sort lab", 100, "Implement merge sort in Python and time it against insertion sort for lists of 1 000 to 100 000 items. Plot and explain the results."],
        ["Project: maze solver", 100, "Write a recursive maze solver that finds a path through a grid and reports how many cells it visited."],
    ],
};
