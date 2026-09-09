const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


function createStorageContext(initialLibrary = {}) {
    const values = new Map([
        ["cryptAndQuill.library.v1", JSON.stringify(initialLibrary)]
    ]);
    const inputs = {};
    const element = () => ({
        addEventListener() {},
        classList: { toggle() {} },
        dataset: {},
        focus() {},
        setAttribute() {},
        textContent: "",
        value: ""
    });
    const document = {
        addEventListener() {},
        getElementById() {
            return element();
        },
        querySelector(selector) {
            const match = selector.match(/data-reading-date="([^"]+)"/);
            if (!match) return null;
            inputs[match[1]] ||= element();
            return inputs[match[1]];
        },
        querySelectorAll() {
            return [];
        }
    };
    const context = {
        URLSearchParams,
        console,
        document,
        localStorage: {
            getItem(key) {
                return values.get(key) || null;
            },
            setItem(key, value) {
                values.set(key, value);
            }
        },
        window: { location: { search: "?id=cq-test" } }
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync("assets/js/storage.js", "utf8"), context);
    return { context, inputs, values };
}


const legacy = {
    "cq-test": {
        id: "cq-test",
        status: "currently-reading",
        favorite: true,
        ratings: { writing: 4.5 },
        review: "Still unsettling.",
        dateStarted: "2026-09",
        dateFinished: null,
        dateAbandoned: null
    },
    "cq-date-only": {
        id: "cq-date-only",
        dateFinished: "1999"
    }
};
const migrated = createStorageContext(legacy);
const firstRead = migrated.context.getPersonalLibrary()["cq-test"];
assert.equal(firstRead.readingHistory.length, 1);
assert.equal(firstRead.readingHistory[0].dateStarted, "2026-09");
assert.equal(firstRead.status, "currently-reading");
assert.equal(firstRead.favorite, true);
assert.equal(firstRead.ratings.writing, 4.5);
assert.equal(firstRead.review, "Still unsettling.");
const dateOnly = migrated.context.getPersonalLibrary()["cq-date-only"];
assert.equal(dateOnly.readingHistory.length, 1);
assert.equal(dateOnly.readingHistory[0].status, "read");
assert.equal(dateOnly.readingHistory[0].dateFinished, "1999");

const firstSessionId = firstRead.readingHistory[0].id;
const secondRead = migrated.context.getPersonalLibrary()["cq-test"];
assert.equal(secondRead.readingHistory.length, 1);
assert.equal(secondRead.readingHistory[0].id, firstSessionId);

migrated.inputs.dateStarted = { value: "", focus() {} };
migrated.inputs.dateFinished = { value: "", focus() {} };
migrated.inputs.dateAbandoned = { value: "", focus() {} };
migrated.context.saveReadingDates("cq-date-only");
assert.equal(migrated.context.getSavedLibraryWork("cq-date-only"), null);


["2026", "2026-09", "2026-09-14"].forEach((value) => {
    assert.equal(migrated.context.isValidReadingDate(value), true);
});
["", "2026-13", "2026-02-30", "09/14/2026"].forEach((value) => {
    assert.equal(migrated.context.isValidReadingDate(value), false);
});
assert.equal(migrated.context.getReadingDatePrecision("2026"), "year");
assert.equal(migrated.context.getReadingDatePrecision("2026-09"), "month");
assert.equal(migrated.context.getReadingDatePrecision("2026-09-14"), "day");
assert.equal(migrated.context.getReadingDatePrecision("invalid"), null);

const localDate = new Date(2026, 8, 3, 23, 30);
assert.equal(migrated.context.getLocalReadingDate(localDate), "2026-09-03");
migrated.inputs.dateStarted = { value: "old", focus() {} };
migrated.inputs.dateFinished = { value: "keep", focus() {} };
migrated.context.getLocalReadingDate = () => "2026-09-03";
migrated.context.applyReadingDateAction({
    dataset: { readingDateAction: "today", readingDateTarget: "dateStarted" }
});
assert.equal(migrated.inputs.dateStarted.value, "2026-09-03");
migrated.context.applyReadingDateAction({
    dataset: { readingDateAction: "clear", readingDateTarget: "dateStarted" }
});
assert.equal(migrated.inputs.dateStarted.value, "");
assert.equal(migrated.inputs.dateFinished.value, "keep");


migrated.inputs.dateStarted.value = "2026-09-03";
migrated.inputs.dateFinished.value = "";
migrated.inputs.dateAbandoned = { value: "", focus() {} };
migrated.context.saveReadingDates("cq-test");
migrated.context.saveReadingDates("cq-test");
let saved = migrated.context.getSavedLibraryWork("cq-test");
assert.equal(saved.readingHistory.length, 1);
assert.equal(saved.readingHistory[0].dateStarted, "2026-09-03");


const emptyStatus = createStorageContext();
emptyStatus.context.setReadingStatus("cq-test", "currently-reading");
assert.equal(
    emptyStatus.context.getSavedLibraryWork("cq-test").readingHistory.length,
    1
);
emptyStatus.context.setReadingStatus("cq-test", "currently-reading");
assert.equal(emptyStatus.context.getSavedLibraryWork("cq-test"), null);


const datedStatus = createStorageContext({
    "cq-test": {
        id: "cq-test",
        status: "currently-reading",
        dateStarted: "2026-09"
    }
});
const datedSessionId = datedStatus.context
    .getSavedLibraryWork("cq-test").readingHistory[0].id;
datedStatus.context.setReadingStatus("cq-test", "currently-reading");
const preservedDatedWork = datedStatus.context.getSavedLibraryWork("cq-test");
assert.equal(preservedDatedWork.status, null);
assert.equal(preservedDatedWork.readingHistory.length, 1);
assert.equal(preservedDatedWork.readingHistory[0].id, datedSessionId);
assert.equal(preservedDatedWork.readingHistory[0].status, "currently-reading");
assert.equal(preservedDatedWork.readingHistory[0].dateStarted, "2026-09");

migrated.context.setReadingStatus("cq-test", "read");
saved = migrated.context.getSavedLibraryWork("cq-test");
assert.equal(saved.readingHistory.length, 1);
assert.equal(saved.readingHistory[0].status, "read");
assert.equal(saved.readingHistory[0].dateStarted, "2026-09-03");
assert.equal(
    migrated.context.storageGetCompletedReadingSessions()
        .some((session) => session.workId === "cq-test"),
    true
);

migrated.context.setReadingStatus("cq-test", "dnf");
saved = migrated.context.getSavedLibraryWork("cq-test");
assert.equal(saved.readingHistory[0].status, "dnf");
assert.equal(saved.readingHistory[0].dateStarted, "2026-09-03");

assert.equal(migrated.context.hasSavedPersonalData({
    readingHistory: [{
        id: "session-only",
        status: "read",
        dateStarted: null,
        dateFinished: "2026",
        dateAbandoned: null
    }]
}), true);


const libraryDocument = {
    addEventListener() {},
    getElementById() {
        return { addEventListener() {} };
    },
    querySelectorAll() {
        return [];
    }
};
const libraryContext = {
    document: libraryDocument,
    getSavedLibraryWorks: () => []
};
vm.createContext(libraryContext);
vm.runInContext(fs.readFileSync("assets/js/my-library.js", "utf8"), libraryContext);
const filterWorks = [
    { id: "want", status: "want-to-read" },
    { id: "current", status: "currently-reading" },
    { id: "read", status: "read" },
    { id: "dnf", status: "dnf" },
    { id: "favorite", favorite: true }
];
[
    ["all", 5],
    ["want-to-read", 1],
    ["currently-reading", 1],
    ["read", 1],
    ["dnf", 1],
    ["favorites", 1]
].forEach(([filter, count]) => {
    vm.runInContext(`activeLibraryFilter = "${filter}"`, libraryContext);
    assert.equal(libraryContext.filterLibraryWorks(filterWorks).length, count);
});


console.log("Reading-history migration, date UX, session, and filter tests passed.");
