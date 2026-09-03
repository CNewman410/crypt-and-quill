
/* ========================================
   Crypt & Quill
   Local Storage / Personal Library
   ======================================== */


/* ========================================
   STORAGE SETTINGS
   ======================================== */

const CRYPT_QUILL_LIBRARY_KEY =
    "cryptAndQuill.library.v1";


const VALID_READING_STATUSES = [
    "want-to-read",
    "currently-reading",
    "read"
];



/* ========================================
   LOAD / SAVE LIBRARY
   ======================================== */

/**
 * Return the complete personal library object.
 */
function getPersonalLibrary() {

    const storedValue =
        localStorage.getItem(
            CRYPT_QUILL_LIBRARY_KEY
        );


    if (!storedValue) {
        return {};
    }


    try {

        const parsed =
            JSON.parse(
                storedValue
            );


        if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {

            return parsed;

        }

    }
    catch (error) {

        console.warn(
            "Crypt & Quill library data could not be read.",
            error
        );

    }


    return {};

}



/**
 * Save the complete personal library.
 */
function savePersonalLibrary(
    library
) {

    localStorage.setItem(
        CRYPT_QUILL_LIBRARY_KEY,
        JSON.stringify(library)
    );

}



/* ========================================
   WORK ID
   ======================================== */

/**
 * Determine the permanent storage ID for the
 * current Work Details page.
 *
 * Curated works:
 *
 * cq-the-jaunt
 *
 * External Open Library works:
 *
 * ol:OL12345W
 */
function getCurrentLibraryWorkId() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    const curatedId =
        parameters.get(
            "id"
        );


    if (curatedId) {

        return curatedId;

    }


    const openLibraryId =
        parameters.get(
            "ol"
        );


    if (openLibraryId) {

        return (
            "ol:" +
            openLibraryId
        );

    }


    return null;

}



/* ========================================
   GET ONE WORK
   ======================================== */

function getSavedLibraryWork(
    workId
) {

    if (!workId) {
        return null;
    }


    const library =
        getPersonalLibrary();


    return (
        library[workId] ||
        null
    );

}



/* ========================================
   SAVE ONE WORK
   ======================================== */

function saveLibraryWork(
    workId,
    changes = {}
) {

    if (!workId) {
        return;
    }


    const library =
        getPersonalLibrary();


    const existing =
        library[workId] || {};


    const metadata =
        getCurrentWorkMetadata();


    const updatedWork = {

        ...existing,

        ...metadata,

        ...changes,

        id:
            workId,

        updatedAt:
            new Date().toISOString()

    };


    /*
     * If the work has no reading status and is
     * not a favorite, it no longer needs to stay
     * in My Library.
     */
    if (
        !updatedWork.status &&
        !updatedWork.favorite
    ) {

        delete library[workId];

    }
    else {

        library[workId] =
            updatedWork;

    }


    savePersonalLibrary(
        library
    );

}



/* ========================================
   PAGE METADATA
   ======================================== */

/**
 * Read basic metadata from the already-rendered
 * Work Details page.
 *
 * This means storage.js does not need to make
 * duplicate Open Library API requests.
 */
function getCurrentWorkMetadata() {

    const titleElement =
        document.getElementById(
            "work-details-title"
        );

    const authorElement =
        document.getElementById(
            "work-details-author"
        );

    const yearElement =
        document.getElementById(
            "work-details-year"
        );

    const typeElement =
        document.getElementById(
            "work-details-type"
        );


    const parameters =
        new URLSearchParams(
            window.location.search
        );


    const source =
        parameters.has("id")
            ? "crypt-and-quill"
            : "openlibrary";


    return {

        title:
            titleElement?.textContent.trim() ||
            "Untitled Work",

        author:
            authorElement?.textContent.trim() ||
            "Unknown Author",

        year:
            getStoredYear(
                yearElement?.textContent
            ),

        type:
            typeElement?.textContent.trim() ||
            "Work",

        source:
            source

    };

}



/**
 * Store a numeric year when possible.
 */
function getStoredYear(
    value
) {

    if (!value) {
        return null;
    }


    const match =
        String(value).match(
            /\b(1[0-9]{3}|20[0-9]{2})\b/
        );


    if (!match) {
        return null;
    }


    return Number(
        match[1]
    );

}



/* ========================================
   READING STATUS
   ======================================== */

function setReadingStatus(
    workId,
    newStatus
) {

    if (
        !VALID_READING_STATUSES.includes(
            newStatus
        )
    ) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    /*
     * Clicking the active status again removes it.
     */
    const status =
        savedWork?.status === newStatus
            ? null
            : newStatus;


    saveLibraryWork(
        workId,
        {
            status:
                status
        }
    );


    updateLibraryButtons();

}



/* ========================================
   FAVORITE
   ======================================== */

function toggleFavorite(
    workId
) {

    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const favorite =
        !Boolean(
            savedWork?.favorite
        );


    saveLibraryWork(
        workId,
        {
            favorite:
                favorite
        }
    );


    updateLibraryButtons();

}



/* ========================================
   WORK DETAILS PAGE INITIALIZATION
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeLibraryControls
);


function initializeLibraryControls() {

    const workId =
        getCurrentLibraryWorkId();


    /*
     * storage.js may eventually load on pages
     * other than Work Details.
     */
    if (!workId) {
        return;
    }


    const statusButtons =
        document.querySelectorAll(
            "[data-reading-status]"
        );


    const favoriteButton =
        document.getElementById(
            "favorite-button"
        );


    statusButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const status =
                        button.dataset.readingStatus;


                    setReadingStatus(
                        workId,
                        status
                    );

                }
            );

        }
    );


    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            () => {

                toggleFavorite(
                    workId
                );

            }
        );

    }


    updateLibraryButtons();

}



/* ========================================
   UPDATE BUTTON APPEARANCE
   ======================================== */

function updateLibraryButtons() {

    const workId =
        getCurrentLibraryWorkId();


    if (!workId) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const currentStatus =
        savedWork?.status ||
        null;


    const favorite =
        Boolean(
            savedWork?.favorite
        );


    const statusButtons =
        document.querySelectorAll(
            "[data-reading-status]"
        );


    statusButtons.forEach(
        (button) => {

            const buttonStatus =
                button.dataset.readingStatus;


            const isActive =
                buttonStatus ===
                currentStatus;


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


    const favoriteButton =
        document.getElementById(
            "favorite-button"
        );


    if (favoriteButton) {

        favoriteButton.classList.toggle(
            "active",
            favorite
        );


        favoriteButton.setAttribute(
            "aria-pressed",
            String(favorite)
        );

    }


    updateLibraryMessage(
        currentStatus,
        favorite
    );

}



/* ========================================
   STATUS MESSAGE
   ======================================== */

function updateLibraryMessage(
    status,
    favorite
) {

    const message =
        document.getElementById(
            "library-status-message"
        );


    if (!message) {
        return;
    }


    const statusLabels = {

        "want-to-read":
            "Want to Read",

        "currently-reading":
            "Currently Reading",

        "read":
            "Read"

    };


    const pieces = [];


    if (
        status &&
        statusLabels[status]
    ) {

        pieces.push(
            statusLabels[status]
        );

    }


    if (favorite) {

        pieces.push(
            "Favorite"
        );

    }


    if (
        pieces.length === 0
    ) {

        message.textContent =
            "This work has not been added to your personal library.";

        return;

    }


    message.textContent =
        "Saved to your library: " +
        pieces.join(" · ");

}



/* ========================================
   FUTURE MY LIBRARY HELPERS
   ======================================== */

/**
 * Return saved works as an array.
 *
 * We'll use this when we build My Library.
 */
function getSavedLibraryWorks() {

    const library =
        getPersonalLibrary();


    return Object.values(
        library
    );

}



/**
 * Remove one work completely from My Library.
 */
function removeLibraryWork(
    workId
) {

    const library =
        getPersonalLibrary();


    delete library[
        workId
    ];


    savePersonalLibrary(
        library
    );

}
