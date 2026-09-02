
/* ========================================
   Crypt & Quill
   Catalog
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
 * Give curated records the same basic structure
 * used by API records.
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

        subjects: [],

        coverId:
            work.coverId || null,

        featured:
            Boolean(work.featured)

    };

}
