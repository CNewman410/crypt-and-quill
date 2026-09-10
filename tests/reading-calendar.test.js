const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


function loadScripts(library, now = new Date(2026, 8, 10, 12)) {
    const values = new Map([
        ["cryptAndQuill.library.v1", JSON.stringify(library)]
    ]);
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
        localStorage: {
            getItem(key) { return values.get(key) || null; },
            setItem(key, value) { values.set(key, value); }
        },
        window: { location: { search: "" } }
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync("assets/js/storage.js", "utf8"), context);
    vm.runInContext(fs.readFileSync("assets/js/my-library.js", "utf8"), context);
    context.currentMonth = context.getLocalCalendarMonth(now);
    return context;
}


const context = loadScripts({
    "cq-shining": {
        id: "cq-shining",
        title: "The Shining",
        readingHistory: [
            {
                id: "first-read",
                status: "read",
                dateStarted: "2026-09-02",
                dateFinished: "2026-09-08",
                dateAbandoned: null
            },
            {
                id: "reread",
                status: "dnf",
                dateStarted: "2026-09-08",
                dateFinished: null,
                dateAbandoned: "2026-09-14"
            }
        ]
    },
    "ol:OL123W": {
        id: "ol:OL123W",
        title: "Between Two Fires",
        readingHistory: [{
            id: "approximate",
            status: "read",
            dateStarted: "2026-09",
            dateFinished: "2026",
            dateAbandoned: null
        }]
    }
});

const events = context.storageGetReadingEvents();
const month = context.getCalendarEventsForMonth(events, 2026, 8);

assert.equal(month.exact.some((event) => event.eventType === "started" && event.date === "2026-09-02"), true);
assert.equal(month.exact.some((event) => event.eventType === "finished" && event.date === "2026-09-08"), true);
assert.equal(month.exact.some((event) => event.eventType === "dnf" && event.date === "2026-09-14"), true);
assert.equal(month.approximate.some((event) => event.date === "2026-09"), true);
assert.equal(month.exact.some((event) => event.date === "2026-09"), false);
assert.equal(month.hasYearOnly, true);
assert.equal(month.exact.some((event) => event.date === "2026"), false);
assert.equal(events.filter((event) => event.workId === "cq-shining").length, 4);
assert.equal(month.exact.filter((event) => event.date === "2026-09-08").length, 2);
assert.equal(context.getReadingEventWorkURL("cq-shining"), "work-details.html?id=cq-shining");
assert.equal(context.getReadingEventWorkURL("ol:OL123W"), "work-details.html?ol=OL123W");
assert.equal(context.currentMonth.year, 2026);
assert.equal(context.currentMonth.month, 8);
const previous = context.getCalendarNavigationMonth({ year: 2026, month: 0 }, "previous");
const next = context.getCalendarNavigationMonth({ year: 2026, month: 11 }, "next");
assert.equal(previous.year, 2025);
assert.equal(previous.month, 11);
assert.equal(next.year, 2027);
assert.equal(next.month, 0);

console.log("Reading Calendar event, precision, link, and navigation tests passed.");
