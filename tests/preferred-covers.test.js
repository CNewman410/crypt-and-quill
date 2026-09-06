const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


const context = {};


vm.createContext(context);
vm.runInContext(
    fs.readFileSync("assets/js/catalog.js", "utf8"),
    context
);


const preferred =
    context.normalizeCuratedWork({
        id: "cq-preferred",
        preferredCoverId: 123,
        coverId: 456
    });

assert.equal(preferred.coverId, 123);
assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(preferred)),
    [123, 456]
);


const automatic =
    context.normalizeCuratedWork({
        id: "cq-automatic",
        coverId: 456
    });

assert.equal(automatic.coverId, 456);
assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(automatic)),
    [456]
);


const external = {
    source: "openlibrary",
    coverId: 789,
    preferredCoverId: 123,
    automaticCoverId: 456
};

assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(external)),
    [789]
);


const enriched =
    context.enrichCuratedWorkFromOpenLibrary(
        preferred,
        [{
            source: "openlibrary",
            title: "Untitled Work",
            author: "Unknown Author",
            year: null,
            coverId: 999,
            openLibraryKey: "/works/OL1W"
        }]
    );

assert.equal(enriched.coverId, 123);
assert.equal(enriched.preferredCoverId, 123);
assert.equal(enriched.automaticCoverId, 999);
assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(enriched)),
    [123, 999]
);


const invalidPreferred =
    context.normalizeCuratedWork({
        id: "cq-invalid",
        preferredCoverId: "not-a-cover",
        coverId: 456
    });

assert.equal(invalidPreferred.preferredCoverId, null);
assert.equal(invalidPreferred.coverId, 456);
assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(invalidPreferred)),
    [456]
);


const noCover =
    context.normalizeCuratedWork({
        id: "cq-no-cover"
    });

assert.equal(noCover.coverId, null);
assert.deepEqual(
    Array.from(context.getWorkCoverCandidates(noCover)),
    []
);


console.log("Preferred-cover selection tests passed.");
