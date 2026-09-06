/* ========================================
   Crypt & Quill
   Open Library API
   ======================================== */


const OPEN_LIBRARY_SEARCH_URL =
    "https://openlibrary.org/search.json";

const OPEN_LIBRARY_COVER_URL =
    "https://covers.openlibrary.org/b/id";

const OPEN_LIBRARY_BASE_URL =
    "https://openlibrary.org";


/**
 * Search Open Library.
 *
 * Returns normalized work objects so the rest of
 * Crypt & Quill does not need to understand the
 * original Open Library response structure.
 */
async function searchOpenLibrary(query, limit = 24) {

    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return [];
    }


    const fields = [
        "key",
        "title",
        "author_key",
        "author_name",
        "first_publish_year",
        "cover_i",
        "edition_count",
        "subject"
    ].join(",");


    const parameters = new URLSearchParams({
        q: cleanQuery,
        fields: fields,
        limit: String(limit)
    });


    const requestURL =
        `${OPEN_LIBRARY_SEARCH_URL}?${parameters.toString()}`;


    const response = await fetch(requestURL);


    if (!response.ok) {

        throw new Error(
            `Open Library request failed with status ${response.status}`
        );

    }


    const data = await response.json();

    const documents = Array.isArray(data.docs)
        ? data.docs
        : [];


    return documents.map(normalizeOpenLibraryWork);

}



/**
 * Convert an Open Library search result into the
 * internal format used by Crypt & Quill.
 */
function normalizeOpenLibraryWork(document) {

    const authorNames =
        Array.isArray(document.author_name)
            ? document.author_name
            : [];


    const subjects =
        Array.isArray(document.subject)
            ? document.subject
            : [];


    return {

        source: "openlibrary",

        id: normalizeOpenLibraryKey(document.key),

        openLibraryKey:
            document.key || null,

        title:
            document.title || "Untitled Work",

        author:
            authorNames.length > 0
                ? authorNames.join(", ")
                : "Unknown Author",

        authorKeys:
            Array.isArray(document.author_key)
                ? document.author_key
                : [],

        year:
            document.first_publish_year || null,

        type:
            "Work",

        genres: [],

        subgenres: [],

        themes: [],

        subjects:
            subjects.slice(0, 20),

        coverId:
            document.cover_i || null,

        editionCount:
            document.edition_count || null

    };

}



/**
 * Search API keys may be returned in more than one
 * useful form. This gives Crypt & Quill a clean ID.
 */
function normalizeOpenLibraryKey(key) {

    if (!key) {
        return null;
    }


    return key
        .replace("/works/", "")
        .trim();

}



/**
 * Return an Open Library cover URL.
 *
 * default=false prevents Open Library from returning
 * its generic blank-cover image when no cover exists.
 */
function getOpenLibraryCoverURL(
    coverId,
    size = "L"
) {

    if (!coverId) {
        return null;
    }


    return (
        `${OPEN_LIBRARY_COVER_URL}/` +
        `${coverId}-${size}.jpg?default=false`
    );

}


async function getOpenLibraryWork(key) {
    const workId = normalizeOpenLibraryKey(key);

    if (!workId) {
        throw new Error("An Open Library work identifier is required.");
    }

    return fetchOpenLibraryJSON(
        `${OPEN_LIBRARY_BASE_URL}/works/${encodeURIComponent(workId)}.json`
    );
}


async function getOpenLibraryAuthor(key) {
    const authorId = String(key || "")
        .replace("/authors/", "")
        .trim();

    if (!authorId) {
        throw new Error("An Open Library author identifier is required.");
    }

    return fetchOpenLibraryJSON(
        `${OPEN_LIBRARY_BASE_URL}/authors/${encodeURIComponent(authorId)}.json`
    );
}


/**
 * Load available editions and choose a useful representative record.
 * This is automatic enrichment, not an editorial preferred edition.
 */
async function getOpenLibraryRepresentativeEdition(workKey, limit = 50) {
    const workId = normalizeOpenLibraryKey(workKey);

    if (!workId) {
        return null;
    }

    const parameters = new URLSearchParams({
        limit: String(limit)
    });

    const data = await fetchOpenLibraryJSON(
        `${OPEN_LIBRARY_BASE_URL}/works/${encodeURIComponent(workId)}` +
        `/editions.json?${parameters.toString()}`
    );

    const editions = Array.isArray(data.entries)
        ? data.entries
        : [];

    return selectRepresentativeOpenLibraryEdition(editions);
}


/**
 * Prefer complete, English-language records. Ties preserve Open Library's
 * ordering, which generally places its most useful edition candidates first.
 */
function selectRepresentativeOpenLibraryEdition(editions) {
    let selectedEdition = null;
    let selectedScore = -1;

    editions.forEach((edition) => {
        const normalizedEdition = normalizeOpenLibraryEdition(edition);
        const score = scoreOpenLibraryEdition(normalizedEdition);

        if (score > selectedScore) {
            selectedEdition = normalizedEdition;
            selectedScore = score;
        }
    });

    if (!selectedEdition || !hasOpenLibraryEditionMetadata(selectedEdition)) {
        return null;
    }

    return selectedEdition;
}


function normalizeOpenLibraryEdition(edition) {
    const languageKeys = Array.isArray(edition.languages)
        ? edition.languages.map((language) => language?.key).filter(Boolean)
        : [];

    const editionId = String(edition.key || "")
        .replace("/books/", "")
        .trim() || null;

    return {
        publisher: firstNonEmptyValue(edition.publishers),
        publishDate: edition.publish_date || null,
        isbn10: firstNonEmptyValue(edition.isbn_10),
        isbn13: firstNonEmptyValue(edition.isbn_13),
        pageCount: Number.isFinite(edition.number_of_pages)
            ? edition.number_of_pages
            : null,
        languages: languageKeys.map(formatOpenLibraryLanguage),
        editionId: editionId
    };
}


function scoreOpenLibraryEdition(edition) {
    let score = 0;

    if (edition.publisher) score += 3;
    if (edition.publishDate) score += 3;
    if (edition.isbn13) score += 4;
    if (edition.isbn10) score += 2;
    if (edition.pageCount) score += 4;
    if (edition.editionId) score += 1;
    if (edition.languages.length > 0) score += 2;
    if (edition.languages.includes("English")) score += 2;

    return score;
}


function hasOpenLibraryEditionMetadata(edition) {
    return Boolean(
        edition.publisher || edition.publishDate || edition.isbn10 ||
        edition.isbn13 || edition.pageCount || edition.languages.length > 0 ||
        edition.editionId
    );
}


function firstNonEmptyValue(values) {
    if (!Array.isArray(values)) {
        return null;
    }

    const value = values.find((item) => {
        return typeof item === "string" && item.trim();
    });

    return value ? value.trim() : null;
}


function formatOpenLibraryLanguage(key) {
    const code = String(key)
        .replace("/languages/", "")
        .trim()
        .toLowerCase();

    const languageNames = {
        eng: "English",
        fre: "French",
        fra: "French",
        ger: "German",
        deu: "German",
        ita: "Italian",
        spa: "Spanish"
    };

    return languageNames[code] || code.toUpperCase();
}


function getOpenLibraryWorkAuthorKeys(work) {
    return Array.isArray(work?.authors)
        ? work.authors.map((entry) => entry?.author?.key).filter(Boolean)
        : [];
}


function getOpenLibraryWorkCoverIds(work) {
    return Array.isArray(work?.covers)
        ? work.covers.filter(Number.isFinite)
        : [];
}


function extractOpenLibraryText(value) {
    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value?.value === "string") {
        return value.value.trim();
    }

    return "";
}


function getOpenLibraryWorkPageURL(key) {
    const workId = normalizeOpenLibraryKey(key);

    return workId
        ? `${OPEN_LIBRARY_BASE_URL}/works/${encodeURIComponent(workId)}`
        : null;
}


function getOpenLibraryEditionPageURL(editionId) {
    const cleanId = String(editionId || "")
        .replace("/books/", "")
        .trim();

    return cleanId
        ? `${OPEN_LIBRARY_BASE_URL}/books/${encodeURIComponent(cleanId)}`
        : null;
}


async function fetchOpenLibraryJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library request failed with status ${response.status}`
        );
    }

    return response.json();
}
