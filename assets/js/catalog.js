/* ========================================
   Crypt & Quill
   Catalog
   ======================================== */


/* ========================================
   SEARCH SETTINGS
   ======================================== */

const SEARCH_STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "in",
    "is",
    "of",
    "the",
    "to"
]);



/* ========================================
   LOAD CURATED WORKS
   ======================================== */

/**
 * Load the curated Crypt & Quill catalog.
 */
async function loadCuratedWorks() {

    const response = await fetch("data/works.json");


    if (!response.ok) {

        throw new Error(
            "Could not load the Crypt & Quill catalog."
        );

    }


    const works = await response.json();


    if (!Array.isArray(works)) {
        return [];
    }


    return works.map(normalizeCuratedWork);

}



/**
 * Give curated records a consistent structure.
 */
function normalizeCuratedWork(work) {

    return {

        source: "crypt-and-quill",

        id:
            work.id || null,

        title:
            work.title || "Untitled Work",

        author:
            work.author || "Unknown Author",

        year:
            work.year || null,

        type:
            work.type || "Work",

        genres:
            Array.isArray(work.genres)
                ? work.genres
                : [],

        subgenres:
            Array.isArray(work.subgenres)
                ? work.subgenres
                : [],

        themes:
            Array.isArray(work.themes)
                ? work.themes
                : [],

        searchAliases:
            Array.isArray(work.searchAliases)
                ? work.searchAliases
                : [],

        relationships:
            work.relationships &&
            typeof work.relationships === "object"
                ? work.relationships
                : {},

        subjects: [],

        coverId:
            work.coverId || null,

        openLibraryKey:
            work.openLibraryKey || null,

        authorKeys: [],

        editionCount: null

    };

}



/* ========================================
   CURATED SEARCH
   ======================================== */

/**
 * Search Crypt & Quill's own curated metadata.
 *
 * This can match:
 * - title
 * - author
 * - aliases
 * - genre
 * - subgenre
 * - theme
 * - work type
 */
function findCuratedMatches(
    works,
    query
) {

    const normalizedQuery =
        normalizeSearchText(query);

    const queryWords =
        getSearchWords(query);


    if (!normalizedQuery) {
        return [];
    }


    const scoredWorks =
        works.map((work) => {

            const score =
                scoreCuratedWork(
                    work,
                    normalizedQuery,
                    queryWords
                );


            return {
                work,
                score
            };

        });


    return scoredWorks
        .filter((entry) => {

            return entry.score >= 30;

        })
        .sort((a, b) => {

            return b.score - a.score;

        })
        .map((entry) => {

            return entry.work;

        });

}



/**
 * Score how well a curated work matches the query.
 */
function scoreCuratedWork(
    work,
    normalizedQuery,
    queryWords
) {

    const normalizedTitle =
        normalizeSearchText(work.title);

    const normalizedAuthor =
        normalizeSearchText(work.author);

    const aliases =
        work.searchAliases.map(
            normalizeSearchText
        );


    const searchableText =
        getCuratedSearchText(work);


    let score = 0;


    /*
     * Exact title match.
     */
    if (
        normalizedTitle ===
        normalizedQuery
    ) {
        score += 150;
    }


    /*
     * Query contains the complete title.
     */
    if (
        normalizedQuery.includes(
            normalizedTitle
        )
    ) {
        score += 100;
    }


    /*
     * Title contains the query.
     */
    if (
        normalizedTitle.includes(
            normalizedQuery
        )
    ) {
        score += 90;
    }


    /*
     * Exact author search.
     */
    if (
        normalizedAuthor ===
        normalizedQuery
    ) {
        score += 100;
    }


    /*
     * Search alias match.
     */
    aliases.forEach((alias) => {

        if (
            alias === normalizedQuery
        ) {
            score += 100;
        }
        else if (
            alias.includes(
                normalizedQuery
            )
        ) {
            score += 70;
        }

    });


    /*
     * Full phrase appears somewhere in our
     * curated metadata.
     */
    if (
        searchableText.includes(
            normalizedQuery
        )
    ) {
        score += 60;
    }


    /*
     * Word coverage.
     */
    if (
        queryWords.length > 0
    ) {

        const matchedWords =
            queryWords.filter((word) => {

                return searchableText.includes(
                    word
                );

            });


        const coverage =
            matchedWords.length /
            queryWords.length;


        score +=
            coverage * 55;

    }


    return score;

}



/**
 * Create one searchable string containing the
 * metadata controlled by Crypt & Quill.
 */
function getCuratedSearchText(work) {

    const values = [
        work.title,
        work.author,
        work.type,
        ...work.genres,
        ...work.subgenres,
        ...work.themes,
        ...work.searchAliases
    ];


    return normalizeSearchText(
        values.join(" ")
    );

}



/* ========================================
   OPEN LIBRARY MATCHING
   ======================================== */

/**
 * Add useful Open Library metadata to one of our
 * curated records without overwriting our
 * canonical title, author, year, type, or tags.
 */
function enrichCuratedWorkFromOpenLibrary(
    curatedWork,
    openLibraryResults
) {

    const bestMatch =
        findBestOpenLibraryMatch(
            curatedWork,
            openLibraryResults
        );


    if (!bestMatch) {

        return {
            ...curatedWork
        };

    }


    return {

        ...curatedWork,

        coverId:
            bestMatch.coverId ||
            curatedWork.coverId,

        openLibraryKey:
            bestMatch.openLibraryKey ||
            null,

        authorKeys:
            bestMatch.authorKeys || [],

        subjects:
            bestMatch.subjects || [],

        editionCount:
            bestMatch.editionCount || null,

        matchedOpenLibraryKey:
            bestMatch.openLibraryKey || null

    };

}



/**
 * Find the strongest Open Library record for a
 * curated Crypt & Quill work.
 */
function findBestOpenLibraryMatch(
    curatedWork,
    openLibraryResults
) {

    let bestMatch = null;

    let bestScore = 0;


    openLibraryResults.forEach(
        (candidate) => {

            const score =
                scoreOpenLibraryMatch(
                    curatedWork,
                    candidate
                );


            if (
                score > bestScore
            ) {

                bestScore =
                    score;

                bestMatch =
                    candidate;

            }

        }
    );


    /*
     * We only accept a reasonably strong match.
     *
     * This prevents something like a random
     * Stephen King title from becoming the
     * canonical Open Library match for The Jaunt.
     */
    if (
        bestScore < 90
    ) {
        return null;
    }


    return bestMatch;

}



/**
 * Score an Open Library result against one
 * curated record.
 */
function scoreOpenLibraryMatch(
    curatedWork,
    candidate
) {

    const curatedTitle =
        normalizeSearchText(
            curatedWork.title
        );

    const candidateTitle =
        normalizeSearchText(
            candidate.title
        );


    const curatedAuthor =
        normalizeSearchText(
            curatedWork.author
        );

    const candidateAuthor =
        normalizeSearchText(
            candidate.author
        );


    let score = 0;


    /*
     * TITLE
     */

    if (
        curatedTitle ===
        candidateTitle
    ) {

        score += 80;

    }
    else if (
        candidateTitle.includes(
            curatedTitle
        ) ||
        curatedTitle.includes(
            candidateTitle
        )
    ) {

        score += 45;

    }
    else {

        score +=
            getWordOverlapRatio(
                curatedTitle,
                candidateTitle
            ) * 35;

    }


    /*
     * AUTHOR
     */

    if (
        curatedAuthor ===
        candidateAuthor
    ) {

        score += 55;

    }
    else if (
        candidateAuthor.includes(
            curatedAuthor
        ) ||
        curatedAuthor.includes(
            candidateAuthor
        )
    ) {

        score += 40;

    }
    else {

        score +=
            getWordOverlapRatio(
                curatedAuthor,
                candidateAuthor
            ) * 25;

    }


    /*
     * YEAR
     *
     * The year is only a small bonus because
     * Open Library sometimes returns edition or
     * manifestation dates that differ from our
     * canonical work date.
     */

    if (
        curatedWork.year &&
        candidate.year
    ) {

        const difference =
            Math.abs(
                curatedWork.year -
                candidate.year
            );


        if (
            difference === 0
        ) {

            score += 10;

        }
        else if (
            difference <= 5
        ) {

            score += 5;

        }

    }


    /*
     * Prefer a result that actually has a cover.
     */
    if (
        candidate.coverId
    ) {

        score += 3;

    }


    return score;

}



/* ========================================
   QUERY TYPE
   ======================================== */

/**
 * Determine whether this search appears to be
 * focused on the title of a known curated work.
 *
 * We use this to clean up obvious noise from
 * Open Library.
 */
function isCuratedTitleFocusedQuery(
    query,
    curatedMatches
) {

    const queryWords =
        getSearchWords(query);


    if (
        queryWords.length === 0
    ) {
        return false;
    }


    return curatedMatches.some(
        (work) => {

            const titleWords =
                getSearchWords(
                    work.title
                );


            if (
                titleWords.length === 0
            ) {
                return false;
            }


            const matchingTitleWords =
                titleWords.filter(
                    (word) => {

                        return queryWords.includes(
                            word
                        );

                    }
                );


            const titleCoverage =
                matchingTitleWords.length /
                titleWords.length;


            const queryCoverage =
                matchingTitleWords.length /
                queryWords.length;


            return (
                titleCoverage >= 0.75 &&
                queryCoverage >= 0.4
            );

        }
    );

}



/* ========================================
   RELATED OPEN LIBRARY RESULTS
   ======================================== */

/**
 * Determine whether an Open Library result is
 * meaningfully related to one of the curated
 * works matched by the user's search.
 */
function isOpenLibraryResultRelated(
    candidate,
    curatedMatches
) {

    return curatedMatches.some(
        (curatedWork) => {

            if (
                titlesAreRelated(
                    curatedWork.title,
                    candidate.title
                )
            ) {
                return true;
            }


            const relationshipTitles =
                getRelationshipTitles(
                    curatedWork
                );


            return relationshipTitles.some(
                (relatedTitle) => {

                    return titlesAreRelated(
                        relatedTitle,
                        candidate.title
                    );

                }
            );

        }
    );

}



/**
 * Compare two titles using normalized word overlap.
 */
function titlesAreRelated(
    firstTitle,
    secondTitle
) {

    const first =
        normalizeSearchText(
            firstTitle
        );

    const second =
        normalizeSearchText(
            secondTitle
        );


    if (
        !first ||
        !second
    ) {
        return false;
    }


    if (
        first === second
    ) {
        return true;
    }


    if (
        first.includes(second) ||
        second.includes(first)
    ) {
        return true;
    }


    const overlap =
        getWordOverlapRatio(
            first,
            second
        );


    return overlap >= 0.75;

}



/**
 * Pull work titles out of relationship data.
 */
function getRelationshipTitles(work) {

    const titles = [];


    const relationships =
        work.relationships || {};


    Object.values(
        relationships
    ).forEach((relationshipGroup) => {

        if (
            !Array.isArray(
                relationshipGroup
            )
        ) {
            return;
        }


        relationshipGroup.forEach(
            (relationship) => {

                if (
                    relationship &&
                    relationship.title
                ) {

                    titles.push(
                        relationship.title
                    );

                }

            }
        );

    });


    return titles;

}



/* ========================================
   TEXT UTILITIES
   ======================================== */

/**
 * Normalize text for comparison.
 */
function normalizeSearchText(value) {

    return String(
        value || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /&/g,
            " and "
        )
        .replace(
            /['’]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9]+/g,
            " "
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}



/**
 * Return useful words from a search phrase.
 */
function getSearchWords(value) {

    return normalizeSearchText(
        value
    )
        .split(" ")
        .filter((word) => {

            return (
                word.length > 1 &&
                !SEARCH_STOP_WORDS.has(
                    word
                )
            );

        });

}



/**
 * Compare meaningful words between two strings.
 */
function getWordOverlapRatio(
    firstValue,
    secondValue
) {

    const firstWords =
        getSearchWords(
            firstValue
        );

    const secondWords =
        getSearchWords(
            secondValue
        );


    if (
        firstWords.length === 0 ||
        secondWords.length === 0
    ) {
        return 0;
    }


    const matchingWords =
        firstWords.filter((word) => {

            return secondWords.includes(
                word
            );

        });


    return (
        matchingWords.length /
        firstWords.length
    );

}
