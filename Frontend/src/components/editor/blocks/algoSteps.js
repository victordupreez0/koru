/**
 * Step-by-step frames for the algorithm animation block.
 * Positions in notes and pseudocode count from 1, like the textbooks; indexes in frames count from 0.
 */

export const ALGORITHMS = {
    bubble: {
        label: "Bubble sort",
        kind: "sort",
        pseudocode: [
            "For pass = 1 to n - 1",
            "  For i = 1 to n - pass",
            "    If list[i] > list[i + 1] then",
            "      Swap list[i] and list[i + 1]",
            "Display the sorted list",
        ],
    },
    selection: {
        label: "Selection sort",
        kind: "sort",
        pseudocode: [
            "For i = 1 to n - 1",
            "  Set smallest to i",
            "  For j = i + 1 to n",
            "    If list[j] < list[smallest] then",
            "      Set smallest to j",
            "  Swap list[i] and list[smallest]",
            "Display the sorted list",
        ],
    },
    insertion: {
        label: "Insertion sort",
        kind: "sort",
        pseudocode: [
            "For i = 2 to n",
            "  Set j to i",
            "  While j > 1 and list[j - 1] > list[j]",
            "    Swap list[j - 1] and list[j]",
            "    Set j to j - 1",
            "Display the sorted list",
        ],
    },
    linear: {
        label: "Linear search",
        kind: "search",
        pseudocode: [
            "For i = 1 to n",
            "  If list[i] = target then",
            "    Display \"Found at position\", i",
            "    Stop",
            "Display \"Not in the list\"",
        ],
    },
    binary: {
        label: "Binary search",
        kind: "search",
        pseudocode: [
            "Sort the list",
            "Set low to 1 and high to n",
            "While low <= high",
            "  Set mid to (low + high) div 2",
            "  If list[mid] = target then",
            "    Display \"Found at position\", mid",
            "  Else if list[mid] < target then",
            "    Set low to mid + 1",
            "  Else",
            "    Set high to mid - 1",
            "Display \"Not in the list\"",
        ],
    },
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Frames: { array, ids, compare, swapped, sorted, range, mid, found, line, note, comparisons, swaps }.
 * `ids` follows each number as it moves, so the view can slide bars instead of redrawing them.
 */
export function buildSteps(algorithm, data, target) {
    const kind = ALGORITHMS[algorithm] ? algorithm : "bubble";
    let array = [...data];
    let ids = array.map((_, i) => i);
    let comparisons = 0;
    let swaps = 0;
    let sorted = [];
    const frames = [];
    const n = array.length;
    const push = (line, note, extra = {}) => frames.push({
        array: [...array], ids: [...ids], compare: [], swapped: false, sorted: [...sorted],
        range: null, mid: null, found: null, line, note, comparisons, swaps, ...extra,
    });
    const swap = (a, b) => {
        [array[a], array[b]] = [array[b], array[a]];
        [ids[a], ids[b]] = [ids[b], ids[a]];
        swaps++;
    };
    const done = (line) => {
        sorted = array.map((_, i) => i);
        push(line, `Sorted in ${plural(comparisons, "comparison", "comparisons")} and ${plural(swaps, "swap", "swaps")}.`);
    };

    if (kind === "bubble") {
        push(0, "Bubble sort compares each pair of neighbours and swaps them if they are in the wrong order.");
        for (let pass = 0; pass < n - 1; pass++) {
            for (let i = 0; i < n - 1 - pass; i++) {
                const [a, b] = [array[i], array[i + 1]];
                comparisons++;
                if (a > b) {
                    push(2, `Compare ${a} and ${b}. ${a} is bigger, so they swap.`, { compare: [i, i + 1] });
                    swap(i, i + 1);
                    push(3, `${b} and ${a} swap places.`, { compare: [i, i + 1], swapped: true });
                } else {
                    push(2, `Compare ${a} and ${b}. They are already in order, so nothing changes.`, { compare: [i, i + 1] });
                }
            }
            sorted = [...sorted, n - 1 - pass];
            push(1, `End of pass ${pass + 1}. ${array[n - 1 - pass]} is now in its final place.`);
        }
        done(4);
    } else if (kind === "selection") {
        push(0, "Selection sort finds the smallest number that is left and swaps it to the front.");
        for (let i = 0; i < n - 1; i++) {
            let smallest = i;
            push(1, `Start at position ${i + 1}. For now, ${array[i]} is the smallest.`, { compare: [i] });
            for (let j = i + 1; j < n; j++) {
                comparisons++;
                if (array[j] < array[smallest]) {
                    push(4, `Is ${array[j]} smaller than ${array[smallest]}? Yes, so ${array[j]} is the new smallest.`, { compare: [smallest, j] });
                    smallest = j;
                } else {
                    push(3, `Is ${array[j]} smaller than ${array[smallest]}? No, keep looking.`, { compare: [smallest, j] });
                }
            }
            sorted = [...sorted, i];
            if (smallest !== i) {
                const [a, b] = [array[i], array[smallest]];
                swap(i, smallest);
                push(5, `Swap ${b} into position ${i + 1}. ${a} moves to where ${b} was.`, { compare: [i, smallest], swapped: true });
            } else {
                push(5, `${array[i]} is already in the right place, so no swap is needed.`);
            }
        }
        done(6);
    } else if (kind === "insertion") {
        push(0, "Insertion sort takes each number in turn and slides it left until it fits.");
        for (let i = 1; i < n; i++) {
            let j = i;
            push(1, `Take ${array[i]} and find where it fits in the part on its left.`, { compare: [i] });
            while (j > 0) {
                const [a, b] = [array[j - 1], array[j]];
                comparisons++;
                if (a <= b) {
                    push(2, `Compare ${a} and ${b}. ${b} is not smaller, so it stays here.`, { compare: [j - 1, j] });
                    break;
                }
                push(2, `Compare ${a} and ${b}. ${a} is bigger, so ${b} moves left.`, { compare: [j - 1, j] });
                swap(j - 1, j);
                push(3, `${b} and ${a} swap places.`, { compare: [j - 1, j], swapped: true });
                j--;
            }
            if (j === 0) push(4, `${array[0]} has reached the front of the list.`, { compare: [0] });
        }
        done(5);
    } else if (kind === "linear") {
        push(0, `Look for ${target} by checking each number, starting at the front.`, { range: [0, n - 1] });
        for (let i = 0; i < n; i++) {
            comparisons++;
            if (array[i] === target) {
                push(2, `Found ${target} at position ${i + 1} after ${plural(comparisons, "check", "checks")}.`, { compare: [i], found: i, range: [i, n - 1] });
                return frames;
            }
            push(1, `Is ${array[i]} equal to ${target}? No, move on.`, { compare: [i], range: [i, n - 1] });
        }
        push(4, `${target} is not in the list. All ${n} numbers were checked.`, { range: [n, n - 1] });
    } else {
        push(0, "Binary search only works on a sorted list, so first the numbers are sorted.");
        const order = array.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
        array = order.map(([v]) => v);
        ids = order.map(([, i]) => i);
        let low = 0;
        let high = n - 1;
        push(1, `Now the list is sorted. Search all of it, from position 1 to ${n}.`, { range: [low, high] });
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const value = array[mid];
            comparisons++;
            push(3, `The middle is position ${mid + 1}, which holds ${value}.`, { range: [low, high], mid, compare: [mid] });
            if (value === target) {
                push(5, `Found ${target} at position ${mid + 1} after ${plural(comparisons, "check", "checks")}.`, { range: [low, high], mid, found: mid });
                return frames;
            }
            if (value < target) {
                low = mid + 1;
                push(7, `${value} is smaller than ${target}, so ${target} can only be on the right. The left half is ruled out.`, { range: [low, high], mid });
            } else {
                high = mid - 1;
                push(9, `${value} is bigger than ${target}, so ${target} can only be on the left. The right half is ruled out.`, { range: [low, high], mid });
            }
        }
        push(10, `${target} is not in the list.`, { range: [low, high] });
    }
    return frames;
}
