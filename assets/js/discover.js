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



/* ========================================
   PAGE STATE
   ======================================== */

let curatedCatalog = [];

let currentWorks = [];

let lastOpenLibraryResults = [];



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


        renderWorks(
            currentWorks
        );


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


    workGrid.innerHTML = "";

    resultsCount.textContent = "";


    try {

        /*
         * STEP 1
         *
         * Search our own curated collection first.
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
         * Enrich curated results with Open Library
         * metadata such as covers and work IDs.
         *
         * Our canonical metadata remains untouched.
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
         * Clean Open Library results.
         */
        const cleanedExternalResults =
            cleanOpenLibraryResults(
                lastOpenLibraryResults,
                enrichedCuratedMatches,
                query
            );


        /*
         * Keep the full cleaned result pool available
         * internally for future sorting/filtering.
         */
        currentWorks = [
            ...enrichedCuratedMatches,
            ...cleanedExternalResults
        ];


        /*
         * We don't need to overwhelm the page with all
         * external results immediately.
         */
        const visibleExternalResults =
            cleanedExternalResults.slice(
                0,
                MAX_EXTERNAL_RESULTS_TO_DISPLAY
            );


        const visibleWorks = [
            ...enrichedCuratedMatches,
            ...visibleExternalResults
        ];


        const totalAvailable =
            enrichedCuratedMatches.length +
            cleanedExternalResults.length;


        const countLabel =
            createSearchCountLabel(
                visibleWorks.length,
                totalAvailable,
                enrichedCuratedMatches.length
            );


        renderWorks(
            visibleWorks,
            countLabel
        );


        if (
            visibleWorks.length === 0
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
     * Do not show the exact Open Library result
     * again after we've used it to enrich a
     * curated Crypt & Quill record.
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
     * Remove obvious duplicate title/author pairs.
     */
    cleanedResults =
        removeDuplicateOpenLibraryWorks(
            cleanedResults
        );


    /*
     * When the query clearly targets one of our
     * curated titles, remove unrelated search noise.
     *
     * Example:
     *
     * "The King in Yellow"
     *
     * should not turn into a page full of unrelated
     * Stephen King books merely because "King" occurs
     * in the search phrase.
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
 * Remove repeated Open Library works with the same
 * normalized title and author.
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


    lastOpenLibraryResults = [];


    renderWorks(
        currentWorks
    );


    hideStatus();

}



/* ========================================
   RENDER WORKS
   ======================================== */

function renderWorks(
    works,
    countLabel = null
) {

    workGrid.innerHTML = "";


    if (
        countLabel
    ) {

        resultsCount.textContent =
            countLabel;

    }
    else {

        updateResultsCount(
            works.length
        );

    }


    works.forEach(
        (work) => {

            const card =
                createWorkCard(work);


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


    /*
     * Curated records can now also have covers
     * borrowed from matched Open Library records.
     */
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


    /*
     * Make curated and external results easy
     * to distinguish without changing the
     * current visual design.
     */
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


    return article;

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
     * Crypt & Quill records always use our own
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
     * Open Library subjects are displayed only
     * as external metadata hints.
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
   SUBJECT CLEANUP
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
   RESULT COUNTS
   ======================================== */

function updateResultsCount(count) {

    const label =
        count === 1
            ? "work"
            : "works";


    resultsCount.textContent =
        `${count} ${label}`;

}



/**
 * Create a more informative count for API searches.
 */
function createSearchCountLabel(
    visibleCount,
    totalCount,
    curatedCount
) {

    if (
        totalCount === 0
    ) {

        return "0 works";

    }


    /*
     * Everything fits on screen.
     */
    if (
        visibleCount ===
        totalCount
    ) {

        if (
            curatedCount > 0
        ) {

            const curatedLabel =
                curatedCount === 1
                    ? "curated match"
                    : "curated matches";


            return (
                `${totalCount} works · ` +
                `${curatedCount} ${curatedLabel}`
            );

        }


        return (
            `${totalCount} works`
        );

    }


    /*
     * More results are stored internally than
     * we're showing right now.
     */
    return (
        `${visibleCount} shown · ` +
        `${totalCount} found`
    );

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
    clearDiscoverControls
);


function clearDiscoverControls() {

    searchInput.value =
        "";


    document
        .querySelectorAll(
            ".filter-select"
        )
        .forEach(
            (select) => {

                select.value =
                    "";

            }
        );


    const sortSelect =
        document.getElementById(
            "sort-results"
        );


    if (
        sortSelect
    ) {

        sortSelect.value =
            "featured";

    }


    showCuratedArchive();

}
