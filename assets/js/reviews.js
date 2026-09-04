/* ========================================
   Crypt & Quill
   Reviews Page
   ======================================== */


/* ========================================
   PAGE ELEMENTS
   ======================================== */

const reviewsList =
    document.getElementById(
        "reviews-list"
    );


const reviewsCount =
    document.getElementById(
        "reviews-count"
    );


const reviewsSort =
    document.getElementById(
        "reviews-sort"
    );


const reviewsEmptyState =
    document.getElementById(
        "reviews-empty-state"
    );



/* ========================================
   INITIALIZE
   ======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeReviews
);


function initializeReviews() {

    reviewsSort.addEventListener(
        "change",
        renderReviews
    );


    renderReviews();

}



/* ========================================
   RENDER
   ======================================== */

function renderReviews() {

    let works =
        getSavedLibraryWorks()
            .filter(
                hasWrittenReview
            );


    works =
        sortReviews(
            works,
            reviewsSort.value
        );


    updateReviewCount(
        works.length
    );


    reviewsList.innerHTML =
        "";


    if (
        works.length === 0
    ) {

        reviewsList.hidden =
            true;


        reviewsEmptyState.hidden =
            false;


        return;

    }


    reviewsList.hidden =
        false;


    reviewsEmptyState.hidden =
        true;


    works.forEach(
        (work) => {

            reviewsList.appendChild(
                createReviewCard(
                    work
                )
            );

        }
    );

}



/* ========================================
   REVIEW CHECK
   ======================================== */

function hasWrittenReview(
    work
) {

    return (
        typeof work.review === "string" &&
        work.review.trim().length > 0
    );

}



/* ========================================
   REVIEW CARD
   ======================================== */

function createReviewCard(
    work
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "review-card";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "review-card-header";



    /*
     * TITLE AREA
     */

    const titleArea =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        work.title ||
        "Untitled Work";


    const author =
        document.createElement(
            "p"
        );


    author.className =
        "review-card-author";


    author.textContent =
        work.author ||
        "Unknown Author";


    titleArea.appendChild(
        title
    );


    titleArea.appendChild(
        author
    );



    /*
     * SCORE
     */

    const scoreArea =
        document.createElement(
            "div"
        );


    scoreArea.className =
        "review-card-score";


    const score =
        Number(
            work.overallRating
        );


    scoreArea.textContent =
        Number.isFinite(score)
            ? `${score.toFixed(1)} / 5`
            : "Unrated";


    header.appendChild(
        titleArea
    );


    header.appendChild(
        scoreArea
    );



    /*
     * REVIEW TEXT
     */

    const reviewText =
        document.createElement(
            "div"
        );


    reviewText.className =
        "review-card-text";


    const paragraphs =
        String(
            work.review
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


            reviewText.appendChild(
                paragraph
            );

        }
    );



    /*
     * CATEGORY RATINGS
     */

    const breakdown =
        createRatingBreakdown(
            work.ratings
        );



    /*
     * FOOTER
     */

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "review-card-footer";


    const date =
        document.createElement(
            "span"
        );


    date.textContent =
        getReviewDateLabel(
            work
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        getReviewWorkURL(
            work
        );


    link.textContent =
        "View Work →";


    footer.appendChild(
        date
    );


    footer.appendChild(
        link
    );



    /*
     * BUILD
     */

    card.appendChild(
        header
    );


    if (
        breakdown
    ) {

        card.appendChild(
            breakdown
        );

    }


    card.appendChild(
        reviewText
    );


    card.appendChild(
        footer
    );


    return card;

}



/* ========================================
   CATEGORY BREAKDOWN
   ======================================== */

function createRatingBreakdown(
    ratings
) {

    if (
        !ratings ||
        typeof ratings !== "object"
    ) {
        return null;
    }


    const validEntries =
        Object.entries(
            RATING_CATEGORIES
        )
            .map(
                ([key, category]) => {

                    return {

                        label:
                            category.label,

                        value:
                            Number(
                                ratings[
                                    key
                                ]
                            )

                    };

                }
            )
            .filter(
                (entry) => {

                    return Number.isFinite(
                        entry.value
                    );

                }
            );


    if (
        validEntries.length === 0
    ) {
        return null;
    }


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "review-rating-breakdown";


    validEntries.forEach(
        (entry) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "review-rating-item";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                entry.label;


            const value =
                document.createElement(
                    "strong"
                );


            value.textContent =
                entry.value.toFixed(1);


            item.appendChild(
                label
            );


            item.appendChild(
                value
            );


            container.appendChild(
                item
            );

        }
    );


    return container;

}



/* ========================================
   SORTING
   ======================================== */

function sortReviews(
    works,
    sortMethod
) {

    const sorted = [
        ...works
    ];


    switch (
        sortMethod
    ) {

        case "highest":

            sorted.sort(
                (a, b) => {

                    return (
                        getRatingForSort(
                            b,
                            -Infinity
                        ) -
                        getRatingForSort(
                            a,
                            -Infinity
                        )
                    );

                }
            );

            break;


        case "lowest":

            sorted.sort(
                (a, b) => {

                    return (
                        getRatingForSort(
                            a,
                            Infinity
                        ) -
                        getRatingForSort(
                            b,
                            Infinity
                        )
                    );

                }
            );

            break;


        case "title":

            sorted.sort(
                (a, b) => {

                    return (
                        a.title || ""
                    ).localeCompare(
                        b.title || "",
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    );

                }
            );

            break;


        case "author":

            sorted.sort(
                (a, b) => {

                    return (
                        a.author || ""
                    ).localeCompare(
                        b.author || "",
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    );

                }
            );

            break;


        case "recent":
        default:

            sorted.sort(
                (a, b) => {

                    return (
                        getReviewDate(
                            b
                        ) -
                        getReviewDate(
                            a
                        )
                    );

                }
            );

            break;

    }


    return sorted;

}



/* ========================================
   SORT HELPERS
   ======================================== */

function getRatingForSort(
    work,
    fallback
) {

    const rating =
        Number(
            work.overallRating
        );


    return Number.isFinite(
        rating
    )
        ? rating
        : fallback;

}



function getReviewDate(
    work
) {

    const value =
        work.reviewUpdatedAt ||
        work.reviewCreatedAt ||
        work.updatedAt;


    if (!value) {
        return 0;
    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;

}



/* ========================================
   DATE DISPLAY
   ======================================== */

function getReviewDateLabel(
    work
) {

    const value =
        work.reviewUpdatedAt ||
        work.reviewCreatedAt;


    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return (
        "Reviewed " +
        date.toLocaleDateString(
            undefined,
            {
                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric"
            }
        )
    );

}



/* ========================================
   WORK URL
   ======================================== */

function getReviewWorkURL(
    work
) {

    if (
        work.source === "openlibrary" ||
        String(
            work.id
        ).startsWith(
            "ol:"
        )
    ) {

        const openLibraryId =
            String(
                work.id
            ).replace(
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


    return (
        "work-details.html?id=" +
        encodeURIComponent(
            work.id
        )
    );

}



/* ========================================
   COUNT
   ======================================== */

function updateReviewCount(
    count
) {

    reviewsCount.textContent =
        `${count} ${
            count === 1
                ? "review"
                : "reviews"
        }`;

}
