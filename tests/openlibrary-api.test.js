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


const normalDescription =
    "A family's winter isolation awakens an old evil.\n\nThe hotel remembers.";

assert.equal(
    context.cleanOpenLibraryDescription(normalDescription),
    normalDescription
);


const shiningDescription = `Jack Torrance takes a winter job at the Overlook Hotel.

---

Also contained in:

- [Carrie / Night Shift / 'Salem's Lot / Shining](https://openlibrary.org/works/OL1W)
- [Works (Danse Macabre / Salem's Lot / Shining)](https://openlibrary.org/works/OL2W)`;

assert.equal(
    context.cleanOpenLibraryDescription(shiningDescription),
    "Jack Torrance takes a winter job at the Overlook Hotel."
);


assert.equal(
    context.cleanOpenLibraryDescription(
        "King's novel [The Shining](https://openlibrary.org/works/OL45804W) " +
        "depicts the Overlook Hotel."
    ),
    "King's novel The Shining depicts the Overlook Hotel."
);


assert.equal(
    context.cleanOpenLibraryDescription(
        "The hotel has a terrible history.\n\nhttps://openlibrary.org/works/OL45804W"
    ),
    "The hotel has a terrible history."
);


assert.equal(
    context.cleanOpenLibraryDescription(
        "'Salem's Lot is threatened, and King's characters must face it."
    ),
    "'Salem's Lot is threatened, and King's characters must face it."
);


assert.equal(context.extractOpenLibraryText(undefined), "");
assert.equal(context.extractOpenLibraryText({ value: "   " }), "");
assert.equal(context.cleanOpenLibraryDescription(null), "");


[
    "See work:",
    "See work",
    "See also:",
    "N/A",
    "No description",
    "Description unavailable"
].forEach((placeholder) => {
    assert.equal(context.cleanOpenLibraryDescription(placeholder), "");
});


assert.equal(context.cleanOpenLibraryDescription("Unknown"), "");


assert.equal(
    context.cleanOpenLibraryDescription("A ghost returns."),
    "A ghost returns."
);


assert.equal(
    context.extractOpenLibraryText({
        value: "A traveler enters a remote house and encounters an unexplained presence."
    }),
    "A traveler enters a remote house and encounters an unexplained presence."
);


console.log("Open Library description-cleanup tests passed.");
