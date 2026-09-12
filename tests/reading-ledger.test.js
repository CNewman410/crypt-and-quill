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

const context = {
    console,
    URLSearchParams,
    document: {
        addEventListener() {},
        createElement: element,
        getElementById: element,
        querySelectorAll() { return []; }
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    window: { location: { search: "" } }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("assets/js/storage.js", "utf8"), context);
vm.runInContext(fs.readFileSync("assets/js/my-library.js", "utf8"), context);

const ledger = context.calculateReadingLedger([
    {
        id: "cq-one",
        title: "First Work",
        author: "A. Author",
        genres: ["Horror", "Gothic"],
        overallRating: 4,
        pageCount: 200,
        status: "read",
        readingHistory: [{ status: "read", dateStarted: "2026-01-01", dateFinished: "2026-01-10" }]
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
    }
], 2026);

assert.equal(ledger.completed, 3);
assert.equal(ledger.started, 4);
assert.equal(ledger.abandoned, 1);
assert.equal(ledger.current, 1);
assert.equal(ledger.completedThisYear, 1);
assert.equal(ledger.monthlyCompletions[0], 1);
assert.equal(ledger.genres[0].label, "Horror");
assert.equal(ledger.genres[0].count, 2);
assert.equal(ledger.authors[0].label, "A. Author");
assert.equal(ledger.averageRating, 4.5);
assert.equal(ledger.approximatePages, 650);
assert.equal(ledger.longest.work.title, "Second Work");

console.log("Reading Ledger totals, classifications, ratings, pages, and monthly records passed.");
