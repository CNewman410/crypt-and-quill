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


const libraryViewButtons =
    document.querySelectorAll(
        "[data-library-view]"
    );


const libraryResultsSection =
    document.getElementById(
        "library-results-section"
    );


const readingCalendarSection =
    document.getElementById(
        "reading-calendar-section"
    );


const readingLedgerSection =
    document.getElementById(
        "reading-ledger-section"
    );


const libraryCardControls =
    document.getElementById(
        "library-card-controls"
    );



/* ========================================
   PAGE STATE
   ======================================== */

let savedWorks = [];

let activeLibraryFilter =
    "all";

let activeLibraryView =
    "library";

let visibleCalendarMonth =
    getLocalCalendarMonth();

let selectedLedgerPeriod = null;

let lastSelectedLedgerYear = null;



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

    addLibraryViewEvents();

    addCalendarNavigationEvents();

    addLedgerNavigationEvents();


    renderMyLibrary();

}


function addLedgerNavigationEvents() {

    document.querySelectorAll("[data-ledger-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.ledgerAction;
            const years = getAvailableReadingYears(savedWorks);

            if (action === "all") {
                selectedLedgerPeriod = "all";
            }
            else if (action === "selected") {
                selectedLedgerPeriod = Number(button.dataset.ledgerYear);
            }
            else if (action === "previous" || action === "next") {
                const currentIndex = years.indexOf(selectedLedgerPeriod);
                const offset = action === "previous" ? -1 : 1;
                const nextYear = years[currentIndex + offset];
                if (nextYear) selectedLedgerPeriod = nextYear;
            }

            renderReadingLedger();
        });
    });

}


function addLibraryViewEvents() {

    libraryViewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeLibraryView = button.dataset.libraryView;
            updateLibraryView();
        });
    });

}


function updateLibraryView() {

    const showCalendar = activeLibraryView === "calendar";
    const showLedger = activeLibraryView === "ledger";


    libraryViewButtons.forEach((button) => {
        const isActive = button.dataset.libraryView === activeLibraryView;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });


    libraryResultsSection.hidden = showCalendar || showLedger;
    readingCalendarSection.hidden = !showCalendar;
    readingLedgerSection.hidden = !showLedger;
    libraryCardControls.hidden = showCalendar || showLedger;


    if (showCalendar) {
        /* Calendar intentionally shows every history event, independent of
         * the card-view shelf filter selected by the user. */
        renderReadingCalendar();
    }


    if (showLedger) {
        renderReadingLedger();
    }

}


function addCalendarNavigationEvents() {

    document.querySelectorAll("[data-calendar-action]").forEach((button) => {
        button.addEventListener("click", () => {
            visibleCalendarMonth = getCalendarNavigationMonth(
                visibleCalendarMonth,
                button.dataset.calendarAction
            );
            renderReadingCalendar();
        });
    });

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


        case "dnf":

            return works.filter(
                (work) => {

                    return (
                        work.status ===
                        "dnf"
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


    const readingDates =
        createLibraryReadingDates(
            work
        );


    if (readingDates) {

        card.appendChild(
            readingDates
        );

    }


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
   READING CALENDAR
   ======================================== */

function getLocalCalendarMonth(
    date = new Date()
) {

    return {
        year: date.getFullYear(),
        month: date.getMonth()
    };

}


function getCalendarNavigationMonth(
    currentMonth,
    action,
    today = new Date()
) {

    if (action === "today") {
        return getLocalCalendarMonth(today);
    }


    const offset = action === "previous" ? -1 : 1;
    const date = new Date(currentMonth.year, currentMonth.month + offset, 1);


    return getLocalCalendarMonth(date);

}


function getCalendarEventsForMonth(
    events,
    year,
    month
) {

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;


    return {
        exact: events.filter(
            (event) => event.precision === "day" && event.date.startsWith(`${monthKey}-`)
        ),
        approximate: events.filter(
            (event) => event.precision === "month" && event.date === monthKey
        ),
        hasYearOnly: events.some(
            (event) => event.precision === "year" && event.date === String(year)
        )
    };

}


function getReadingEventWorkURL(
    workId
) {

    return getLibraryWorkURL({ id: workId });

}


function createReadingEventLink(
    event
) {

    const link = document.createElement("a");
    link.className = `reading-calendar-event reading-calendar-event-${event.eventType}`;
    link.href = getReadingEventWorkURL(event.workId);
    link.textContent = `${getReadingEventLabel(event.eventType)} · ${event.title}`;
    link.dataset.calendarEventId = `${event.sessionId}:${event.eventType}:${event.date}`;
    return link;

}


function getReadingEventLabel(
    eventType
) {

    return {
        started: "Started",
        finished: "Finished",
        dnf: "Did Not Finish"
    }[eventType] || "Reading";

}


function renderReadingCalendar() {

    const events = storageGetReadingEvents();
    const heading = document.getElementById("reading-calendar-heading");
    const grid = document.getElementById("reading-calendar-grid");
    const empty = document.getElementById("reading-calendar-empty");
    const content = document.getElementById("reading-calendar-content");
    const monthEvents = getCalendarEventsForMonth(
        events,
        visibleCalendarMonth.year,
        visibleCalendarMonth.month
    );


    heading.textContent = new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric"
    }).format(new Date(visibleCalendarMonth.year, visibleCalendarMonth.month, 1));

    empty.hidden = events.length !== 0;
    content.hidden = events.length === 0;


    if (events.length === 0) {
        return;
    }


    renderCalendarGrid(grid, monthEvents.exact);
    renderApproximateCalendarEvents(monthEvents.approximate);
    document.getElementById("reading-calendar-year-note").hidden = !monthEvents.hasYearOnly;

}


function renderCalendarGrid(
    grid,
    exactEvents
) {

    grid.innerHTML = "";


    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        .forEach((weekday) => {
            const label = document.createElement("div");
            label.className = "reading-calendar-weekday";
            label.textContent = weekday.slice(0, 3);
            label.setAttribute("aria-label", weekday);
            grid.appendChild(label);
        });


    const firstWeekday = new Date(
        visibleCalendarMonth.year,
        visibleCalendarMonth.month,
        1
    ).getDay();
    const dayCount = new Date(
        visibleCalendarMonth.year,
        visibleCalendarMonth.month + 1,
        0
    ).getDate();


    for (let blank = 0; blank < firstWeekday; blank += 1) {
        const spacer = document.createElement("div");
        spacer.className = "reading-calendar-day reading-calendar-day-outside";
        spacer.setAttribute("aria-hidden", "true");
        grid.appendChild(spacer);
    }


    for (let day = 1; day <= dayCount; day += 1) {
        const cell = document.createElement("div");
        const number = document.createElement("span");
        const dateKey = `${visibleCalendarMonth.year}-${String(visibleCalendarMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayEvents = exactEvents.filter((event) => event.date === dateKey);

        cell.className = "reading-calendar-day";
        number.className = "reading-calendar-day-number";
        number.textContent = String(day);
        cell.appendChild(number);


        dayEvents.forEach((event, index) => {
            const link = createReadingEventLink(event);
            if (index >= 3) {
                link.hidden = true;
            }
            cell.appendChild(link);
        });


        if (dayEvents.length > 3) {
            const overflow = document.createElement("button");
            overflow.className = "reading-calendar-overflow";
            overflow.type = "button";
            overflow.textContent = `+${dayEvents.length - 3} more`;
            overflow.addEventListener("click", () => {
                cell.querySelectorAll(".reading-calendar-event[hidden]")
                    .forEach((link) => { link.hidden = false; });
                overflow.remove();
            });
            cell.appendChild(overflow);
        }


        grid.appendChild(cell);
    }

}


function renderApproximateCalendarEvents(
    events
) {

    const section = document.getElementById("reading-calendar-approximate");
    const list = document.getElementById("reading-calendar-approximate-list");
    section.hidden = events.length === 0;
    list.innerHTML = "";


    events.forEach((event) => {
        const item = document.createElement("li");
        item.appendChild(createReadingEventLink(event));
        list.appendChild(item);
    });

}


/* ========================================
   READING LEDGER
   ======================================== */

async function renderReadingLedger() {

    savedWorks = getSavedLibraryWorks();

    const empty = document.getElementById("reading-ledger-empty");
    const content = document.getElementById("reading-ledger-content");

    const hasSessions = hasMeaningfulLedgerData(savedWorks);

    const availableYears = getAvailableReadingYears(savedWorks);
    if (selectedLedgerPeriod === null) {
        selectedLedgerPeriod = getInitialLedgerPeriod(availableYears, new Date().getFullYear());
    }

    renderLedgerNavigation(availableYears, selectedLedgerPeriod);

    empty.hidden = hasSessions;
    content.hidden = !hasSessions;

    if (!hasSessions) {
        return;
    }

    const enrichedWorks = await getLedgerWorks(savedWorks);
    const ledger = calculateReadingLedger(enrichedWorks, selectedLedgerPeriod);

    const hasPeriodEvents = ledger.completed > 0 || ledger.started > 0 || ledger.abandoned > 0;
    empty.hidden = hasPeriodEvents;
    content.hidden = !hasPeriodEvents;

    if (!hasPeriodEvents) {
        empty.querySelector("h3").textContent = selectedLedgerPeriod === "all"
            ? "No entries have been inscribed."
            : `No reading entries are recorded for ${selectedLedgerPeriod}.`;
        return;
    }

    renderLedgerStats(ledger);
    renderLedgerChart(ledger);
    renderLedgerRankedList("ledger-genres-list", "ledger-genres-section", ledger.genres);
    renderLedgerRankedList("ledger-authors-list", "ledger-authors-section", ledger.authors);
    renderLedgerNotes(ledger);

}


function getReadingDateParts(value) {
    const match = typeof value === "string"
        ? /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value)
        : null;

    if (!match) return null;

    const year = Number(match[1]);
    const month = match[2] ? Number(match[2]) : null;
    const day = match[3] ? Number(match[3]) : null;
    if (year < 1 || (month !== null && (month < 1 || month > 12)) ||
        (day !== null && (day < 1 || day > 31))) return null;

    return { year, month, day };
}


function getAvailableReadingYears(works) {
    const years = new Set();

    works.flatMap((work) => getLedgerSessions(work)).forEach(({ session }) => {
        [session.dateStarted, session.dateFinished, session.dateAbandoned].forEach((date) => {
            const parts = getReadingDateParts(date);
            if (parts) years.add(parts.year);
        });
    });

    return [...years].sort((first, second) => first - second);
}


function getInitialLedgerPeriod(years, currentYear) {
    if (years.includes(currentYear)) return currentYear;
    return years[years.length - 1] || "all";
}


function renderLedgerNavigation(years, period) {
    const previous = document.querySelector('[data-ledger-action="previous"]');
    const selected = document.querySelector('[data-ledger-action="selected"]');
    const next = document.querySelector('[data-ledger-action="next"]');
    const all = document.querySelector('[data-ledger-action="all"]');
    const index = years.indexOf(period);
    const isAllTime = period === "all";
    if (!isAllTime) {
        lastSelectedLedgerYear = period;
    }

    const displayedYear = isAllTime
        ? lastSelectedLedgerYear || new Date().getFullYear()
        : period;

    selected.textContent = String(displayedYear);
    selected.dataset.ledgerYear = String(displayedYear);
    selected.disabled = false;
    selected.setAttribute("aria-label", isAllTime
        ? `Show ${displayedYear} reading record`
        : `${period} reading record selected`);
    selected.setAttribute("aria-pressed", String(!isAllTime));
    previous.disabled = isAllTime || index <= 0;
    next.disabled = isAllTime || index < 0 || index >= years.length - 1;
    all.setAttribute("aria-pressed", String(isAllTime));
}


function hasMeaningfulLedgerData(works) {
    return works.some((work) => getLedgerSessions(work).length > 0);
}


async function getLedgerWorks(works) {

    try {
        const response = await fetch("data/works.json");

        if (!response.ok) {
            return works;
        }

        const curatedWorks = await response.json();
        const curatedById = new Map(curatedWorks.map((work) => [work.id, work]));

        return works.map((work) => ({
            ...curatedById.get(work.id),
            ...work,
            genres: Array.isArray(work.genres)
                ? work.genres
                : curatedById.get(work.id)?.genres || []
        }));
    }
    catch (error) {
        console.warn("Crypt & Quill ledger classifications could not be loaded.", error);
        return works;
    }

}


function calculateReadingLedger(works, period) {

    const sessions = works.flatMap((work) => getLedgerSessions(work));
    const isAllTime = period === "all";
    const matchesEventYear = (entry, field) => {
        if (isAllTime) return true;
        return getReadingDateParts(entry.session[field])?.year === period;
    };
    const completed = sessions.filter((entry) =>
        entry.session.status === "read" && matchesEventYear(entry, "dateFinished")
    );
    const abandoned = sessions.filter((entry) =>
        entry.session.status === "dnf" && matchesEventYear(entry, "dateAbandoned")
    );
    const started = sessions.filter((entry) =>
        Boolean(getReadingDateParts(entry.session.dateStarted)) && matchesEventYear(entry, "dateStarted")
    );
    const completedWorks = uniqueLedgerWorks(completed.map((entry) => entry.work));
    const ratings = completedWorks
        .map((work) => Number(work.overallRating))
        .filter((rating) => Number.isFinite(rating) && rating >= 0.5 && rating <= 5);
    const pageEntries = completed
        .map((entry) => ({ work: entry.work, pages: getLedgerPageCount(entry.work) }))
        .filter((entry) => entry.pages !== null);
    const monthlyCompletions = Array(12).fill(0);

    const completionsByYear = countLedgerValues(completed
        .map((entry) => getReadingDateParts(entry.session.dateFinished)?.year)
        .filter(Boolean)
        .map(String))
        .sort((first, second) => Number(first.label) - Number(second.label));

    if (!isAllTime) completed.forEach((entry) => {
        const month = getReadingDateParts(entry.session.dateFinished)?.month;
        if (month !== null && month !== undefined) monthlyCompletions[month - 1] += 1;
    });

    return {
        period,
        isAllTime,
        completed: completed.length,
        started: started.length,
        abandoned: abandoned.length,
        current: works.filter((work) => work.status === "currently-reading").length,
        monthlyCompletions,
        completionsByYear,
        genres: countLedgerValues(completed.flatMap((entry) => entry.work.genres || [])),
        authors: countLedgerValues(completed.map((entry) => entry.work.author).filter(Boolean)),
        approximatePages: pageEntries.reduce((total, entry) => total + entry.pages, 0),
        ratedCount: ratings.length,
        averageRating: ratings.length
            ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
            : null,
        longest: pageEntries.sort((first, second) => second.pages - first.pages)[0] || null
    };

}


function getLedgerSessions(work) {

    const history = Array.isArray(work.readingHistory)
        ? work.readingHistory.filter((session) =>
            session && ["currently-reading", "read", "dnf"].includes(session.status)
        )
        : [];

    if (history.length > 0) {
        return history.map((session) => ({ work, session }));
    }

    return ["currently-reading", "read", "dnf"].includes(work.status)
        ? [{ work, session: {
            status: work.status,
            dateStarted: work.dateStarted || null,
            dateFinished: work.dateFinished || null,
            dateAbandoned: work.dateAbandoned || null
        } }]
        : [];

}


function uniqueLedgerWorks(works) {
    return [...new Map(works.map((work) => [work.id || `${work.title}:${work.author}`, work])).values()];
}


function getLedgerPageCount(work) {

    /* A short story's representative edition is commonly the collection
     * containing it, so its pages are unsafe unless explicitly work-level. */
    if (work.type === "Short Story" && work.pageCountScope !== "work") {
        return null;
    }

    const candidates = [
        work.pageCount,
        work.representativeEdition?.pageCount,
        work.edition?.pageCount
    ];
    const pages = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0);
    return pages || null;

}


function countLedgerValues(values) {

    const totals = new Map();
    values.forEach((value) => totals.set(value, (totals.get(value) || 0) + 1));

    return [...totals.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));

}


function renderLedgerStats(ledger) {

    document.getElementById("ledger-annual-heading").textContent = ledger.isAllTime
        ? "All-Time Reading Record"
        : `${ledger.period} Reading Record`;
    const stats = [
        ["Completed", ledger.completed, ledger.isAllTime ? "all recorded sessions" : String(ledger.period)],
        ["Started", ledger.started, ledger.isAllTime ? "all dated starts" : String(ledger.period)],
        ["Did Not Finish", ledger.abandoned, ledger.isAllTime ? "all recorded sessions" : String(ledger.period)]
    ];
    if (ledger.isAllTime || ledger.period === new Date().getFullYear()) {
        stats.push(["Currently Reading", ledger.current, "on your active shelf now"]);
    }
    const container = document.getElementById("ledger-annual-stats");
    container.innerHTML = "";

    stats.forEach(([label, value, note]) => {
        const article = document.createElement("article");
        const heading = document.createElement("h4");
        const number = document.createElement("strong");
        const detail = document.createElement("p");
        heading.textContent = label;
        number.textContent = String(value);
        detail.textContent = note;
        article.append(heading, number, detail);
        container.appendChild(article);
    });

}


function renderLedgerChart(ledger) {

    const chart = document.getElementById("ledger-monthly-chart");
    const chartHeading = document.getElementById("ledger-monthly-heading");
    const chartLabel = document.getElementById("ledger-chart-label");
    const entries = ledger.isAllTime
        ? ledger.completionsByYear
        : ledger.monthlyCompletions.map((count, index) => ({
            label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(2000, index, 1)),
            count
        }));
    const months = entries.map((entry) => entry.count);
    const maximum = Math.max(...months, 1);
    chart.innerHTML = "";
    chart.classList.toggle("ledger-yearly-chart", ledger.isAllTime);
    document.getElementById("ledger-monthly-section").hidden = !months.some(Boolean);
    chartLabel.textContent = ledger.isAllTime ? "Yearly record" : "Monthly record";
    chartHeading.textContent = ledger.isAllTime ? "Reading by Year" : "Works Completed by Month";

    entries.forEach((entry) => {
        const row = document.createElement("div");
        const label = document.createElement("span");
        const track = document.createElement("span");
        const bar = document.createElement("span");
        const value = document.createElement("strong");
        label.textContent = entry.label;
        bar.style.width = `${(entry.count / maximum) * 100}%`;
        track.className = "ledger-chart-track";
        bar.className = "ledger-chart-bar";
        value.textContent = String(entry.count);
        track.appendChild(bar);
        row.append(label, track, value);
        chart.appendChild(row);
    });

}


function renderLedgerRankedList(listId, sectionId, entries) {

    const list = document.getElementById(listId);
    document.getElementById(sectionId).hidden = entries.length === 0;
    list.innerHTML = "";

    entries.slice(0, 6).forEach((entry) => {
        const item = document.createElement("li");
        const label = document.createElement("span");
        const count = document.createElement("strong");
        label.textContent = entry.label;
        count.textContent = String(entry.count);
        item.append(label, count);
        list.appendChild(item);
    });

}


function renderLedgerNotes(ledger) {

    const notes = [];
    if (ledger.approximatePages > 0) notes.push(["Approximate pages read", ledger.approximatePages.toLocaleString()]);
    if (ledger.averageRating !== null) notes.push(["Average rating", `${ledger.averageRating.toFixed(1)} / 5 (${ledger.ratedCount} rated)`]);
    if (ledger.longest) notes.push(["Longest work read", `${getLibraryTitle(ledger.longest.work)} · ${ledger.longest.pages.toLocaleString()} pages`]);

    const section = document.getElementById("ledger-notes-section");
    const container = document.getElementById("ledger-notes");
    section.hidden = notes.length === 0;
    container.innerHTML = "";

    notes.forEach(([label, value]) => {
        const row = document.createElement("p");
        const term = document.createElement("span");
        const detail = document.createElement("strong");
        term.textContent = label;
        detail.textContent = value;
        row.append(term, detail);
        container.appendChild(row);
    });

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


        case "dnf":

            return "Did Not Finish";


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


        case "dnf":

            emptyMessage.textContent =
                "No abandoned works have been recorded yet.";

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


        case "dnf":

            return "Did Not Finish";


        default:

            return "Saved";

    }

}


function createLibraryReadingDates(
    work
) {

    const dates = [
        ["Started", work.dateStarted],
        ["Finished", work.dateFinished],
        ["Abandoned", work.dateAbandoned]
    ].filter(
        ([, value]) => isValidReadingDate(value)
    );


    if (dates.length === 0) {
        return null;
    }


    const container =
        document.createElement(
            "p"
        );


    container.className =
        "library-card-reading-dates";


    container.textContent =
        dates.map(
            ([label, value]) => {

                return `${label} ${formatReadingDate(value)}`;

            }
        ).join(" · ");


    return container;

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
