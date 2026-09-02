/* ========================================
   Crypt & Quill
   Open Library API
   ======================================== */


const OPEN_LIBRARY_SEARCH_URL =
    "https://openlibrary.org/search.json";

const OPEN_LIBRARY_COVER_URL =
    "https://covers.openlibrary.org/b/id";


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
