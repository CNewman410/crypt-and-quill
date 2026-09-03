/* ========================================
   Crypt & Quill
   Discover Page
   ======================================== */


/* ========================================
   SETTINGS
   ======================================== */

const OPEN_LIBRARY_SEARCH_LIMIT = 24;

const MAX_EXTERNAL_RESULTS_TO_DISPLAY = 12;



/* ========================================
   PAGE ELEMENTS
   ======================================== */

const searchForm =
    document.getElementById(
        "discover-search-form"
    );

const searchInput =
    document.getElementById(
        "discover-search-input"
    );

const workGrid =
    document.getElementById(
        "work-grid"
    );

const resultsCount =
    document.getElementById(
        "results-count"
    );

const discoverStatus =
    document.getElementById(
        "discover-status"
    );

const clearFiltersButton =
    document.getElementById(
        "clear-filters-button"
    );


const genreFilter =
    document.getElementById(
        "genre-filter"
    );

const subgenreFilter =
    document.getElementById(
        "subgenre-filter"
    );

const typeFilter =
    document.getElementById(
        "type-filter"
    );

const yearFilter =
    document.getElementById(
        "year-filter"
    );

const sortSelect =
    document.getElementById(
        "sort-results"
    );



/* ========================================
   PAGE STATE
   ======================================== */

/*
 * All curated Crypt & Quill works.
 */
let curatedCatalog = [];


/*
 * The complete unfiltered result set currently
 * available to Discover.
 *
 * This may contain:
 *
 * - Crypt & Quill curated works
 * - Open Library results
 */
let currentWorks = [];


/*
 * Full Open Library response after cleanup.
 */
let lastOpenLibraryResults = [];


/*
 * Tracks whether we're currently viewing:
 *
 * "curated"
 * or
 * "search"
 */
let currentViewMode = "curated";



/* ========================================
   INITIALIZE
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeDiscover
);


async function initializeDiscover() {

    showStatus(
        "Opening the Crypt & Quill archive..."
    );


    try {

        curatedCatalog =
            await loadCuratedWorks();


        currentWorks = [
            ...curatedCatalog
        ];


        currentViewMode =
            "curated";


        applyFiltersAndSort();


        hideStatus();

    }
    catch (error) {

        console.error(error);


        showStatus(
            "The archive could not be opened."
        );

    }

}



/* ========================================
   SEARCH
   ======================================== */

searchForm.addEventListener(
    "submit",
    handleSearch
);


async function handleSearch(event) {

    event.preventDefault();


    const query =
        searchInput.value.trim();


    /*
     * Empty search returns to our curated archive.
     */
    if (!query) {

        showCuratedArchive();

        return;

    }


    showStatus(
        `Searching the archive for “${query}”...`
    );


    workGrid.innerHTML =
        "";


    resultsCount.textContent =
        "";


    try {

        /*
         * STEP 1
         *
         * Search Crypt & Quill's own metadata.
         */
        const curatedMatches =
            findCuratedMatches(
                curatedCatalog,
                query
            );


        /*
         * STEP 2
         *
         * Search Open Library.
         */
        lastOpenLibraryResults =
            await searchOpenLibrary(
                query,
                OPEN_LIBRARY_SEARCH_LIMIT
            );


        /*
         * STEP 3
         *
         * Enrich curated results with useful
         * Open Library metadata.
         *
         * Crypt & Quill remains canonical.
         */
        const enrichedCuratedMatches =
            curatedMatches.map(
                (work) => {

                    return enrichCuratedWorkFromOpenLibrary(
                        work,
                        lastOpenLibraryResults
                    );

                }
            );


        /*
         * STEP 4
         *
         * Remove obvious Open Library noise.
         */
        const cleanedExternalResults =
            cleanOpenLibraryResults(
                lastOpenLibraryResults,
                enrichedCuratedMatches,
                query
            );


        /*
         * Keep the complete result pool.
         *
         * Filters operate on this entire array,
         * including external results we aren't
         * initially displaying.
         */
        currentWorks = [
            ...enrichedCuratedMatches,
            ...cleanedExternalResults
        ];


        currentViewMode =
            "search";


        applyFiltersAndSort();


        if (
            currentWorks.length === 0
        ) {

            showStatus(
                `No works were found for “${query}”.`
            );

        }
        else {

            hideStatus();

        }

    }
    catch (error) {

        console.error(error);


        showStatus(
            "Something went wrong while searching Open Library. Please try again."
        );

    }

}



/* ========================================
   OPEN LIBRARY CLEANUP
   ======================================== */

function cleanOpenLibraryResults(
    results,
    curatedMatches,
    query
) {

    /*
     * Do not show the exact Open Library record
     * again after we've already used it to enrich
     * a curated Crypt & Quill work.
     */
    const matchedOpenLibraryKeys =
        new Set(
            curatedMatches
                .map((work) => {

                    return work.matchedOpenLibraryKey;

                })
                .filter(Boolean)
        );


    let cleanedResults =
        results.filter((work) => {

            return (
                work.openLibraryKey &&
                !matchedOpenLibraryKeys.has(
                    work.openLibraryKey
                )
            );

        });


    /*
     * Remove duplicate normalized title/author
     * combinations.
     */
    cleanedResults =
        removeDuplicateOpenLibraryWorks(
            cleanedResults
        );


    /*
     * If the search clearly targets a curated
     * title, remove unrelated Open Library noise.
     */
    const titleFocusedSearch =
        isCuratedTitleFocusedQuery(
            query,
            curatedMatches
        );


    if (
        titleFocusedSearch &&
        curatedMatches.length > 0
    ) {

        cleanedResults =
            cleanedResults.filter(
                (candidate) => {

                    return isOpenLibraryResultRelated(
                        candidate,
                        curatedMatches
                    );

                }
            );

    }


    return cleanedResults;

}



/**
 * Remove repeated Open Library records with the
 * same normalized title and author.
 */
function removeDuplicateOpenLibraryWorks(
    works
) {

    const seen =
        new Set();


    return works.filter(
        (work) => {

            const title =
                normalizeSearchText(
                    work.title
                );

            const author =
                normalizeSearchText(
                    work.author
                );


            const duplicateKey =
                `${title}|${author}`;


            if (
                seen.has(
                    duplicateKey
                )
            ) {
                return false;
            }


            seen.add(
                duplicateKey
            );


            return true;

        }
    );

}



/* ========================================
   CURATED ARCHIVE
   ======================================== */

function showCuratedArchive() {

    currentWorks = [
        ...curatedCatalog
    ];


    lastOpenLibraryResults =
        [];


    currentViewMode =
        "curated";


    applyFiltersAndSort();


    hideStatus();

}



/* ========================================
   FILTER EVENTS
   ======================================== */

genreFilter.addEventListener(
    "change",
    applyFiltersAndSort
);


subgenreFilter.addEventListener(
    "change",
    applyFiltersAndSort
);


typeFilter.addEventListener(
    "change",
    applyFiltersAndSort
);


yearFilter.addEventListener(
    "change",
    applyFiltersAndSort
);


sortSelect.addEventListener(
    "change",
    applyFiltersAndSort
);



/* ========================================
   FILTER + SORT PIPELINE
   ======================================== */

function applyFiltersAndSort() {

    /*
     * Start with the complete current result set.
     */
    let filteredWorks = [
        ...currentWorks
    ];


    /*
     * Apply every active filter.
     */
    filteredWorks =
        filteredWorks.filter(
            matchesGenreFilter
        );


    filteredWorks =
        filteredWorks.filter(
            matchesSubgenreFilter
        );


    filteredWorks =
        filteredWorks.filter(
            matchesTypeFilter
        );


    filteredWorks =
        filteredWorks.filter(
            matchesYearFilter
        );


    /*
     * Sort only after filtering.
     */
    filteredWorks =
        sortWorks(
            filteredWorks,
            sortSelect.value
        );


    /*
     * Keep curated results.
     *
     * Limit only external Open Library results
     * so they don't overwhelm the interface.
     */
    const curatedWorks =
        filteredWorks.filter(
            (work) => {

                return (
                    work.source ===
                    "crypt-and-quill"
                );

            }
        );


    const externalWorks =
        filteredWorks.filter(
            (work) => {

                return (
                    work.source !==
                    "crypt-and-quill"
                );

            }
        );


    const visibleExternalWorks =
        externalWorks.slice(
            0,
            MAX_EXTERNAL_RESULTS_TO_DISPLAY
        );


    /*
     * Recombine.
     *
     * For Featured sorting, curated works stay
     * first.
     *
     * Other sorts will be re-sorted below so
     * title/year sorting applies across both.
     */
    let visibleWorks = [
        ...curatedWorks,
        ...visibleExternalWorks
    ];


    if (
        sortSelect.value !==
        "featured"
    ) {

        visibleWorks =
            sortWorks(
                visibleWorks,
                sortSelect.value
            );

    }


    renderWorks(
        visibleWorks
    );


    updateFilteredResultsCount(
        visibleWorks.length,
        filteredWorks.length
    );


    /*
     * Give useful feedback when filters remove
     * every result.
     */
    if (
        filteredWorks.length === 0 &&
        currentWorks.length > 0
    ) {

        showStatus(
            "No works match the selected filters."
        );

    }
    else {

        hideStatus();

    }

}



/* ========================================
   GENRE FILTER
   ======================================== */

function matchesGenreFilter(work) {

    const selectedGenre =
        genreFilter.value;


    if (
        !selectedGenre
    ) {
        return true;
    }


    const selectedText =
        filterValueToText(
            selectedGenre
        );


    /*
     * Curated records use our controlled
     * vocabulary directly.
     */
    if (
        work.source ===
        "crypt-and-quill"
    ) {

        return work.genres.some(
            (genre) => {

                return (
                    normalizeSearchText(
                        genre
                    ) ===
                    normalizeSearchText(
                        selectedText
                    )
                );

            }
        );

    }


    /*
     * Open Library records do not use our
     * controlled vocabulary.
     *
     * We only allow conservative subject matches.
     */
    return openLibrarySubjectsMatchGenre(
        work,
        selectedGenre
    );

}



/* ========================================
   SUBGENRE FILTER
   ======================================== */

function matchesSubgenreFilter(work) {

    const selectedSubgenre =
        subgenreFilter.value;


    if (
        !selectedSubgenre
    ) {
        return true;
    }


    const selectedText =
        filterValueToText(
            selectedSubgenre
        );


    /*
     * Curated works use exact Crypt & Quill
     * taxonomy.
     */
    if (
        work.source ===
        "crypt-and-quill"
    ) {

        return work.subgenres.some(
            (subgenre) => {

                return (
                    normalizeSearchText(
                        subgenre
                    ) ===
                    normalizeSearchText(
                        selectedText
                    )
                );

            }
        );

    }


    /*
     * External records only participate when
     * Open Library supplied a reasonably
     * recognizable subject.
     */
    return openLibrarySubjectsMatchSubgenre(
        work,
        selectedSubgenre
    );

}



/* ========================================
   WORK TYPE FILTER
   ======================================== */

function matchesTypeFilter(work) {

    const selectedType =
        typeFilter.value;


    if (
        !selectedType
    ) {
        return true;
    }


    /*
     * Work type is one place where we deliberately
     * trust Crypt & Quill rather than guessing
     * from inconsistent Open Library metadata.
     */
    if (
        work.source !==
        "crypt-and-quill"
    ) {
        return false;
    }


    const selectedText =
        filterValueToText(
            selectedType
        );


    return (
        normalizeSearchText(
            work.type
        ) ===
        normalizeSearchText(
            selectedText
        )
    );

}



/* ========================================
   PUBLICATION FILTER
   ======================================== */

function matchesYearFilter(work) {

    const selectedRange =
        yearFilter.value;


    if (
        !selectedRange
    ) {
        return true;
    }


    const year =
        Number(
            work.year
        );


    /*
     * Unknown dates cannot be safely placed into
     * a publication range.
     */
    if (
        !Number.isFinite(year)
    ) {
        return false;
    }


    switch (
        selectedRange
    ) {

        case "pre-1900":

            return (
                year < 1900
            );


        case "1900-1949":

            return (
                year >= 1900 &&
                year <= 1949
            );


        case "1950-1979":

            return (
                year >= 1950 &&
                year <= 1979
            );


        case "1980-1999":

            return (
                year >= 1980 &&
                year <= 1999
            );


        case "2000-2019":

            return (
                year >= 2000 &&
                year <= 2019
            );


        case "2020-present":

            return (
                year >= 2020
            );


        default:

            return true;

    }

}



/* ========================================
   OPEN LIBRARY GENRE MAPPING
   ======================================== */

function openLibrarySubjectsMatchGenre(
    work,
    genre
) {

    const subjects =
        getNormalizedSubjects(
            work
        );


    if (
        subjects.length === 0
    ) {
        return false;
    }


    switch (
        genre
    ) {

        case "horror":

            return subjectsContainAny(
                subjects,
                [
                    "horror",
                    "horror fiction",
                    "horror tales"
                ]
            );


        case "gothic":

            return subjectsContainAny(
                subjects,
                [
                    "gothic",
                    "gothic fiction",
                    "gothic literature"
                ]
            );


        case "weird-fiction":

            return subjectsContainAny(
                subjects,
                [
                    "weird fiction",
                    "weird tales"
                ]
            );


        case "science-fiction":

            return subjectsContainAny(
                subjects,
                [
                    "science fiction",
                    "science-fiction"
                ]
            );


        case "dark-fantasy":

            return subjectsContainAny(
                subjects,
                [
                    "dark fantasy"
                ]
            );


        case "supernatural":

            return subjectsContainAny(
                subjects,
                [
                    "supernatural",
                    "supernatural fiction"
                ]
            );


        default:

            return false;

    }

}



/* ========================================
   OPEN LIBRARY SUBGENRE MAPPING
   ======================================== */

function openLibrarySubjectsMatchSubgenre(
    work,
    subgenre
) {

    const subjects =
        getNormalizedSubjects(
            work
        );


    if (
        subjects.length === 0
    ) {
        return false;
    }


    switch (
        subgenre
    ) {

        case "cosmic-horror":

            return subjectsContainAny(
                subjects,
                [
                    "cosmic horror",
                    "lovecraftian",
                    "lovecraftian horror"
                ]
            );


        case "folk-horror":

            return subjectsContainAny(
                subjects,
                [
                    "folk horror"
                ]
            );


        case "occult":

            return subjectsContainAny(
                subjects,
                [
                    "occult",
                    "occult fiction",
                    "occultism"
                ]
            );


        case "ghost-stories":

            return subjectsContainAny(
                subjects,
                [
                    "ghost stories",
                    "ghosts",
                    "ghost fiction"
                ]
            );


        case "haunted-house":

            return subjectsContainAny(
                subjects,
                [
                    "haunted house",
                    "haunted houses"
                ]
            );


        case "witchcraft":

            return subjectsContainAny(
                subjects,
                [
                    "witchcraft",
                    "witches"
                ]
            );


        case "psychological-horror":

            return subjectsContainAny(
                subjects,
                [
                    "psychological horror"
                ]
            );


        case "literary-horror":

            return subjectsContainAny(
                subjects,
                [
                    "literary horror"
                ]
            );


        default:

            return false;

    }

}



/* ========================================
   SUBJECT UTILITIES
   ======================================== */

function getNormalizedSubjects(work) {

    if (
        !Array.isArray(
            work.subjects
        )
    ) {
        return [];
    }


    return work.subjects
        .filter(
            (subject) => {

                return (
                    typeof subject ===
                    "string"
                );

            }
        )
        .map(
            (subject) => {

                return normalizeSearchText(
                    subject
                );

            }
        );

}



/**
 * Returns true if any subject contains one of
 * our approved phrases.
 */
function subjectsContainAny(
    subjects,
    phrases
) {

    const normalizedPhrases =
        phrases.map(
            normalizeSearchText
        );


    return subjects.some(
        (subject) => {

            return normalizedPhrases.some(
                (phrase) => {

                    return (
                        subject === phrase ||
                        subject.includes(
                            phrase
                        )
                    );

                }
            );

        }
    );

}



/* ========================================
   SORTING
   ======================================== */

function sortWorks(
    works,
    sortMethod
) {

    const sortedWorks = [
        ...works
    ];


    switch (
        sortMethod
    ) {

        case "title":

            sortedWorks.sort(
                compareTitles
            );

            break;


        case "author":

            sortedWorks.sort(
                compareAuthors
            );

            break;


        case "newest":

            sortedWorks.sort(
                compareNewest
            );

            break;


        case "oldest":

            sortedWorks.sort(
                compareOldest
            );

            break;


        case "featured":
        default:

            sortedWorks.sort(
                compareFeatured
            );

            break;

    }


    return sortedWorks;

}



/**
 * Featured sorting:
 *
 * 1. Crypt & Quill curated works
 * 2. Open Library discovery results
 *
 * Existing relevance order is otherwise kept.
 */
function compareFeatured(
    first,
    second
) {

    const firstCurated =
        first.source ===
        "crypt-and-quill";

    const secondCurated =
        second.source ===
        "crypt-and-quill";


    if (
        firstCurated &&
        !secondCurated
    ) {
        return -1;
    }


    if (
        !firstCurated &&
        secondCurated
    ) {
        return 1;
    }


    return 0;

}



function compareTitles(
    first,
    second
) {

    return first.title.localeCompare(
        second.title,
        undefined,
        {
            sensitivity: "base"
        }
    );

}



function compareAuthors(
    first,
    second
) {

    const authorComparison =
        first.author.localeCompare(
            second.author,
            undefined,
            {
                sensitivity: "base"
            }
        );


    if (
        authorComparison !== 0
    ) {
        return authorComparison;
    }


    return compareTitles(
        first,
        second
    );

}



function compareNewest(
    first,
    second
) {

    const firstYear =
        getSortableYear(
            first.year,
            -Infinity
        );

    const secondYear =
        getSortableYear(
            second.year,
            -Infinity
        );


    if (
        firstYear !==
        secondYear
    ) {

        return (
            secondYear -
            firstYear
        );

    }


    return compareTitles(
        first,
        second
    );

}



function compareOldest(
    first,
    second
) {

    const firstYear =
        getSortableYear(
            first.year,
            Infinity
        );

    const secondYear =
        getSortableYear(
            second.year,
            Infinity
        );


    if (
        firstYear !==
        secondYear
    ) {

        return (
            firstYear -
            secondYear
        );

    }


    return compareTitles(
        first,
        second
    );

}



function getSortableYear(
    value,
    fallback
) {

    const year =
        Number(value);


    return Number.isFinite(
        year
    )
        ? year
        : fallback;

}



/* ========================================
   FILTER VALUE UTILITIES
   ======================================== */

function filterValueToText(value) {

    return String(
        value || ""
    )
        .replace(
            /-/g,
            " "
        )
        .trim();

}



/* ========================================
   RENDER WORKS
   ======================================== */

function renderWorks(works) {

    workGrid.innerHTML =
        "";


    works.forEach(
        (work) => {

            const card =
                createWorkCard(
                    work
                );


            workGrid.appendChild(
                card
            );

        }
    );

}



/* ========================================
   CREATE WORK CARD
   ======================================== */

function createWorkCard(work) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "work-card";



    /*
     * COVER
     */

    const coverWrapper =
        document.createElement(
            "div"
        );


    coverWrapper.className =
        "work-card-cover";


    if (
        work.coverId
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "work-cover-image";


        image.src =
            getOpenLibraryCoverURL(
                work.coverId,
                "L"
            );


        image.alt =
            `Cover of ${work.title}`;


        image.loading =
            "lazy";


        image.addEventListener(
            "error",
            () => {

                coverWrapper.innerHTML =
                    "";


                coverWrapper.appendChild(
                    createCoverPlaceholder()
                );

            }
        );


        coverWrapper.appendChild(
            image
        );

    }
    else {

        coverWrapper.appendChild(
            createCoverPlaceholder()
        );

    }



    /*
     * CONTENT
     */

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "work-card-content";


    const workType =
        document.createElement(
            "p"
        );


    workType.className =
        "work-card-type";


    if (
        work.source ===
        "crypt-and-quill"
    ) {

        workType.textContent =
            `${work.type} · Crypt & Quill`;

    }
    else {

        workType.textContent =
            "Open Library";

    }



    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        work.title;



    const author =
        document.createElement(
            "p"
        );


    author.className =
        "work-card-author";


    author.textContent =
        work.author;



    const year =
        document.createElement(
            "p"
        );


    year.className =
        "work-card-year";


    year.textContent =
        work.year
            ? work.year
            : "Publication year unknown";



    content.appendChild(
        workType
    );


    content.appendChild(
        title
    );


    content.appendChild(
        author
    );


    content.appendChild(
        year
    );



    /*
     * TAGS
     */

    const tags =
        getDisplayTags(
            work
        );


    if (
        tags.length > 0
    ) {

        const tagContainer =
            document.createElement(
                "div"
            );


        tagContainer.className =
            "work-card-tags";


        tags.forEach(
            (tag) => {

                const tagElement =
                    document.createElement(
                        "span"
                    );


                tagElement.textContent =
                    tag;


                tagContainer.appendChild(
                    tagElement
                );

            }
        );


        content.appendChild(
            tagContainer
        );

    }



article.appendChild(
    coverWrapper
);


article.appendChild(
    content
);


/*
 * Make the entire card behave like a link.
 */
makeWorkCardNavigable(
    article,
    work
);


return article;

}

/* ========================================
   WORK CARD NAVIGATION
   ======================================== */

function makeWorkCardNavigable(
    card,
    work
) {

    const url =
        getWorkDetailsURL(
            work
        );


    if (!url) {
        return;
    }


    card.classList.add(
        "work-card-clickable"
    );


    card.setAttribute(
        "role",
        "link"
    );


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "aria-label",
        `View details for ${work.title}`
    );


    card.addEventListener(
        "click",
        () => {

            window.location.href =
                url;

        }
    );


    card.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                window.location.href =
                    url;

            }

        }
    );

}



/* ========================================
   WORK DETAILS URL
   ======================================== */

function getWorkDetailsURL(
    work
) {

    /*
     * Curated Crypt & Quill works use our
     * permanent internal ID.
     */
    if (
        work.source ===
        "crypt-and-quill" &&
        work.id
    ) {

        return (
            "work-details.html?id=" +
            encodeURIComponent(
                work.id
            )
        );

    }


    /*
     * External Open Library works use their
     * Open Library work ID.
     */
    if (
        work.openLibraryKey
    ) {

        return (
            "work-details.html?ol=" +
            encodeURIComponent(
                normalizeOpenLibraryKey(
                    work.openLibraryKey
                )
            )
        );

    }


    return null;

}


/* ========================================
   COVER PLACEHOLDER
   ======================================== */

function createCoverPlaceholder() {

    const placeholder =
        document.createElement(
            "div"
        );


    placeholder.className =
        "cover-placeholder";


    const label =
        document.createElement(
            "span"
        );


    label.textContent =
        "Cover";


    placeholder.appendChild(
        label
    );


    return placeholder;

}



/* ========================================
   DISPLAY TAGS
   ======================================== */

function getDisplayTags(work) {

    /*
     * Curated records always display our own
     * controlled vocabulary first.
     */
    if (
        work.source ===
        "crypt-and-quill"
    ) {

        return [
            ...work.genres,
            ...work.subgenres,
            ...work.themes
        ].slice(
            0,
            2
        );

    }


    /*
     * Open Library subjects remain external
     * metadata hints.
     */
    if (
        Array.isArray(
            work.subjects
        )
    ) {

        return work.subjects
            .filter(
                isUsefulSubject
            )
            .slice(
                0,
                2
            );

    }


    return [];

}



/* ========================================
   SUBJECT DISPLAY CLEANUP
   ======================================== */

function isUsefulSubject(subject) {

    if (
        typeof subject !==
        "string"
    ) {
        return false;
    }


    const value =
        subject.trim();


    if (
        value.length < 3 ||
        value.length > 35
    ) {
        return false;
    }


    return true;

}



/* ========================================
   RESULTS COUNT
   ======================================== */

function updateFilteredResultsCount(
    visibleCount,
    filteredCount
) {

    const totalCurrentWorks =
        currentWorks.length;


    /*
     * Filters have narrowed the result set.
     */
    if (
        filteredCount <
        totalCurrentWorks
    ) {

        const label =
            filteredCount === 1
                ? "work"
                : "works";


        resultsCount.textContent =
            `${filteredCount} ${label}`;


        return;

    }


    /*
     * No filtering, but external results have
     * been capped for display.
     */
    if (
        visibleCount <
        filteredCount
    ) {

        resultsCount.textContent =
            `${visibleCount} shown · ${filteredCount} found`;


        return;

    }


    /*
     * Search with curated matches.
     */
    if (
        currentViewMode ===
        "search"
    ) {

        const curatedCount =
            currentWorks.filter(
                (work) => {

                    return (
                        work.source ===
                        "crypt-and-quill"
                    );

                }
            ).length;


        if (
            curatedCount > 0
        ) {

            const workLabel =
                filteredCount === 1
                    ? "work"
                    : "works";


            const curatedLabel =
                curatedCount === 1
                    ? "curated match"
                    : "curated matches";


            resultsCount.textContent =
                `${filteredCount} ${workLabel} · ` +
                `${curatedCount} ${curatedLabel}`;


            return;

        }

    }


    /*
     * Normal count.
     */
    const label =
        filteredCount === 1
            ? "work"
            : "works";


    resultsCount.textContent =
        `${filteredCount} ${label}`;

}



/* ========================================
   STATUS
   ======================================== */

function showStatus(message) {

    discoverStatus.textContent =
        message;


    discoverStatus.hidden =
        false;

}


function hideStatus() {

    discoverStatus.hidden =
        true;

}



/* ========================================
   CLEAR FILTERS
   ======================================== */

clearFiltersButton.addEventListener(
    "click",
    clearDiscoverFilters
);


function clearDiscoverFilters() {

    /*
     * Notice that we do NOT clear the search
     * field here.
     *
     * "Clear Filters" should clear filters,
     * not destroy the user's current search.
     */

    genreFilter.value =
        "";

    subgenreFilter.value =
        "";

    typeFilter.value =
        "";

    yearFilter.value =
        "";

    sortSelect.value =
        "featured";


    applyFiltersAndSort();

}
