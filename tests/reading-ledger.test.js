const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


const element = () => ({
    addEventListener() {},
    appendChild() {},
    classList: { add() {}, toggle() {} },
    dataset: {},
    hidden: false,
    setAttribute() {},
    textContent: "",
    value: ""
});

const values = new Map();
const context = {
    console,
    URLSearchParams,
    document: {
        addEventListener() {},
        createElement: element,
        getElementById: element,
        querySelectorAll() { return []; }
    },
    localStorage: {
        getItem(key) { return values.get(key) || null; },
        setItem(key, value) { values.set(key, value); }
    },
    window: { location: { search: "" } }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("assets/js/storage.js", "utf8"), context);
vm.runInContext(fs.readFileSync("assets/js/my-library.js", "utf8"), context);


/* Use the same save path as the Work Details controls. */
context.getCurrentWorkPageCount = () => 704;
context.saveLibraryWork("cq-one", {
    status: "read",
    overallRating: 4,
    readingHistory: [{ status: "read", dateStarted: "2026-01-01", dateFinished: "2026-01-10" }]
});
const normallySavedWork = context.getSavedLibraryWork("cq-one");
assert.equal(normallySavedWork.pageCount, 704);
context.saveLibraryPageCountSnapshot("cq-missing", 900);
assert.equal(context.getSavedLibraryWork("cq-missing"), null);
context.saveLibraryWork("cq-temporary", { status: "read" });
context.saveLibraryWork("cq-temporary", { status: null });
assert.equal(context.getSavedLibraryWork("cq-temporary"), null);


const ledger = context.calculateReadingLedger([
    {
        ...normallySavedWork,
        title: "First Work",
        author: "A. Author",
        genres: ["Horror", "Gothic"],
    },
    {
        id: "cq-two",
        title: "Second Work",
        author: "A. Author",
        genres: ["Horror"],
        overallRating: 5,
        representativeEdition: { pageCount: 450 },
        status: "currently-reading",
        readingHistory: [
            { status: "read", dateStarted: "2025", dateFinished: "2025" },
            { status: "read", dateStarted: "2024-04", dateFinished: "2024-05" },
            { status: "dnf", dateStarted: "2026-02", dateAbandoned: "2026-03" }
        ]
    },
    {
        id: "cq-three",
        title: "Undated Work",
        author: "B. Author",
        genres: [],
        status: "read",
        readingHistory: []
    },
    {
        id: "cq-want",
        title: "Future Work",
        author: "C. Author",
        genres: ["Fantasy"],
        status: "want-to-read",
        overallRating: 1,
        readingHistory: []
    }
], 2026);

assert.equal(ledger.completed, 4);
assert.equal(ledger.started, 5);
assert.equal(ledger.abandoned, 1);
assert.equal(ledger.current, 1);
assert.equal(ledger.completedThisYear, 1);
assert.equal(ledger.monthlyCompletions[0], 1);
assert.equal(ledger.genres[0].label, "Horror");
assert.equal(ledger.genres[0].count, 3);
assert.equal(ledger.authors[0].label, "A. Author");
assert.equal(ledger.authors[0].count, 3);
assert.equal(ledger.averageRating, 4.5);
assert.equal(ledger.ratedCount, 2);
assert.equal(ledger.approximatePages, 1604);
assert.equal(ledger.longest.work.title, "First Work");
assert.equal(context.hasMeaningfulLedgerData([{ status: "want-to-read", readingHistory: [] }]), false);
assert.equal(context.hasMeaningfulLedgerData([{ status: "read", readingHistory: [] }]), true);

console.log("Reading Ledger totals, classifications, ratings, pages, and monthly records passed.");
