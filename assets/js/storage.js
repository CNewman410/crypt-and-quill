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
    "read",
    "dnf"
];


const READING_DATE_FIELDS = [
    "dateStarted",
    "dateFinished",
    "dateAbandoned"
];


const READING_SESSION_STATUSES = [
    "currently-reading",
    "read",
    "dnf"
];


const RATING_CATEGORIES = {

    storyPlot: {
        label: "Story / Plot"
    },

    writing: {
        label: "Writing"
    },

    atmosphere: {
        label: "Atmosphere"
    },

    characters: {
        label: "Characters"
    },

    originality: {
        label: "Originality"
    },

    horrorUnease: {
        label: "Horror / Unease Factor"
    },

    ending: {
        label: "Ending"
    },

    rereadValue: {
        label: "Re-read Value"
    }

};



/* ========================================
   LOAD / SAVE LIBRARY
   ======================================== */

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

            /*
             * Reading dates originally lived only at the top level. Keep
             * those fields as a compatibility mirror while adding one
             * deterministic legacy session. This migration runs on every
             * read, but only writes when a record actually changes, so old
             * bookmarks and existing v1 localStorage data remain safe.
             */
            let didMigrate = false;


            Object.entries(parsed).forEach(
                ([workId, work]) => {

                    const migratedWork =
                        migrateReadingHistory(
                            workId,
                            work
                        );


                    if (migratedWork !== work) {
                        parsed[workId] = migratedWork;
                        didMigrate = true;
                    }

                }
            );


            if (didMigrate) {
                savePersonalLibrary(parsed);
            }


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


function migrateReadingHistory(
    workId,
    work
) {

    if (
        !work ||
        typeof work !== "object" ||
        Array.isArray(work) ||
        Array.isArray(work.readingHistory)
    ) {
        return work;
    }


    const hasLegacyDate =
        READING_DATE_FIELDS.some(
            (field) => isValidReadingDate(work[field])
        );


    return {
        ...work,
        readingHistory: hasLegacyDate
            ? [{
                id: createLegacyReadingSessionId(workId),
                status: getReadingSessionStatus(work),
                dateStarted: getValidReadingDate(work.dateStarted),
                dateFinished: getValidReadingDate(work.dateFinished),
                dateAbandoned: getValidReadingDate(work.dateAbandoned)
            }]
            : []
    };

}


function createLegacyReadingSessionId(
    workId
) {

    let hash = 0;


    Array.from(String(workId)).forEach(
        (character) => {

            hash = (
                (hash * 31) +
                character.charCodeAt(0)
            ) >>> 0;

        }
    );


    return `legacy-${hash.toString(36)}`;

}



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
     * Remove the record only if nothing personal
     * remains attached to it.
     */
    if (
        !hasSavedPersonalData(
            updatedWork
        )
    ) {

        delete library[
            workId
        ];

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
   SAVED DATA CHECK
   ======================================== */

function hasSavedPersonalData(
    work
) {

    if (
        work.status
    ) {
        return true;
    }


    if (
        work.favorite
    ) {
        return true;
    }


    if (
        hasMeaningfulRatings(
            work.ratings
        )
    ) {
        return true;
    }


    if (
        typeof work.review === "string" &&
        work.review.trim()
    ) {
        return true;
    }


    if (
        Array.isArray(work.readingHistory) &&
        work.readingHistory.some(isMeaningfulReadingSession)
    ) {
        return true;
    }


    if (
        READING_DATE_FIELDS.some(
            (field) => isValidReadingDate(
                work[field]
            )
        )
    ) {
        return true;
    }


    return false;

}



function hasMeaningfulRatings(
    ratings
) {

    if (
        !ratings ||
        typeof ratings !== "object"
    ) {
        return false;
    }


    return Object.values(
        ratings
    ).some(
        (value) => {

            const rating =
                Number(value);


            return (
                Number.isFinite(rating) &&
                rating >= 0.5 &&
                rating <= 5
            );

        }
    );

}



/* ========================================
   PAGE METADATA
   ======================================== */

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


    const status =
        savedWork?.status === newStatus
            ? null
            : newStatus;


    const changes = {
        status:
            status
    };

    const currentDates = getCurrentReadingSessionDates(savedWork);
    const normalized = normalizeReadingSessionDates(
        status,
        currentDates
    );
    const hasCurrentSession =
        Array.isArray(savedWork?.readingHistory) &&
        savedWork.readingHistory.length > 0;


    if (
        READING_SESSION_STATUSES.includes(status) ||
        hasCurrentSession
    ) {
        Object.assign(
            changes,
            buildCurrentReadingSessionChanges(
                workId,
                savedWork,
                status
            )
        );
    }


    saveLibraryWork(
        workId,
        changes
    );


    updateLibraryButtons();

    const clearedInputFields = clearIncompatibleReadingDateInputs(status);
    const clearedFields = Array.from(new Set([
        ...normalized.clearedFields,
        ...clearedInputFields
    ]));
    const consistencyMessage = getReadingDateConsistencyMessage(
        status || normalized.status,
        clearedFields
    );

    if (consistencyMessage) {
        setReadingDatesMessage(consistencyMessage);
    }

}



/* ========================================
   READING DATES
   ======================================== */

function isValidReadingDate(
    value
) {

    if (
        typeof value !== "string" ||
        !/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(value)
    ) {
        return false;
    }


    const parts =
        value.split("-");


    if (parts.length === 1) {
        return true;
    }


    const month =
        Number(parts[1]);


    if (
        month < 1 ||
        month > 12
    ) {
        return false;
    }


    if (parts.length === 2) {
        return true;
    }


    const date =
        new Date(
            `${value}T00:00:00Z`
        );


    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );

}


function getReadingDatePrecision(
    value
) {

    if (!isValidReadingDate(value)) {
        return null;
    }


    return [
        "year",
        "month",
        "day"
    ][value.split("-").length - 1];

}


function getLocalReadingDate(
    date = new Date()
) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function getValidReadingDate(
    value
) {

    return isValidReadingDate(value)
        ? value
        : null;

}


function getReadingSessionStatus(
    work
) {

    if (
        READING_SESSION_STATUSES.includes(work?.status)
    ) {
        return work.status;
    }


    if (isValidReadingDate(work?.dateAbandoned)) {
        return "dnf";
    }


    if (isValidReadingDate(work?.dateFinished)) {
        return "read";
    }


    return "currently-reading";

}


function getCurrentReadingSessionDates(
    savedWork
) {

    const latestSession = Array.isArray(savedWork?.readingHistory)
        ? savedWork.readingHistory[savedWork.readingHistory.length - 1]
        : null;


    return Object.fromEntries(
        READING_DATE_FIELDS.map(
            (field) => {

                const source = latestSession &&
                    Object.prototype.hasOwnProperty.call(latestSession, field)
                    ? latestSession
                    : savedWork;


                return [field, getValidReadingDate(source?.[field])];

            }
        )
    );

}


function normalizeReadingSessionDates(
    status,
    dates
) {

    const normalizedDates = Object.fromEntries(
        READING_DATE_FIELDS.map(
            (field) => [field, getValidReadingDate(dates?.[field])]
        )
    );

    /*
     * An explicit work status controls the latest session. Without one,
     * inference stays deterministic: an abandoned date implies DNF first;
     * otherwise a finished date implies Read. The matching terminal date
     * wins, so one session can never retain both terminal outcomes.
     */
    const sessionStatus = READING_SESSION_STATUSES.includes(status)
        ? status
        : getReadingSessionStatus(normalizedDates);
    const clearedFields = [];


    if (
        sessionStatus === "currently-reading" ||
        sessionStatus === "dnf"
    ) {
        if (normalizedDates.dateFinished) {
            clearedFields.push("dateFinished");
        }

        normalizedDates.dateFinished = null;
    }


    if (
        sessionStatus === "currently-reading" ||
        sessionStatus === "read"
    ) {
        if (normalizedDates.dateAbandoned) {
            clearedFields.push("dateAbandoned");
        }

        normalizedDates.dateAbandoned = null;
    }


    return {
        dates: normalizedDates,
        status: sessionStatus,
        clearedFields
    };

}


function getReadingDateConsistencyMessage(
    status,
    clearedFields
) {

    const clearedFinished = clearedFields.includes("dateFinished");
    const clearedAbandoned = clearedFields.includes("dateAbandoned");


    if (clearedFinished && clearedAbandoned) {
        return "Finished and DNF dates cleared because this work is marked Currently Reading.";
    }


    if (clearedFinished) {
        return `Finished date cleared because this work is marked ${
            status === "dnf" ? "Did Not Finish" : "Currently Reading"
        }.`;
    }


    if (clearedAbandoned) {
        return `DNF date cleared because this work is marked ${
            status === "read" ? "Read" : "Currently Reading"
        }.`;
    }


    return "";

}


function clearIncompatibleReadingDateInputs(
    status
) {

    const incompatibleFields = {
        "currently-reading": ["dateFinished", "dateAbandoned"],
        read: ["dateAbandoned"],
        dnf: ["dateFinished"]
    }[status] || [];


    return incompatibleFields.filter(
        (field) => {

            const input = document.querySelector(
                `[data-reading-date="${field}"]`
            );


            if (!input || !input.value) {
                return false;
            }


            input.value = "";
            return true;

        }
    );

}


function isMeaningfulReadingSession(
    session
) {

    return Boolean(
        session &&
        typeof session === "object" &&
        READING_SESSION_STATUSES.includes(session.status)
    );

}


function storageGetReadingHistory(
    workId
) {

    const savedWork = getSavedLibraryWork(workId);


    return Array.isArray(savedWork?.readingHistory)
        ? savedWork.readingHistory.map((session) => ({ ...session }))
        : [];

}


function storageGetReadingSessions(
    workId
) {

    return storageGetReadingHistory(workId);

}


function storageGetCompletedReadingSessions() {

    return getSavedLibraryWorks().flatMap(
        (work) => (
            Array.isArray(work.readingHistory)
                ? work.readingHistory
                : []
        )
            .filter((session) => session.status === "read")
            .map((session) => ({
                ...session,
                workId: work.id
            }))
    );

}


/*
 * Flatten every dated reading-history session for archive views such as the
 * Reading Calendar. Work metadata remains the saved local metadata; callers
 * do not need to contact Open Library. Partial dates retain their precision.
 */
function storageGetReadingEvents() {

    const eventFields = [
        ["dateStarted", "started"],
        ["dateFinished", "finished"],
        ["dateAbandoned", "dnf"]
    ];


    return getSavedLibraryWorks().flatMap(
        (work) => storageGetReadingSessions(work.id).flatMap(
            (session, sessionIndex) => eventFields.flatMap(
                ([field, eventType]) => {

                    const date = getValidReadingDate(session[field]);


                    if (!date) {
                        return [];
                    }


                    return [{
                        workId: work.id,
                        title: work.title || "Untitled Work",
                        sessionId: session.id || `session-${sessionIndex + 1}`,
                        eventType,
                        date,
                        precision: getReadingDatePrecision(date)
                    }];

                }
            )
        )
    );

}


function createReadingSessionId(
    workId
) {

    return (
        `session-${Date.now().toString(36)}-` +
        `${createLegacyReadingSessionId(workId).slice(7)}`
    );

}


function buildCurrentReadingSessionChanges(
    workId,
    savedWork,
    status,
    dates = null
) {

    const history = Array.isArray(savedWork?.readingHistory)
        ? savedWork.readingHistory.map((session) => ({ ...session }))
        : [];

    const suppliedDates = dates || getCurrentReadingSessionDates(savedWork);

    const normalized = normalizeReadingSessionDates(
        status,
        suppliedDates
    );
    const currentDates = normalized.dates;

    const hasSuppliedDate = READING_DATE_FIELDS.some(
        (field) => Boolean(currentDates[field])
    );

    const sessionIsRequired =
        READING_SESSION_STATUSES.includes(status);

    let session = history[history.length - 1];


    if (
        !session &&
        (hasSuppliedDate || sessionIsRequired)
    ) {
        session = {
            id: createReadingSessionId(workId)
        };
        history.push(session);
    }


    if (
        session &&
        !hasSuppliedDate &&
        !sessionIsRequired
    ) {
        history.pop();
        session = null;
    }


    if (session) {

        session.status = normalized.status;


        READING_DATE_FIELDS.forEach(
            (field) => {
                session[field] = currentDates[field] || null;
            }
        );

    }


    return {
        readingHistory: history,
        ...currentDates
    };

}


function saveReadingDates(
    workId
) {

    const changes = {};


    READING_DATE_FIELDS.forEach(
        (field) => {

            const input =
                document.querySelector(
                    `[data-reading-date="${field}"]`
                );


            if (!input) {
                return;
            }


            changes[field] =
                isValidReadingDate(input.value)
                    ? input.value
                    : null;

        }
    );


    const savedWork = getSavedLibraryWork(workId);
    const normalized = normalizeReadingSessionDates(
        savedWork?.status,
        changes
    );
    const consistencyMessage = getReadingDateConsistencyMessage(
        normalized.status,
        normalized.clearedFields
    );

    Object.assign(changes, normalized.dates);
    const hasDate = READING_DATE_FIELDS.some(
        (field) => Boolean(changes[field])
    );
    const hasSession = Array.isArray(savedWork?.readingHistory) &&
        savedWork.readingHistory.length > 0;


    if (hasDate || hasSession) {
        Object.assign(
            changes,
            buildCurrentReadingSessionChanges(
                workId,
                savedWork,
                savedWork?.status,
                changes
            )
        );
    }


    saveLibraryWork(workId, changes);


    updateReadingDateControls();

    if (consistencyMessage) {
        setReadingDatesMessage(consistencyMessage);
    }

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
   RATINGS
   ======================================== */

function setCategoryRating(
    workId,
    category,
    value
) {

    if (
        !RATING_CATEGORIES[
            category
        ]
    ) {
        return;
    }


    const rating =
        Number(value);


    if (
        !Number.isFinite(rating) ||
        rating < 0.5 ||
        rating > 5 ||
        rating * 2 % 1 !== 0
    ) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const ratings = {

        ...(savedWork?.ratings || {})

    };


    ratings[
        category
    ] = rating;


    const overallRating =
        calculateOverallRating(
            ratings
        );


    saveLibraryWork(
        workId,
        {
            ratings:
                ratings,

            overallRating:
                overallRating
        }
    );


    renderRatingControls();

    updateLibraryButtons();

}



function clearCategoryRating(
    workId,
    category
) {

    const savedWork =
        getSavedLibraryWork(
            workId
        );


    if (
        !savedWork?.ratings
    ) {
        return;
    }


    const ratings = {

        ...savedWork.ratings

    };


    delete ratings[
        category
    ];


    const overallRating =
        calculateOverallRating(
            ratings
        );


    saveLibraryWork(
        workId,
        {
            ratings:
                ratings,

            overallRating:
                overallRating
        }
    );


    renderRatingControls();

    updateLibraryButtons();

}



/* ========================================
   OVERALL RATING
   ======================================== */

function calculateOverallRating(
    ratings
) {

    if (
        !ratings ||
        typeof ratings !== "object"
    ) {
        return null;
    }


    const validRatings =
        Object.values(
            ratings
        )
            .map(Number)
            .filter(
                (rating) => {

                    return (
                        Number.isFinite(
                            rating
                        ) &&
                        rating >= 0.5 &&
                        rating <= 5
                    );

                }
            );


    if (
        validRatings.length === 0
    ) {
        return null;
    }


    const total =
        validRatings.reduce(
            (sum, rating) => {

                return (
                    sum +
                    rating
                );

            },
            0
        );


    return Number(
        (
            total /
            validRatings.length
        ).toFixed(1)
    );

}



/* ========================================
   INITIALIZE PERSONAL CONTROLS
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializePersonalControls
);


function initializePersonalControls() {

    initializeLibraryControls();

    initializeReadingDateControls();

    initializeRatingControls();

    initializeReviewControls();

}



/* ========================================
   READING DATE CONTROLS
   ======================================== */

function initializeReadingDateControls() {

    const form =
        document.getElementById(
            "reading-dates-form"
        );


    const workId =
        getCurrentLibraryWorkId();


    if (
        !form ||
        !workId
    ) {
        return;
    }


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            saveReadingDates(
                workId
            );

        }
    );


    form.querySelectorAll("[data-reading-date-action]").forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => applyReadingDateAction(button)
            );

        }
    );


    updateReadingDateControls();

}


function applyReadingDateAction(
    button
) {

    const field = button.dataset.readingDateTarget;
    const input = document.querySelector(
        `[data-reading-date="${field}"]`
    );


    if (!input) {
        return;
    }


    input.value = button.dataset.readingDateAction === "today"
        ? getLocalReadingDate()
        : "";


    input.focus();

}


function updateReadingDateControls() {

    const workId =
        getCurrentLibraryWorkId();


    if (!workId) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    READING_DATE_FIELDS.forEach(
        (field) => {

            const input =
                document.querySelector(
                    `[data-reading-date="${field}"]`
                );


            if (input) {

                const currentSession =
                    savedWork?.readingHistory?.[
                        savedWork.readingHistory.length - 1
                    ];


                input.value = getValidReadingDate(currentSession?.[field]) ||
                    getValidReadingDate(savedWork?.[field]) ||
                    "";

            }

        }
    );


    const message =
        document.getElementById(
            "reading-dates-message"
        );


    if (message) {

        const datePieces =
            getReadingDateSummary(
                savedWork
            );


        message.textContent =
            datePieces.length > 0
                ? datePieces.join(" · ")
                : "Reading dates are optional.";

    }

}


function setReadingDatesMessage(
    text
) {

    const message = document.getElementById(
        "reading-dates-message"
    );


    if (message) {
        message.textContent = text;
    }

}


function getReadingDateSummary(
    savedWork
) {

    if (!savedWork) {
        return [];
    }


    return [
        ["Started", savedWork.dateStarted],
        ["Finished", savedWork.dateFinished],
        ["Abandoned", savedWork.dateAbandoned]
    ]
        .filter(
            ([, value]) => isValidReadingDate(value)
        )
        .map(
            ([label, value]) => {

                return (
                    `${label} ${formatReadingDate(value)}`
                );

            }
        );

}


function formatReadingDate(
    value
) {

    const parts =
        value.split("-");


    if (parts.length === 1) {
        return value;
    }


    const date =
        new Date(
            `${value}${
                parts.length === 2
                    ? "-01"
                    : ""
            }T00:00:00Z`
        );


    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "short",
            day:
                parts.length === 3
                    ? "numeric"
                    : undefined,
            timeZone: "UTC"
        }
    ).format(date);

}



/* ========================================
   LIBRARY BUTTON INITIALIZATION
   ======================================== */

function initializeLibraryControls() {

    const workId =
        getCurrentLibraryWorkId();


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
   UPDATE LIBRARY BUTTONS
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
        savedWork
    );

}



/* ========================================
   LIBRARY STATUS MESSAGE
   ======================================== */

function updateLibraryMessage(
    savedWork
) {

    const message =
        document.getElementById(
            "library-status-message"
        );


    if (!message) {
        return;
    }


    if (!savedWork) {

        message.textContent =
            "This work has not been added to your personal library.";

        return;

    }


    const statusLabels = {

        "want-to-read":
            "Want to Read",

        "currently-reading":
            "Currently Reading",

        "read":
            "Read",

        "dnf":
            "Did Not Finish"

    };


    const pieces = [];


    if (
        savedWork.status &&
        statusLabels[
            savedWork.status
        ]
    ) {

        pieces.push(
            statusLabels[
                savedWork.status
            ]
        );

    }


    if (
        savedWork.favorite
    ) {

        pieces.push(
            "Favorite"
        );

    }


    if (
        Number.isFinite(
            Number(
                savedWork.overallRating
            )
        )
    ) {

        pieces.push(
            `Rated ${Number(
                savedWork.overallRating
            ).toFixed(1)} / 5`
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
        pieces.join(
            " · "
        );

}



/* ========================================
   RATING INITIALIZATION
   ======================================== */

function initializeRatingControls() {

    const container =
        document.getElementById(
            "category-ratings"
        );


    const workId =
        getCurrentLibraryWorkId();


    if (
        !container ||
        !workId
    ) {
        return;
    }


    buildRatingRows(
        container,
        workId
    );


    renderRatingControls();

}



/* ========================================
   BUILD RATING ROWS
   ======================================== */

function buildRatingRows(
    container,
    workId
) {

    container.innerHTML =
        "";


    Object.entries(
        RATING_CATEGORIES
    ).forEach(
        ([categoryKey, category]) => {

            const row =
                createRatingRow(
                    categoryKey,
                    category.label,
                    workId
                );


            container.appendChild(
                row
            );

        }
    );

}



/* ========================================
   CREATE RATING ROW
   ======================================== */
function createRatingRow(
    categoryKey,
    label,
    workId
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "category-rating-row";


    row.dataset.ratingCategory =
        categoryKey;



    const labelElement =
        document.createElement(
            "p"
        );


    labelElement.className =
        "category-rating-label";


    labelElement.textContent =
        label;



    const starArea =
        document.createElement(
            "div"
        );


    starArea.className =
        "rating-stars";


    starArea.setAttribute(
        "role",
        "group"
    );


    starArea.setAttribute(
        "aria-label",
        `${label} rating`
    );



    /* ========================================
       CREATE FIVE STARS
       ======================================== */

    for (
        let starIndex = 1;
        starIndex <= 5;
        starIndex += 1
    ) {

        const star =
            document.createElement(
                "button"
            );


        star.type =
            "button";


        star.className =
            "rating-star";


        star.dataset.starIndex =
            String(
                starIndex
            );


        star.setAttribute(
            "aria-label",
            `${label}: ${starIndex} stars. Click the left half for ${starIndex - 0.5}.`
        );



        /* ========================================
           SAVE RATING ON CLICK
           ======================================== */

        star.addEventListener(
            "click",
            (event) => {

                let ratingValue =
                    starIndex;


                /*
                 * Mouse/touch click:
                 * left half = half star
                 * right half = whole star
                 */
                if (
                    event.detail !== 0
                ) {

                    const rectangle =
                        star.getBoundingClientRect();


                    const clickPosition =
                        event.clientX -
                        rectangle.left;


                    const clickedLeftHalf =
                        clickPosition <=
                        rectangle.width / 2;


                    ratingValue =
                        clickedLeftHalf
                            ? starIndex - 0.5
                            : starIndex;

                }


                setCategoryRating(
                    workId,
                    categoryKey,
                    ratingValue
                );

            }
        );



        /* ========================================
           PREVIEW HALF/FULL STAR ON HOVER
           ======================================== */

        star.addEventListener(
            "pointermove",
            (event) => {

                const rectangle =
                    star.getBoundingClientRect();


                const pointerPosition =
                    event.clientX -
                    rectangle.left;


                const hoveringLeftHalf =
                    pointerPosition <=
                    rectangle.width / 2;


                const previewValue =
                    hoveringLeftHalf
                        ? starIndex - 0.5
                        : starIndex;


                previewCategoryRating(
                    row,
                    previewValue
                );

            }
        );


        starArea.appendChild(
            star
        );

    }



    /* ========================================
       RESTORE SAVED RATING AFTER HOVER
       ======================================== */

    starArea.addEventListener(
        "pointerleave",
        () => {

            renderRatingControls();

        }
    );



    const value =
        document.createElement(
            "span"
        );


    value.className =
        "category-rating-value";


    value.dataset.ratingValue =
        categoryKey;


    value.textContent =
        "—";



    const clearButton =
        document.createElement(
            "button"
        );


    clearButton.type =
        "button";


    clearButton.className =
        "category-rating-clear";


    clearButton.dataset.clearRating =
        categoryKey;


    clearButton.textContent =
        "Clear";


    clearButton.addEventListener(
        "click",
        () => {

            clearCategoryRating(
                workId,
                categoryKey
            );

        }
    );



    row.appendChild(
        labelElement
    );


    row.appendChild(
        starArea
    );


    row.appendChild(
        value
    );


    row.appendChild(
        clearButton
    );


    return row;

}



/* ========================================
   RATING HOVER PREVIEW
   ======================================== */

function previewCategoryRating(
    row,
    ratingValue
) {

    const stars =
        row.querySelectorAll(
            ".rating-star"
        );


    stars.forEach(
        (star) => {

            const starIndex =
                Number(
                    star.dataset.starIndex
                );


            let fill =
                0;


            if (
                ratingValue >=
                starIndex
            ) {

                fill =
                    100;

            }
            else if (
                ratingValue >=
                starIndex - 0.5
            ) {

                fill =
                    50;

            }


            star.style.setProperty(
                "--fill",
                `${fill}%`
            );

        }
    );

}




/* ========================================
   RENDER RATING CONTROLS
   ======================================== */

function renderRatingControls() {

    const workId =
        getCurrentLibraryWorkId();


    const ratingContainer =
        document.getElementById(
            "category-ratings"
        );


    if (
        !workId ||
        !ratingContainer
    ) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const ratings =
        savedWork?.ratings ||
        {};


    Object.keys(
        RATING_CATEGORIES
    ).forEach(
        (categoryKey) => {

            const rating =
                Number(
                    ratings[
                        categoryKey
                    ]
                );


            const row =
                ratingContainer.querySelector(
                    `[data-rating-category="${categoryKey}"]`
                );


            if (!row) {
                return;
            }


            const stars =
                row.querySelectorAll(
                    ".rating-star"
                );


            stars.forEach(
                (star) => {

                    const starIndex =
                        Number(
                            star.dataset.starIndex
                        );


                    let fill =
                        0;


                    if (
                        Number.isFinite(
                            rating
                        )
                    ) {

                        if (
                            rating >= starIndex
                        ) {

                            fill =
                                100;

                        }
                        else if (
                            rating >=
                            starIndex - 0.5
                        ) {

                            fill =
                                50;

                        }

                    }


                    star.style.setProperty(
                        "--fill",
                        `${fill}%`
                    );


                    star.setAttribute(
                        "aria-pressed",
                        String(
                            fill > 0
                        )
                    );

                }
            );


            const value =
                row.querySelector(
                    `[data-rating-value="${categoryKey}"]`
                );


            if (value) {

                value.textContent =
                    Number.isFinite(rating)
                        ? rating.toFixed(1)
                        : "—";

            }


            const clearButton =
                row.querySelector(
                    `[data-clear-rating="${categoryKey}"]`
                );


            if (clearButton) {

                clearButton.disabled =
                    !Number.isFinite(
                        rating
                    );

            }

        }
    );


    renderOverallRating(
        ratings
    );

}



/* ========================================
   OVERALL RATING DISPLAY
   ======================================== */

function renderOverallRating(
    ratings
) {

    const scoreElement =
        document.getElementById(
            "overall-rating-score"
        );


    const noteElement =
        document.getElementById(
            "overall-rating-note"
        );


    if (
        !scoreElement ||
        !noteElement
    ) {
        return;
    }


    const overallRating =
        calculateOverallRating(
            ratings
        );


    const ratedCount =
        Object.values(
            ratings || {}
        ).filter(
            (value) => {

                return Number.isFinite(
                    Number(value)
                );

            }
        ).length;


    if (
        overallRating === null
    ) {

        scoreElement.textContent =
            "— / 5";


        noteElement.textContent =
            "Rate one or more categories to calculate your overall score.";


        return;

    }


    scoreElement.textContent =
        `${overallRating.toFixed(1)} / 5`;


    const categoryWord =
        ratedCount === 1
            ? "category"
            : "categories";


    noteElement.textContent =
        `Based on ${ratedCount} of 8 ${categoryWord}.`;

}

/* ========================================
   REVIEWS
   ======================================== */

function saveWorkReview(
    workId,
    reviewText
) {

    if (!workId) {
        return;
    }


    const cleanReview =
        String(
            reviewText || ""
        ).trim();


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const changes = {

        review:
            cleanReview || null,

        reviewUpdatedAt:
            cleanReview
                ? new Date().toISOString()
                : null

    };


    /*
     * Preserve the original review creation date
     * when editing an existing review.
     */
    if (
        cleanReview &&
        savedWork?.review &&
        savedWork?.reviewCreatedAt
    ) {

        changes.reviewCreatedAt =
            savedWork.reviewCreatedAt;

    }
    else if (
        cleanReview
    ) {

        changes.reviewCreatedAt =
            new Date().toISOString();

    }
    else {

        changes.reviewCreatedAt =
            null;

    }


    saveLibraryWork(
        workId,
        changes
    );


    updateReviewControls();

    updateLibraryButtons();

}



/* ========================================
   REVIEW INITIALIZATION
   ======================================== */

function initializeReviewControls() {

    const workId =
        getCurrentLibraryWorkId();


    const reviewTextarea =
        document.getElementById(
            "review-text"
        );


    const saveButton =
        document.getElementById(
            "save-review-button"
        );


    const deleteButton =
        document.getElementById(
            "delete-review-button"
        );


    if (
        !workId ||
        !reviewTextarea
    ) {
        return;
    }


    if (
        saveButton
    ) {

        saveButton.addEventListener(
            "click",
            () => {

                saveWorkReview(
                    workId,
                    reviewTextarea.value
                );

            }
        );

    }


    if (
        deleteButton
    ) {

        deleteButton.addEventListener(
            "click",
            () => {

                reviewTextarea.value =
                    "";


                saveWorkReview(
                    workId,
                    ""
                );

            }
        );

    }


    reviewTextarea.addEventListener(
        "input",
        updateReviewCharacterCount
    );


    updateReviewControls();

}



/* ========================================
   UPDATE REVIEW CONTROLS
   ======================================== */

function updateReviewControls() {

    const workId =
        getCurrentLibraryWorkId();


    const reviewTextarea =
        document.getElementById(
            "review-text"
        );


    const reviewMessage =
        document.getElementById(
            "review-status-message"
        );


    const deleteButton =
        document.getElementById(
            "delete-review-button"
        );


    if (
        !workId ||
        !reviewTextarea
    ) {
        return;
    }


    const savedWork =
        getSavedLibraryWork(
            workId
        );


    const savedReview =
        savedWork?.review ||
        "";


    reviewTextarea.value =
        savedReview;


    if (
        reviewMessage
    ) {

        reviewMessage.textContent =
            savedReview
                ? "Your review is saved."
                : "Write a review for this work.";

    }


    if (
        deleteButton
    ) {

        deleteButton.hidden =
            !savedReview;

    }


    updateReviewCharacterCount();

}



/* ========================================
   REVIEW CHARACTER COUNT
   ======================================== */

function updateReviewCharacterCount() {

    const reviewTextarea =
        document.getElementById(
            "review-text"
        );


    const countElement =
        document.getElementById(
            "review-character-count"
        );


    if (
        !reviewTextarea ||
        !countElement
    ) {
        return;
    }


    const count =
        reviewTextarea.value.length;


    countElement.textContent =
        `${count} characters`;

}

/* ========================================
   FUTURE MY LIBRARY HELPERS
   ======================================== */

function getSavedLibraryWorks() {

    const library =
        getPersonalLibrary();


    return Object.values(
        library
    );

}



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
