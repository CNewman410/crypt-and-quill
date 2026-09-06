const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");


const context = {
    URLSearchParams,
    fetch: async () => {
        throw new Error("Network access is not expected in mocked tests.");
    }
};


vm.createContext(context);
vm.runInContext(
    fs.readFileSync("assets/js/openlibrary-api.js", "utf8"),
    context
);


const metadataRichAudiobook = {
    key: "/books/OL-AUDIO-M",
    publishers: ["Listening Library"],
    publish_date: "2020",
    isbn_10: ["1234567890"],
    isbn_13: ["9781234567890"],
    number_of_pages: 700,
    languages: [{ key: "/languages/eng" }],
    physical_format: "Audio CD"
};

const reasonablePrintEdition = {
    key: "/books/OL-PRINT-M",
    publishers: ["Archive Press"],
    publish_date: "2012",
    isbn_13: ["9780987654321"],
    number_of_pages: 500,
    languages: [{ key: "/languages/eng" }],
    physical_format: "Hardcover"
};


const selectedEdition =
    context.selectRepresentativeOpenLibraryEdition([
        metadataRichAudiobook,
        reasonablePrintEdition
    ]);

assert.equal(selectedEdition.editionId, "OL-PRINT-M");
assert.equal(selectedEdition.physicalFormat, "Hardcover");


const sparsePrintEdition = {
    key: "/books/OL-SPARSE-PRINT-M",
    physical_format: "Paperback"
};

assert.equal(
    context.selectRepresentativeOpenLibraryEdition([
        sparsePrintEdition,
        reasonablePrintEdition
    ]).editionId,
    "OL-PRINT-M"
);


const ebook = {
    ...reasonablePrintEdition,
    key: "/books/OL-EBOOK-M",
    physical_format: "eBook"
};

assert.equal(
    context.selectRepresentativeOpenLibraryEdition([
        ebook,
        reasonablePrintEdition
    ]).editionId,
    "OL-PRINT-M"
);


assert.equal(
    context.selectRepresentativeOpenLibraryEdition([
        metadataRichAudiobook
    ]).editionId,
    "OL-AUDIO-M"
);


assert.ok(
    context.scoreOpenLibraryEdition(
        context.normalizeOpenLibraryEdition(reasonablePrintEdition)
    ) >
    context.scoreOpenLibraryEdition(
        context.normalizeOpenLibraryEdition(metadataRichAudiobook)
    )
);


console.log("Open Library representative-edition format tests passed.");
