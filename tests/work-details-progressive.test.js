const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


function loadScript(file, context) {
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(file, "utf8"), context);
}


const modelContext = {};
loadScript("assets/js/catalog.js", modelContext);

const apiContext = { URLSearchParams };
loadScript("assets/js/openlibrary-api.js", apiContext);

const curatedDescription =
    "A concise description controlled by Crypt & Quill.";

const normalized = modelContext.normalizeCuratedWork({
    id: "cq-description-test",
    description: `  ${curatedDescription}  `,
    preferredCoverId: 123
});

assert.equal(normalized.description, curatedDescription);
assert.equal(normalized.coverId, 123);


const element = () => ({
    hidden: false,
    children: [],
    appendChild(child) {
        this.children.push(child);
    },
    addEventListener() {},
    innerHTML: "",
    textContent: ""
});

const elements = new Map();
const document = {
    title: "",
    addEventListener() {},
    createElement: element,
    getElementById(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
    }
};


const detailsContext = {
    URLSearchParams,
    console: { error() {}, warn() {} },
    document,
    window: { location: { search: "" } },
    normalizeOpenLibraryCoverId: modelContext.normalizeOpenLibraryCoverId,
    normalizeOpenLibraryKey: (key) => String(key).replace("/works/", ""),
    getOpenLibraryWorkAuthorKeys: () => [],
    getOpenLibraryWorkCoverIds: (work) => work?.covers || [],
    extractOpenLibraryText: apiContext.extractOpenLibraryText,
    getWorkCoverCandidates: modelContext.getWorkCoverCandidates,
    getOpenLibraryCoverURL: (id) => `cover:${id}`,
    getOpenLibraryEditionPageURL: () => null,
    getOpenLibraryWorkPageURL: () => null,
    storageGetEntry: () => ({}),
    storageGetRatings: () => ({}),
    storageCalculateOverallRating: () => null,
    storageGetReview: () => null
};

loadScript("assets/js/work-details.js", detailsContext);


const curatedModel = {
    ...normalized,
    source: "crypt-and-quill",
    title: "Description Test",
    subjects: [],
    openLibraryKey: "/works/OL1W"
};

const authoritativeModel = detailsContext.createCuratedDetailsModel(
    curatedModel,
    { description: "Open Library description", covers: [456] },
    null
);

assert.equal(authoritativeModel.description, curatedDescription);
assert.equal(authoritativeModel.coverId, 123);

const fallbackModel = detailsContext.createCuratedDetailsModel(
    { ...curatedModel, description: null },
    {
        description:
            "Cleaned Open Library fallback.\n\n" +
            "Also contained in:\n\n- [Collection](https://openlibrary.org/works/OL2W)",
        covers: []
    },
    null
);

assert.equal(fallbackModel.description, "Cleaned Open Library fallback.");


const works = JSON.parse(fs.readFileSync("data/works.json", "utf8"));
const willows = modelContext.normalizeCuratedWork(
    works.find((work) => work.id === "cq-the-willows")
);

assert.match(willows.description, /Two travelers canoeing down the Danube/);
assert.doesNotMatch(willows.description, /espa[nñ]ol/i);


function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, reject, resolve };
}


async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}


async function testProgressiveRequests() {
    const work = deferred();
    const edition = deferred();
    const events = [];

    detailsContext.searchOpenLibrary = async () => [{
        source: "openlibrary",
        title: "Progressive Work",
        author: "Archive Author",
        year: 1900,
        coverId: 789,
        openLibraryKey: "/works/OL789W",
        authorKeys: [],
        subjects: []
    }];
    detailsContext.enrichCuratedWorkFromOpenLibrary =
        modelContext.enrichCuratedWorkFromOpenLibrary;
    detailsContext.renderCover = (value) => events.push(`cover:${value.coverId}`);
    detailsContext.renderOpenLibraryLink = () => {};
    detailsContext.renderDescription = (value) => {
        events.push(`description:${value.description}`);
    };
    detailsContext.renderSubjects = () => {};
    detailsContext.renderEditionMetadata = (value) => {
        events.push(`edition:${value?.editionId || "none"}`);
    };
    detailsContext.getOpenLibraryWork = () => {
        events.push("work-started");
        return work.promise;
    };
    detailsContext.loadRepresentativeEdition = () => {
        events.push("edition-started");
        return edition.promise;
    };

    const loading = detailsContext.progressivelyEnrichCuratedWork({
        source: "crypt-and-quill",
        id: "cq-progressive",
        title: "Progressive Work",
        author: "Archive Author",
        year: 1900,
        description: null,
        preferredCoverId: null,
        automaticCoverId: null,
        coverId: null,
        openLibraryKey: null,
        subjects: []
    });

    await flushPromises();
    assert.deepEqual(events.slice(0, 3), [
        "cover:789",
        "work-started",
        "edition-started"
    ]);

    work.resolve({
        description: "Work description arrived.",
        covers: [789],
        subjects: []
    });
    await flushPromises();
    assert.ok(events.includes("description:Work description arrived."));
    assert.ok(!events.some((event) => event.startsWith("edition:")));

    edition.resolve({ editionId: "OL-EDITION-M" });
    await loading;
    assert.ok(events.includes("edition:OL-EDITION-M"));
}


async function testEditionFailureDoesNotBlockWork() {
    const events = [];
    detailsContext.getOpenLibraryWork = async () => ({
        description: "Independent work description.",
        covers: [321],
        subjects: []
    });
    detailsContext.loadRepresentativeEdition = async () => null;
    detailsContext.renderCover = (value) => events.push(`cover:${value.coverId}`);
    detailsContext.renderDescription = (value) => events.push(value.description);
    detailsContext.renderEditionMetadata = () => events.push("edition-fallback");

    await detailsContext.progressivelyEnrichCuratedWork({
        ...curatedModel,
        description: null,
        preferredCoverId: null,
        automaticCoverId: null,
        coverId: null
    });

    assert.ok(events.includes("Independent work description."));
    assert.ok(events.includes("cover:321"));
    assert.ok(events.includes("edition-fallback"));
}


async function testExternalModelStillWorks() {
    const external = detailsContext.createExternalDetailsModel(
        {
            key: "/works/OL-EXTERNAL-W",
            title: "External Work",
            first_publish_date: "1999",
            description: "External description.",
            covers: [999],
            subjects: ["Horror"]
        },
        [{ name: "External Author" }],
        { editionId: "OL-EXTERNAL-M" }
    );

    assert.equal(external.title, "External Work");
    assert.equal(external.author, "External Author");
    assert.equal(external.description, "External description.");
    assert.equal(external.coverId, 999);
    assert.equal(external.representativeEdition.editionId, "OL-EXTERNAL-M");
}


async function testExistingKeySkipsSearch() {
    let searches = 0;
    let workRequests = 0;
    let editionRequests = 0;

    detailsContext.searchOpenLibrary = async () => {
        searches += 1;
        return [];
    };
    detailsContext.getOpenLibraryWork = async () => {
        workRequests += 1;
        return { covers: [], subjects: [] };
    };
    detailsContext.loadRepresentativeEdition = async () => {
        editionRequests += 1;
        return null;
    };

    await detailsContext.progressivelyEnrichCuratedWork(curatedModel);

    assert.equal(searches, 0);
    assert.equal(workRequests, 1);
    assert.equal(editionRequests, 1);
}


Promise.resolve()
    .then(testProgressiveRequests)
    .then(testEditionFailureDoesNotBlockWork)
    .then(testExternalModelStillWorks)
    .then(testExistingKeySkipsSearch)
    .then(() => {
        console.log("Work Details progressive-enrichment tests passed.");
    });
