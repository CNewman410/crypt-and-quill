/* ========================================
   Crypt & Quill
   My Library Page
   ======================================== */


/* ========================================
   PAGE ELEMENTS
   ======================================== */

const libraryGrid =
    document.getElementById(
        "library-work-grid"
    );


const libraryCount =
    document.getElementById(
        "library-results-count"
    );


const libraryTitle =
    document.getElementById(
        "library-section-title"
    );


const emptyState =
    document.getElementById(
        "library-empty-state"
    );


const emptyMessage =
    document.getElementById(
        "library-empty-message"
    );


const librarySort =
    document.getElementById(
        "library-sort"
    );


const libraryFilterButtons =
    document.querySelectorAll(
        "[data-library-filter]"
    );



/* ========================================
   PAGE STATE
   ======================================== */

let savedWorks = [];

let activeLibraryFilter =
    "all";



/* ========================================
   INITIALIZE
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeMyLibrary
);


function initializeMyLibrary() {

    savedWorks =
        getSavedLibraryWorks();


    addLibraryFilterEvents();

    addLibrarySortEvent();


    renderMyLibrary();

}



/* ========================================
   FILTER EVENTS
   ======================================== */

function addLibraryFilterEvents() {

    libraryFilterButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    activeLibraryFilter =
                        button.dataset.libraryFilter;


                    updateActiveFilterButton();


                    renderMyLibrary();

                }
            );

        }
    );

}



function updateActiveFilterButton() {

    libraryFilterButtons.forEach(
        (button) => {

            const isActive =
                button.dataset.libraryFilter ===
                activeLibraryFilter;


            button.classList.toggle(
                "active",
                isActive
            );


            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );

        }
    );

}



/* ========================================
   SORT EVENT
   ======================================== */

function addLibrarySortEvent() {

    librarySort.addEventListener(
        "change",
        renderMyLibrary
    );

}



/* ========================================
   MAIN RENDER PIPELINE
   ======================================== */

function renderMyLibrary() {

    /*
     * Reload storage every time.
     *
     * This means if library data changes and the
     * page is revisited, we always use the newest
     * saved version.
     */
    savedWorks =
        getSavedLibraryWorks();


    let works =
        filterLibraryWorks(
            savedWorks
        );


    works =
        sortLibraryWorks(
            works,
            librarySort.value
        );


    updateLibraryHeading(
        works.length
    );


    renderLibraryCards(
        works
    );

}



/* ========================================
   FILTERING
   ======================================== */

function filterLibraryWorks(
    works
) {

    switch (
        activeLibraryFilter
    ) {

        case "want-to-read":

            return works.filter(
                (work) => {

                    return (
                        work.status ===
                        "want-to-read"
                    );

                }
            );


        case "currently-reading":

            return works.filter(
                (work) => {

                    return (
                        work.status ===
                        "currently-reading"
                    );

                }
            );


        case "read":

            return works.filter(
                (work) => {

                    return (
                        work.status ===
                        "read"
                    );

                }
            );


        case "favorites":

            return works.filter(
                (work) => {

                    return Boolean(
                        work.favorite
                    );

                }
            );


        case "all":
        default:

            return [
                ...works
            ];

    }

}



/* ========================================
   SORTING
   ======================================== */

function sortLibraryWorks(
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
                compareLibraryTitles
            );

            break;


        case "author":

            sortedWorks.sort(
                compareLibraryAuthors
            );

            break;


        case "newest":

            sortedWorks.sort(
                compareLibraryNewest
            );

            break;


        case "oldest":

            sortedWorks.sort(
                compareLibraryOldest
            );

            break;


        case "recent":
        default:

            sortedWorks.sort(
                compareLibraryRecent
            );

            break;

    }


    return sortedWorks;

}



function compareLibraryTitles(
    first,
    second
) {

    return getLibraryTitle(
        first
    ).localeCompare(
        getLibraryTitle(
            second
        ),
        undefined,
        {
            sensitivity:
                "base"
        }
    );

}



function compareLibraryAuthors(
    first,
    second
) {

    const authorComparison =
        getLibraryAuthor(
            first
        ).localeCompare(
            getLibraryAuthor(
                second
            ),
            undefined,
            {
                sensitivity:
                    "base"
            }
        );


    if (
        authorComparison !== 0
    ) {

        return authorComparison;

    }


    return compareLibraryTitles(
        first,
        second
    );

}



function compareLibraryNewest(
    first,
    second
) {

    const firstYear =
        getLibrarySortableYear(
            first.year,
            -Infinity
        );


    const secondYear =
        getLibrarySortableYear(
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


    return compareLibraryTitles(
        first,
        second
    );

}



function compareLibraryOldest(
    first,
    second
) {

    const firstYear =
        getLibrarySortableYear(
            first.year,
            Infinity
        );


    const secondYear =
        getLibrarySortableYear(
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


    return compareLibraryTitles(
        first,
        second
    );

}



function compareLibraryRecent(
    first,
    second
) {

    const firstDate =
        getLibraryUpdatedDate(
            first
        );


    const secondDate =
        getLibraryUpdatedDate(
            second
        );


    return (
        secondDate -
        firstDate
    );

}



/* ========================================
   CARD RENDERING
   ======================================== */

function renderLibraryCards(
    works
) {

    libraryGrid.innerHTML =
        "";


    if (
        works.length === 0
    ) {

        showLibraryEmptyState();

        return;

    }


    hideLibraryEmptyState();


    works.forEach(
        (work) => {

            libraryGrid.appendChild(
                createLibraryCard(
                    work
                )
            );

        }
    );

}



/* ========================================
   CREATE LIBRARY CARD
   ======================================== */

function createLibraryCard(
    work
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "library-work-card";


    const url =
        getLibraryWorkURL(
            work
        );


    if (url) {

        card.classList.add(
            "library-work-card-clickable"
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
            `View details for ${getLibraryTitle(work)}`
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



    /*
     * TOP LABEL
     */

    const labelRow =
        document.createElement(
            "div"
        );


    labelRow.className =
        "library-card-label-row";


    const statusLabel =
        document.createElement(
            "span"
        );


    statusLabel.className =
        "library-card-status";


    statusLabel.textContent =
        getReadingStatusLabel(
            work.status
        );


    labelRow.appendChild(
        statusLabel
    );


    if (
        work.favorite
    ) {

        const favorite =
            document.createElement(
                "span"
            );


        favorite.className =
            "library-card-favorite";


        favorite.textContent =
            "★ Favorite";


        labelRow.appendChild(
            favorite
        );

    }



    /*
     * TITLE
     */

    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        getLibraryTitle(
            work
        );



    /*
     * AUTHOR
     */

    const author =
        document.createElement(
            "p"
        );


    author.className =
        "library-card-author";


    author.textContent =
        getLibraryAuthor(
            work
        );



    /*
     * METADATA
     */

    const metadata =
        document.createElement(
            "div"
        );


    metadata.className =
        "library-card-metadata";


    if (
        work.year
    ) {

        const year =
            document.createElement(
                "span"
            );


        year.textContent =
            work.year;


        metadata.appendChild(
            year
        );

    }


    if (
        work.type
    ) {

        const type =
            document.createElement(
                "span"
            );


        type.textContent =
            work.type;


        metadata.appendChild(
            type
        );

    }



    /*
     * SOURCE
     */

    const source =
        document.createElement(
            "p"
        );


    source.className =
        "library-card-source";


    source.textContent =
        work.source ===
        "crypt-and-quill"
            ? "Crypt & Quill Archive"
            : "Open Library";



    /*
     * BUILD CARD
     */

    card.appendChild(
        labelRow
    );


    card.appendChild(
        title
    );


    card.appendChild(
        author
    );


    card.appendChild(
        metadata
    );


    card.appendChild(
        source
    );


    return card;

}



/* ========================================
   WORK DETAILS URL
   ======================================== */

function getLibraryWorkURL(
    work
) {

    if (
        !work ||
        !work.id
    ) {
        return null;
    }


    /*
     * External Open Library records are stored
     * with IDs such as:
     *
     * ol:OL12345W
     */
    if (
        work.source ===
        "openlibrary" ||
        work.id.startsWith(
            "ol:"
        )
    ) {

        const openLibraryId =
            work.id.replace(
                /^ol:/,
                ""
            );


        return (
            "work-details.html?ol=" +
            encodeURIComponent(
                openLibraryId
            )
        );

    }


    /*
     * Everything else is assumed to use a
     * Crypt & Quill internal ID.
     */
    return (
        "work-details.html?id=" +
        encodeURIComponent(
            work.id
        )
    );

}



/* ========================================
   HEADING + COUNT
   ======================================== */

function updateLibraryHeading(
    count
) {

    libraryTitle.textContent =
        getLibrarySectionTitle();


    const label =
        count === 1
            ? "work"
            : "works";


    libraryCount.textContent =
        `${count} ${label}`;

}



function getLibrarySectionTitle() {

    switch (
        activeLibraryFilter
    ) {

        case "want-to-read":

            return "Want to Read";


        case "currently-reading":

            return "Currently Reading";


        case "read":

            return "Read";


        case "favorites":

            return "Favorites";


        case "all":
        default:

            return "All Saved Works";

    }

}



/* ========================================
   EMPTY STATE
   ======================================== */

function showLibraryEmptyState() {

    libraryGrid.hidden =
        true;


    emptyState.hidden =
        false;


    switch (
        activeLibraryFilter
    ) {

        case "want-to-read":

            emptyMessage.textContent =
                "You have not added anything to your Want to Read shelf yet.";

            break;


        case "currently-reading":

            emptyMessage.textContent =
                "You are not currently reading anything in the archive.";

            break;


        case "read":

            emptyMessage.textContent =
                "No completed works have been recorded yet.";

            break;


        case "favorites":

            emptyMessage.textContent =
                "You have not marked any works as favorites yet.";

            break;


        case "all":
        default:

            emptyMessage.textContent =
                "Save works from the archive to begin building your personal library.";

            break;

    }

}



function hideLibraryEmptyState() {

    libraryGrid.hidden =
        false;


    emptyState.hidden =
        true;

}



/* ========================================
   DISPLAY HELPERS
   ======================================== */

function getReadingStatusLabel(
    status
) {

    switch (
        status
    ) {

        case "want-to-read":

            return "Want to Read";


        case "currently-reading":

            return "Currently Reading";


        case "read":

            return "Read";


        default:

            return "Saved";

    }

}



function getLibraryTitle(
    work
) {

    return (
        work.title ||
        "Untitled Work"
    );

}



function getLibraryAuthor(
    work
) {

    return (
        work.author ||
        "Unknown Author"
    );

}



function getLibrarySortableYear(
    value,
    fallback
) {

    const year =
        Number(
            value
        );


    return Number.isFinite(
        year
    )
        ? year
        : fallback;

}



function getLibraryUpdatedDate(
    work
) {

    if (
        !work.updatedAt
    ) {
        return 0;
    }


    const date =
        new Date(
            work.updatedAt
        );


    const timestamp =
        date.getTime();


    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;

}
