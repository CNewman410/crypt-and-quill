/* ========================================
   Crypt & Quill
   Discover Page
   ======================================== */


const searchForm =
    document.getElementById("discover-search-form");

const searchInput =
    document.getElementById("discover-search-input");

const workGrid =
    document.getElementById("work-grid");

const resultsCount =
    document.getElementById("results-count");

const discoverStatus =
    document.getElementById("discover-status");

const clearFiltersButton =
    document.getElementById("clear-filters-button");


let currentWorks = [];



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

        currentWorks =
            await loadCuratedWorks();

        renderWorks(currentWorks);

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

        await showCuratedArchive();

        return;

    }


    showStatus(
        `Searching the archive for “${query}”...`
    );


    workGrid.innerHTML = "";

    resultsCount.textContent = "";


    try {

        const results =
            await searchOpenLibrary(query);


        currentWorks = results;

        renderWorks(currentWorks);


        if (results.length === 0) {

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
   CURATED ARCHIVE
   ======================================== */

async function showCuratedArchive() {

    showStatus(
        "Returning to the Crypt & Quill collection..."
    );


    try {

        currentWorks =
            await loadCuratedWorks();

        renderWorks(currentWorks);

        hideStatus();

    }
    catch (error) {

        console.error(error);


        showStatus(
            "The curated archive could not be loaded."
        );

    }

}



/* ========================================
   RENDER WORKS
   ======================================== */

function renderWorks(works) {

    workGrid.innerHTML = "";


    updateResultsCount(
        works.length
    );


    works.forEach((work) => {

        const card =
            createWorkCard(work);

        workGrid.appendChild(card);

    });

}



/* ========================================
   CREATE WORK CARD
   ======================================== */

function createWorkCard(work) {

    const article =
        document.createElement("article");

    article.className =
        "work-card";


    /*
     * COVER
     */

    const coverWrapper =
        document.createElement("div");

    coverWrapper.className =
        "work-card-cover";


    if (
        work.source === "openlibrary" &&
        work.coverId
    ) {

        const image =
            document.createElement("img");

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

                coverWrapper.innerHTML = "";

                coverWrapper.appendChild(
                    createCoverPlaceholder()
                );

            }
        );


        coverWrapper.appendChild(image);

    }
    else {

        coverWrapper.appendChild(
            createCoverPlaceholder()
        );

    }



    /*
     * CARD CONTENT
     */

    const content =
        document.createElement("div");

    content.className =
        "work-card-content";


    const workType =
        document.createElement("p");

    workType.className =
        "work-card-type";

    workType.textContent =
        work.type || "Work";


    const title =
        document.createElement("h3");

    title.textContent =
        work.title;


    const author =
        document.createElement("p");

    author.className =
        "work-card-author";

    author.textContent =
        work.author;


    const year =
        document.createElement("p");

    year.className =
        "work-card-year";

    year.textContent =
        work.year
            ? work.year
            : "Publication year unknown";


    content.appendChild(workType);

    content.appendChild(title);

    content.appendChild(author);

    content.appendChild(year);



    /*
     * TAGS
     */

    const tags =
        getDisplayTags(work);


    if (tags.length > 0) {

        const tagContainer =
            document.createElement("div");

        tagContainer.className =
            "work-card-tags";


        tags.forEach((tag) => {

            const tagElement =
                document.createElement("span");

            tagElement.textContent =
                tag;

            tagContainer.appendChild(
                tagElement
            );

        });


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
        document.createElement("div");

    placeholder.className =
        "cover-placeholder";


    const label =
        document.createElement("span");

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
     * Curated Crypt & Quill records use our
     * controlled vocabulary.
     */

    if (
        work.source === "crypt-and-quill"
    ) {

        return [
            ...work.genres,
            ...work.subgenres,
            ...work.themes
        ].slice(0, 2);

    }


    /*
     * Open Library subjects are useful as hints,
     * but they are NOT treated as official
     * Crypt & Quill classifications.
     */

    if (
        Array.isArray(work.subjects)
    ) {

        return work.subjects
            .filter(isUsefulSubject)
            .slice(0, 2);

    }


    return [];

}



/* ========================================
   SUBJECT CLEANUP
   ======================================== */

function isUsefulSubject(subject) {

    if (
        typeof subject !== "string"
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

function updateResultsCount(count) {

    const label =
        count === 1
            ? "work"
            : "works";


    resultsCount.textContent =
        `${count} ${label}`;

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


async function clearDiscoverControls() {

    searchInput.value = "";


    document
        .querySelectorAll(".filter-select")
        .forEach((select) => {

            select.value = "";

        });


    const sortSelect =
        document.getElementById(
            "sort-results"
        );


    if (sortSelect) {

        sortSelect.value =
            "featured";

    }


    await showCuratedArchive();

}
