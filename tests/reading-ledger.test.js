const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const element = () => ({
    addEventListener() {}, appendChild() {}, append() {}, querySelector() { return element(); },
    classList: { add() {}, toggle() {} }, dataset: {}, hidden: false, disabled: false,
    setAttribute() {}, textContent: "", value: "", innerHTML: ""
});
const values = new Map();
const context = {
    console, URLSearchParams, Intl, Date,
    document: {
        addEventListener() {}, createElement: element, getElementById: element,
        querySelector: element, querySelectorAll() { return []; }
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

/* Page-count snapshots continue to use the established save path. */
context.getCurrentWorkPageCount = () => 704;
context.saveLibraryWork("cq-saved", { status: "read" });
assert.equal(context.getSavedLibraryWork("cq-saved").pageCount, 704);
context.saveLibraryPageCountSnapshot("cq-missing", 900);
assert.equal(context.getSavedLibraryWork("cq-missing"), null);

const works = [
    {
        id: "novel", title: "Long Novel", type: "Novel", author: "A. Author",
        genres: ["Horror", "Gothic"], overallRating: 4, pageCount: 500,
        status: "currently-reading",
        readingHistory: [
            { id: "old", status: "read", dateStarted: "2023", dateFinished: "2023" },
            { id: "new", status: "read", dateStarted: "2026-01", dateFinished: "2026-02-14" },
            { id: "current", status: "currently-reading", dateStarted: "2026-09" }
        ]
    },
    {
        id: "novella", title: "A Novella", type: "Novella", author: "B. Author",
        genres: ["Horror"], overallRating: 5, representativeEdition: { pageCount: 120 },
        readingHistory: [
            { id: "year-only", status: "read", dateStarted: "2024", dateFinished: "2024" },
            { id: "month-only", status: "read", dateStarted: "2026-06", dateFinished: "2026-06" },
            { id: "dnf", status: "dnf", dateStarted: "2024-03", dateAbandoned: "2024-04" }
        ]
    },
    {
        id: "story", title: "Story in a Collection", type: "Short Story", author: "C. Author",
        genres: ["Weird Fiction"], overallRating: 3, pageCount: 900,
        readingHistory: [{ id: "story-read", status: "read", dateStarted: "2026-07", dateFinished: "2026-08" }]
    },
    {
        id: "want", title: "Future Work", type: "Novel", author: "D. Author",
        genres: ["Fantasy"], overallRating: 1, pageCount: 1000,
        status: "want-to-read", readingHistory: []
    }
];

assert.deepEqual(Array.from(context.getAvailableReadingYears(works)), [2023, 2024, 2026]);
assert.equal(context.getInitialLedgerPeriod([2023, 2024, 2026], 2026), 2026);
assert.equal(context.getInitialLedgerPeriod([2023, 2024], 2026), 2024);

const ledger2026 = context.calculateReadingLedger(works, 2026);
assert.equal(ledger2026.completed, 3);
assert.equal(ledger2026.started, 4);
assert.equal(ledger2026.abandoned, 0);
assert.equal(ledger2026.monthlyCompletions[1], 1);
assert.equal(ledger2026.monthlyCompletions[5], 1);
assert.equal(ledger2026.monthlyCompletions[7], 1);
assert.equal(ledger2026.averageRating, 4);
assert.equal(ledger2026.ratedCount, 3);
assert.equal(ledger2026.approximatePages, 620);
assert.equal(ledger2026.longest.work.id, "novel");

const ledger2024 = context.calculateReadingLedger(works, 2024);
assert.equal(ledger2024.completed, 1);
assert.equal(ledger2024.started, 2);
assert.equal(ledger2024.abandoned, 1);
assert.equal(ledger2024.monthlyCompletions.reduce((sum, count) => sum + count, 0), 0);

const allTime = context.calculateReadingLedger(works, "all");
assert.equal(allTime.completed, 5);
assert.equal(allTime.started, 7);
assert.equal(allTime.abandoned, 1);
assert.equal(allTime.approximatePages, 1240);
assert.equal(allTime.ratedCount, 3); // The reread novel's current rating counts once.
assert.equal(allTime.averageRating, 4);
assert.deepEqual(
    Object.fromEntries(Array.from(allTime.completionsByYear, (entry) => [entry.label, entry.count])),
    { 2023: 1, 2024: 1, 2026: 3 }
);
assert.equal(context.getLedgerPageCount({ type: "Short Story", pageCount: 999 }), null);
assert.equal(context.getLedgerPageCount({ type: "Short Story", pageCount: 20, pageCountScope: "work" }), 20);
assert.equal(context.getLedgerPageCount({ type: "Collection", pageCount: 400 }), 400);
assert.equal(context.hasMeaningfulLedgerData([{ status: "want-to-read", readingHistory: [] }]), false);

/* The year switcher keeps its active control operable and remembers that year
 * while the user briefly views the All-Time ledger. */
const ledgerButton = (action) => ({
    dataset: { ledgerAction: action },
    disabled: false,
    textContent: "",
    attributes: {},
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; }
});
const ledgerButtons = Object.fromEntries(
    ["previous", "selected", "next", "all"].map((action) => [action, ledgerButton(action)])
);
context.document.querySelector = (selector) => {
    const match = /data-ledger-action="([^"]+)"/.exec(selector);
    return match ? ledgerButtons[match[1]] : element();
};
context.document.querySelectorAll = (selector) =>
    selector === "[data-ledger-action]" ? Object.values(ledgerButtons) : [];
context.testLedgerWorks = works;
vm.runInContext(`
    savedWorks = testLedgerWorks;
    renderReadingLedger = () => {
        renderLedgerNavigation(getAvailableReadingYears(savedWorks), selectedLedgerPeriod);
    };
    addLedgerNavigationEvents();
    selectedLedgerPeriod = 2024;
    renderReadingLedger();
`, context);

assert.equal(ledgerButtons.selected.disabled, false);
assert.equal(ledgerButtons.selected.attributes["aria-pressed"], "true");
assert.equal(ledgerButtons.selected.attributes["aria-label"], "2024 reading record selected");
assert.equal(ledgerButtons.previous.disabled, false);
assert.equal(ledgerButtons.next.disabled, false);

ledgerButtons.all.listeners.click();
assert.equal(ledgerButtons.all.attributes["aria-pressed"], "true");
assert.equal(ledgerButtons.selected.attributes["aria-pressed"], "false");
assert.equal(ledgerButtons.selected.textContent, "2024");
assert.equal(ledgerButtons.selected.dataset.ledgerYear, "2024");
assert.equal(ledgerButtons.previous.disabled, true);
assert.equal(ledgerButtons.next.disabled, true);

ledgerButtons.selected.listeners.click();
assert.equal(ledgerButtons.selected.attributes["aria-pressed"], "true");
assert.equal(ledgerButtons.all.attributes["aria-pressed"], "false");
assert.equal(ledgerButtons.selected.textContent, "2024");

vm.runInContext("selectedLedgerPeriod = 2023; renderReadingLedger();", context);
assert.equal(ledgerButtons.previous.disabled, true);
assert.equal(ledgerButtons.next.disabled, false);
ledgerButtons.next.listeners.click();
assert.equal(ledgerButtons.selected.textContent, "2024");

vm.runInContext("selectedLedgerPeriod = 2026; renderReadingLedger();", context);
assert.equal(ledgerButtons.previous.disabled, false);
assert.equal(ledgerButtons.next.disabled, true);

console.log("Reading Ledger year, All-Time, partial-date, rating, and safe-page tests passed.");
