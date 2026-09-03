/* ========================================
   Crypt & Quill
   Work Details Page
   ======================================== */


/* ========================================
   PAGE ELEMENTS
   ======================================== */

const detailsStatus =
    document.getElementById(
        "work-details-status"
    );

const detailsPage =
    document.getElementById(
        "work-details-page"
    );

const detailsCover =
    document.getElementById(
        "work-details-cover"
    );

const detailsSource =
    document.getElementById(
        "work-details-source"
    );

const detailsTitle =
    document.getElementById(
        "work-details-title"
    );

const detailsAuthor =
    document.getElementById(
        "work-details-author"
    );

const detailsYear =
    document.getElementById(
        "work-details-year"
    );

const detailsType =
    document.getElementById(
        "work-details-type"
    );

const detailsTagGroups =
    document.getElementById(
        "details-tag-groups"
    );

const classificationSection =
    document.getElementById(
        "classification-section"
    );

const descriptionElement =
    document.getElementById(
        "work-description"
    );

const relationshipsSection =
    document.getElementById(
        "relationships-section"
    );

const relationshipGrid =
    document.getElementById(
        "relationship-grid"
    );

const subjectsSection =
    document.getElementById(
        "subjects-section"
    );

const subjectList =
    document.getElementById(
        "details-subject-list"
    );

const openLibraryLink =
    document.getElementById(
        "open-library-link"
    );



/* ========================================
   INITIALIZE
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeWorkDetails
);


async function initializeWorkDetails() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    const curatedId =
        parameters.get(
            "id"
        );


    const openLibraryId =
        parameters.get(
            "ol"
        );


    try {

        if (
            curatedId
        ) {

            await loadCuratedWorkDetails(
                curatedId
            );

            return;

        }


        if (
            openLibraryId
        ) {

            await loadExternalWorkDetails(
                openLibraryId
            );

            return;

        }


        showDetailsError(
            "No work was selected."
        );

    }
    catch (error) {

        console.error(error);


        showDetailsError(
            "This work could not be opened."
        );

    }

}



/* ========================================
   CURATED WORK
   ======================================== */

async function loadCuratedWorkDetails(
    curatedId
) {

    const catalog =
        await loadCuratedWorks();


    const curatedWork =
        catalog.find(
            (work) => {

                return (
                    work.id ===
                    curatedId
                );

            }
        );


    if (!curatedWork) {

        throw new Error(
            "Curated work not found."
        );

    }


    /*
     * Render our own data immediately.
     */
    renderWorkDetails(
        curatedWork
    );


    showDetailsStatus(
        "Consulting the Open Library record..."
    );


    try {

        /*
         * Find the corresponding Open Library
         * work so we can enrich this page.
         */
        const searchQuery =
            `${curatedWork.title} ${curatedWork.author}`;


        const searchResults =
            await searchOpenLibrary(
                searchQuery,
                12
            );


        const enrichedWork =
            enrichCuratedWorkFromOpenLibrary(
                curatedWork,
                searchResults
            );


        let openLibraryWork =
            null;


        if (
            enrichedWork.openLibraryKey
        ) {

            openLibraryWork =
                await getOpenLibraryWork(
                    enrichedWork.openLibraryKey
                );

        }


        const detailsModel =
            createCuratedDetailsModel(
                enrichedWork,
                openLibraryWork
            );


        renderWorkDetails(
            detailsModel
        );

    }
    catch (error) {

        /*
         * The page can still work perfectly well
         * using Crypt & Quill's own metadata.
         */
        console.warn(
            "Open Library enrichment unavailable:",
            error
        );


        renderWorkDetails(
            curatedWork
        );

    }

}



/* ========================================
   EXTERNAL OPEN LIBRARY WORK
   ======================================== */

async function loadExternalWorkDetails(
    openLibraryId
) {

    showDetailsStatus(
        "Opening the Open Library record..."
    );


    const work =
        await getOpenLibraryWork(
            openLibraryId
        );


    const authorKeys =
        getOpenLibraryWorkAuthorKeys(
            work
        );


    const authors =
        await loadOpenLibraryAuthors(
            authorKeys
        );


    const detailsModel =
        createExternalDetailsModel(
            work,
            authors
        );


    renderWorkDetails(
        detailsModel
    );

}



/* ========================================
   AUTHOR LOADING
   ======================================== */

async function loadOpenLibraryAuthors(
    authorKeys
) {

    if (
        !Array.isArray(
            authorKeys
        ) ||
        authorKeys.length === 0
    ) {
        return [];
    }


    /*
     * Most literary works have one author.
     * Limiting this prevents unnecessary API
     * requests on malformed or unusual records.
     */
    const keysToLoad =
        authorKeys.slice(
            0,
            4
        );


    const requests =
        keysToLoad.map(
            async (authorKey) => {

                try {

                    return await getOpenLibraryAuthor(
                        authorKey
                    );

                }
                catch (error) {

                    console.warn(
                        "Author lookup failed:",
                        authorKey
                    );


                    return null;

                }

            }
        );


    const results =
        await Promise.all(
            requests
        );


    return results.filter(
        Boolean
    );

}



/* ========================================
   CURATED DETAILS MODEL
   ======================================== */

function createCuratedDetailsModel(
    curatedWork,
    openLibraryWork
) {

    const workCoverIds =
        getOpenLibraryWorkCoverIds(
            openLibraryWork
        );


    const description =
        extractOpenLibraryText(
            openLibraryWork?.description
        );


    const subjects =
        Array.isArray(
            openLibraryWork?.subjects
        )
            ? openLibraryWork.subjects
            : curatedWork.subjects || [];


    return {

        ...curatedWork,

        source:
            "crypt-and-quill",

        coverId:
            curatedWork.coverId ||
            workCoverIds[0] ||
            null,

        description:
            description,

        subjects:
            subjects,

        firstPublishDate:
            openLibraryWork?.first_publish_date ||
            null

    };

}



/* ========================================
   EXTERNAL DETAILS MODEL
   ======================================== */

function createExternalDetailsModel(
    openLibraryWork,
    authors
) {

    const coverIds =
        getOpenLibraryWorkCoverIds(
            openLibraryWork
        );


    const authorNames =
        authors
            .map(
                (author) => {

                    return author.name;

                }
            )
            .filter(Boolean);


    const firstPublishDate =
        openLibraryWork.first_publish_date ||
        null;


    return {

        source:
            "openlibrary",

        id:
            normalizeOpenLibraryKey(
                openLibraryWork.key
            ),

        openLibraryKey:
            openLibraryWork.key,

        title:
            openLibraryWork.title ||
            "Untitled Work",

        author:
            authorNames.length > 0
                ? authorNames.join(", ")
                : "Unknown Author",

        year:
            extractYear(
                firstPublishDate
            ),

        firstPublishDate:
            firstPublishDate,

        type:
            "Work",

        genres:
            [],

        subgenres:
            [],

        themes:
            [],

        relationships:
            {},

        description:
            extractOpenLibraryText(
                openLibraryWork.description
            ),

        subjects:
            Array.isArray(
                openLibraryWork.subjects
            )
                ? openLibraryWork.subjects
                : [],

        coverId:
            coverIds[0] ||
            null

    };

}



/* ========================================
   RENDER PAGE
   ======================================== */

function renderWorkDetails(
    work
) {

    document.title =
        `${work.title} | Crypt & Quill`;


    renderSource(
        work
    );


    detailsTitle.textContent =
        work.title;


    detailsAuthor.textContent =
        work.author;


    detailsYear.textContent =
        getDisplayYear(
            work
        );


    detailsType.textContent =
        work.type ||
        "Work";


    renderCover(
        work
    );


    renderClassification(
        work
    );


    renderDescription(
        work
    );


    renderRelationships(
        work
    );


    renderSubjects(
        work
    );


    renderOpenLibraryLink(
        work
    );


    detailsStatus.hidden =
        true;


    detailsPage.hidden =
        false;

}



/* ========================================
   SOURCE
   ======================================== */

function renderSource(
    work
) {

    if (
        work.source ===
        "crypt-and-quill"
    ) {

        detailsSource.textContent =
            "From the Crypt & Quill Archive";

    }
    else {

        detailsSource.textContent =
            "Open Library Record";

    }

}



/* ========================================
   COVER
   ======================================== */

function renderCover(
    work
) {

    detailsCover.innerHTML =
        "";


    if (
        work.coverId
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            getOpenLibraryCoverURL(
                work.coverId,
                "L"
            );


        image.alt =
            `Cover of ${work.title}`;


        image.className =
            "work-details-cover-image";


        image.addEventListener(
            "error",
            () => {

                renderDetailsCoverPlaceholder();

            }
        );


        detailsCover.appendChild(
            image
        );


        return;

    }


    renderDetailsCoverPlaceholder();

}



function renderDetailsCoverPlaceholder() {

    detailsCover.innerHTML =
        "";


    const placeholder =
        document.createElement(
            "div"
        );


    placeholder.className =
        "work-details-cover-placeholder";


    placeholder.textContent =
        "Cover";


    detailsCover.appendChild(
        placeholder
    );

}



/* ========================================
   YEAR
   ======================================== */

function getDisplayYear(
    work
) {

    /*
     * Curated canonical year wins.
     */
    if (
        work.year
    ) {

        return String(
            work.year
        );

    }


    if (
        work.firstPublishDate
    ) {

        return work.firstPublishDate;

    }


    return "Unknown";

}



function extractYear(
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
   CLASSIFICATION
   ======================================== */

function renderClassification(
    work
) {

    detailsTagGroups.innerHTML =
        "";


    if (
        work.source !==
        "crypt-and-quill"
    ) {

        classificationSection.hidden =
            true;

        return;

    }


    classificationSection.hidden =
        false;


    addClassificationGroup(
        "Genre",
        work.genres
    );


    addClassificationGroup(
        "Subgenre",
        work.subgenres
    );


    addClassificationGroup(
        "Themes",
        work.themes
    );

}



function addClassificationGroup(
    label,
    values
) {

    if (
        !Array.isArray(values) ||
        values.length === 0
    ) {
        return;
    }


    const group =
        document.createElement(
            "div"
        );


    group.className =
        "details-tag-group";


    const heading =
        document.createElement(
            "p"
        );


    heading.className =
        "details-tag-label";


    heading.textContent =
        label;


    const tags =
        document.createElement(
            "div"
        );


    tags.className =
        "details-tags";


    values.forEach(
        (value) => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.textContent =
                value;


            tags.appendChild(
                tag
            );

        }
    );


    group.appendChild(
        heading
    );


    group.appendChild(
        tags
    );


    detailsTagGroups.appendChild(
        group
    );

}



/* ========================================
   DESCRIPTION
   ======================================== */

function renderDescription(
    work
) {

    descriptionElement.innerHTML =
        "";


    if (
        work.description
    ) {

        const paragraphs =
            String(
                work.description
            )
                .split(
                    /\n\s*\n/
                )
                .filter(Boolean);


        paragraphs.forEach(
            (paragraphText) => {

                const paragraph =
                    document.createElement(
                        "p"
                    );


                paragraph.textContent =
                    paragraphText.trim();


                descriptionElement.appendChild(
                    paragraph
                );

            }
        );


        return;

    }


    const unavailable =
        document.createElement(
            "p"
        );


    unavailable.className =
        "details-unavailable";


    unavailable.textContent =
        "No description is currently available for this work.";


    descriptionElement.appendChild(
        unavailable
    );

}



/* ========================================
   RELATIONSHIPS
   ======================================== */

function renderRelationships(
    work
) {

    relationshipGrid.innerHTML =
        "";


    const relationships =
        work.relationships || {};


    let relationshipCount =
        0;


    Object.entries(
        relationships
    ).forEach(
        ([relationshipType, entries]) => {

            if (
                !Array.isArray(
                    entries
                )
            ) {
                return;
            }


            entries.forEach(
                (entry) => {

                    relationshipCount +=
                        1;


                    relationshipGrid.appendChild(
                        createRelationshipCard(
                            relationshipType,
                            entry
                        )
                    );

                }
            );

        }
    );


    relationshipsSection.hidden =
        relationshipCount === 0;

}



/* ========================================
   RELATIONSHIP CARD
   ======================================== */

function createRelationshipCard(
    relationshipType,
    entry
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "relationship-card";


    const label =
        document.createElement(
            "p"
        );


    label.className =
        "relationship-type";


    label.textContent =
        formatRelationshipType(
            relationshipType
        );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        entry.title ||
        "Untitled Work";


    const author =
        document.createElement(
            "p"
        );


    author.className =
        "relationship-author";


    author.textContent =
        entry.author ||
        "";


    const year =
        document.createElement(
            "p"
        );


    year.className =
        "relationship-year";


    year.textContent =
        entry.year ||
        "";


    card.appendChild(
        label
    );


    card.appendChild(
        title
    );


    if (
        entry.author
    ) {

        card.appendChild(
            author
        );

    }


    if (
        entry.year
    ) {

        card.appendChild(
            year
        );

    }


    return card;

}



function formatRelationshipType(
    relationshipType
) {

    switch (
        relationshipType
    ) {

        case "appearsIn":

            return "Appears In";


        case "partOfSeries":

            return "Part of Series";


        case "relatedWorks":

            return "Related Work";


        case "inspiredBy":

            return "Inspired By";


        default:

            return relationshipType
                .replace(
                    /([A-Z])/g,
                    " $1"
                )
                .replace(
                    /^./,
                    (character) => {

                        return character.toUpperCase();

                    }
                );

    }

}



/* ========================================
   OPEN LIBRARY SUBJECTS
   ======================================== */

function renderSubjects(
    work
) {

    subjectList.innerHTML =
        "";


    if (
        !Array.isArray(
            work.subjects
        ) ||
        work.subjects.length === 0
    ) {

        subjectsSection.hidden =
            true;

        return;

    }


    const uniqueSubjects =
        [...new Set(
            work.subjects
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

                        return subject.trim();

                    }
                )
                .filter(Boolean)
        )]
            .slice(
                0,
                16
            );


    if (
        uniqueSubjects.length === 0
    ) {

        subjectsSection.hidden =
            true;

        return;

    }


    uniqueSubjects.forEach(
        (subject) => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.textContent =
                subject;


            subjectList.appendChild(
                tag
            );

        }
    );


    subjectsSection.hidden =
        false;

}



/* ========================================
   OPEN LIBRARY LINK
   ======================================== */

function renderOpenLibraryLink(
    work
) {

    if (
        !work.openLibraryKey
    ) {

        openLibraryLink.hidden =
            true;

        return;

    }


    const url =
        getOpenLibraryWorkPageURL(
            work.openLibraryKey
        );


    if (!url) {

        openLibraryLink.hidden =
            true;

        return;

    }


    openLibraryLink.href =
        url;


    openLibraryLink.hidden =
        false;

}



/* ========================================
   STATUS
   ======================================== */

function showDetailsStatus(
    message
) {

    detailsStatus.textContent =
        message;


    detailsStatus.hidden =
        false;

}



function showDetailsError(
    message
) {

    detailsPage.hidden =
        true;


    detailsStatus.textContent =
        message;


    detailsStatus.hidden =
        false;

}
