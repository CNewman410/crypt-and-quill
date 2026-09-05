# Crypt & Quill — Development Instructions

Crypt & Quill is a curated digital archive of strange, dark, unsettling, Gothic, horror, weird, speculative, and science-fiction literature.

The site combines a hand-curated Crypt & Quill collection with supplemental metadata from Open Library.

This file defines the development rules for the repository.

Codex and other development agents should read this file before making changes.

---

# 1. Core Development Principle

Preserve working functionality.

Do not rewrite, replace, simplify, or remove existing features merely because another implementation would be easier.

Changes should be incremental.

Before modifying an existing subsystem:

1. Read the relevant existing files.
2. Understand how the feature currently works.
3. Preserve existing behavior unless the requested task specifically changes it.
4. Make the smallest reasonable change.
5. Test the affected feature and important related features.

Do not perform broad refactors unless explicitly requested.

---

# 2. Technology Stack

Crypt & Quill currently uses:

- HTML
- CSS
- Vanilla JavaScript
- JSON
- GitHub Pages
- Browser localStorage
- Open Library APIs

The project intentionally does not currently use a frontend framework.

Do not introduce:

- React
- Vue
- Angular
- Svelte
- Bootstrap
- Tailwind
- jQuery
- Node-based build systems
- server-side frameworks

unless explicitly requested.

The site must remain deployable as a static GitHub Pages website unless a future roadmap phase explicitly introduces backend functionality.

---

# 3. Visual Design

Preserve the existing Crypt & Quill visual identity.

The site uses an elegant Gothic archive / dark-academia aesthetic.

Primary visual characteristics include:

- near-black and charcoal backgrounds
- deep burgundy accents
- muted gold
- parchment-colored typography
- subtle dark brown tones
- literary serif typography
- restrained decorative elements
- archive/library presentation

The site should feel sophisticated, literary, atmospheric, and archival.

Do not redesign the site into:

- generic SaaS styling
- bright modern dashboards
- heavy card-based application UI
- Halloween novelty styling
- neon horror styling
- Bootstrap-like interfaces

New pages and components should visually match the existing Home, Discover, Work Details, My Library, and Reviews pages.

---

# 4. Canonical Data Rule

Crypt & Quill curated metadata is authoritative.

Open Library metadata is supplemental.

For curated works, never allow an external API to silently override Crypt & Quill metadata such as:

- title
- author
- original publication year
- work type
- genre
- subgenre
- themes
- aliases
- relationships

Example:

If Crypt & Quill defines:

The Jaunt
- Type: Short Story
- Genres: Horror, Science Fiction
- Subgenre: Cosmic Horror

Open Library must not replace the type with a generic "Work" or replace the Crypt & Quill classification.

---

# 5. The Work Model

The fundamental content object is a "work", not a "book".

This distinction is intentional.

Crypt & Quill must support:

- Novel
- Novella
- Short Story
- Collection
- Anthology

Future work types may be added when needed.

Do not write features that assume every work is a novel or standalone physical book.

---

# 6. Curated Archive

Curated works are stored in:

`data/works.json`

The curated archive currently contains 30 works.

Each curated record may contain:

- id
- title
- author
- year
- type
- genres
- subgenres
- themes
- searchAliases
- relationships

Example structure:

```json
{
    "id": "cq-the-jaunt",
    "title": "The Jaunt",
    "author": "Stephen King",
    "year": 1981,
    "type": "Short Story",
    "genres": [
        "Horror",
        "Science Fiction"
    ],
    "subgenres": [
        "Cosmic Horror"
    ],
    "themes": [
        "Teleportation",
        "Time",
        "Isolation",
        "Existential Horror"
    ],
    "searchAliases": [
        "Jaunt"
    ],
    "relationships": {}
}
```

Curated IDs use the prefix:

`cq-`

Avoid changing existing IDs because user library data may reference them.

---

# 7. Controlled Vocabulary

The controlled vocabulary is stored in:

`data/vocabulary.json`

It currently defines:

- genres
- subgenres
- themes
- elements
- moods
- workTypes

Genres, subgenres, and themes should use controlled vocabulary whenever possible.

Avoid creating slightly different versions of the same concept.

For example, do not introduce:

- Haunted Place
- Haunted Locations
- Haunted Spaces

if the existing term is:

- Haunted Places

Before adding a taxonomy term, check `vocabulary.json`.

---

# 8. Genre vs Subgenre vs Theme

These classifications are intentionally different.

## Genre

Broad literary category.

Examples:

- Horror
- Science Fiction
- Fantasy
- Weird Fiction
- Literary Fiction

## Subgenre

More specific literary tradition or form.

Examples:

- Cosmic Horror
- Gothic
- Folk Horror
- Body Horror
- Psychological Horror
- Witch Horror

## Theme

Conceptual ideas explored within the work.

Examples:

- Impossible Places
- Forbidden Knowledge
- Infinity
- Reality Breakdown
- Memory
- Identity
- Isolation
- Strange Afterlife
- Mortality

Do not merge these categories.

---

# 9. Forbidden Knowledge vs Secret Knowledge

These are separate intentional taxonomy terms.

Forbidden Knowledge generally refers to knowledge that becomes dangerous through discovering or understanding it.

Secret Knowledge generally refers to information intentionally hidden, restricted, esoteric, or controlled.

Do not automatically merge these concepts.

---

# 10. Open Library Integration

Open Library is used to supplement Crypt & Quill.

Relevant code currently includes:

- `assets/js/openlibrary-api.js`
- `assets/js/catalog.js`
- `assets/js/discover.js`
- `assets/js/work-details.js`

Open Library may supply:

- covers
- work identifiers
- author identifiers
- external subjects
- descriptions
- edition information
- ISBNs
- publishers
- page counts

External metadata must remain visually or logically distinct from Crypt & Quill's own classification where appropriate.

---

# 11. Cover Selection

Automatic Open Library cover matching is currently supported.

Future curated records may use a preferred cover override such as:

```json
"preferredCoverId": 12345678
```

If preferred cover functionality is implemented:

1. Use the curated preferred cover when present.
2. Fall back to automatic Open Library cover matching.
3. Fall back to the existing Crypt & Quill no-cover presentation.

Do not require every curated record to contain a preferred cover.

---

# 12. Discover

Discover combines:

- Crypt & Quill curated matches
- Open Library external results

Curated matches should normally appear before relevant external Open Library records.

Current Discover capabilities include:

- search
- Genre filtering
- Subgenre filtering
- Work Type filtering
- Publication filtering
- sorting

Sorting currently includes:

- Featured
- Title A–Z
- Author A–Z
- Newest
- Oldest

Do not remove or weaken existing Discover behavior when adding features.

---

# 13. Search Philosophy

Search should recognize curated works strongly.

Search aliases exist to improve matching.

For example:

"The Monkeys Paw"

should still be able to identify:

"The Monkey's Paw"

Open Library results may supplement a search but should not bury an exact curated Crypt & Quill match.

---

# 14. Work Details

Work Details supports both:

Curated works:

`work-details.html?id=cq-example`

and Open Library works:

`work-details.html?ol=OL12345W`

Curated pages should render Crypt & Quill metadata first and then enrich the page with available external metadata.

Do not make the page dependent on Open Library being available.

A curated work should remain usable even if an external API request fails.

---

# 15. Relationships

Curated works may define literary relationships.

Current example:

```json
"relationships": {
    "appearsIn": [
        {
            "title": "Skeleton Crew",
            "author": "Stephen King",
            "year": 1985
        }
    ]
}
```

Future relationship types may include:

- appearsIn
- contains
- partOfSeries
- sequelTo
- prequelTo
- inspiredBy
- adaptedAs
- relatedTo
- sameUniverse

Relationship support should remain flexible.

Do not hard-code the system around only one relationship type.

---

# 16. Personal Library

The personal library currently uses browser localStorage.

Main storage code:

`assets/js/storage.js`

Primary storage key:

`cryptAndQuill.library.v1`

Existing personal data can include:

- reading status
- favorite
- category ratings
- overall rating
- written review
- review dates

Preserving existing localStorage compatibility is very important.

Do not rename the storage key or restructure stored records in a way that destroys existing user data without explicitly implementing a migration.

---

# 17. Reading Status

Current reading statuses include:

- want-to-read
- currently-reading
- read

Only one of these statuses may be active for a work at one time.

Favorite status is independent.

Future DNF support should be implemented carefully according to `ROADMAP.md`.

---

# 18. Ratings

Crypt & Quill uses eight rating categories:

1. Story / Plot
2. Writing
3. Atmosphere
4. Characters
5. Originality
6. Horror / Unease Factor
7. Ending
8. Re-read Value

Ratings support:

- 0.5 increments
- minimum 0.5
- maximum 5.0
- unrated categories

The overall rating is the arithmetic mean of only the categories that have been rated.

Unrated categories must not count as zero.

Example:

4.5  
4.0  
4.5

Overall:

4.3 / 5

The UI supports half-star hover preview and half-star clicking.

Do not replace this interaction unless explicitly requested.

---

# 19. Reviews

Users may write personal reviews for works.

Reviews are stored locally.

Users can:

- write
- save
- edit
- delete

reviews without affecting:

- ratings
- reading status
- favorite status

The Reviews page displays saved written reviews and associated ratings.

Existing review data should remain compatible with future improvements.

---

# 20. Privacy

Current personal-library data is private because it exists only in browser localStorage.

Do not accidentally imply that ratings or reviews are public.

Future community functionality must explicitly distinguish:

- private personal review
- published community review

Users should choose whether a review becomes public.

---

# 21. My Library

The My Library page reads from localStorage.

Existing functionality includes filtering by:

- All
- Want to Read
- Currently Reading
- Read
- Favorites

Sorting includes:

- Recently Updated
- Title A–Z
- Author A–Z
- Newest Publication
- Oldest Publication

Preserve these capabilities.

---

# 22. Accessibility

New features should remain keyboard accessible.

Interactive controls should use semantic elements whenever possible.

Use:

- buttons for actions
- anchors for navigation
- labels for form fields
- aria attributes where needed
- visible focus states

Do not implement important functionality that only works with a mouse.

---

# 23. Responsive Design

All new functionality should work on:

- desktop
- tablet
- mobile

Preserve existing responsive behavior.

Test especially:

- navigation
- cards
- rating controls
- forms
- filters
- review layouts

---

# 24. Error Handling

External API failure should degrade gracefully.

Do not allow Open Library failures to break curated pages.

Missing data should display an appropriate fallback instead of causing JavaScript errors.

Examples:

- missing cover
- missing description
- missing author data
- missing edition data

---

# 25. File Organization

Current major structure:

```text
crypt-and-quill/
├── AGENTS.md
├── ROADMAP.md
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── catalog.js
│       ├── common.js
│       ├── discover.js
│       ├── home.js
│       ├── my-library.js
│       ├── openlibrary-api.js
│       ├── reviews.js
│       ├── storage.js
│       └── work-details.js
├── data/
│   ├── authors.json
│   ├── vocabulary.json
│   └── works.json
├── .nojekyll
├── README.md
├── discover.html
├── index.html
├── my-library.html
├── reviews.html
└── work-details.html
```

Follow the existing organization.

Do not create unnecessary duplicate JavaScript or CSS files.

---

# 26. Data Safety

Before changing:

- `data/works.json`
- `data/vocabulary.json`
- `assets/js/storage.js`

consider how the change affects:

- curated IDs
- saved library records
- ratings
- reviews
- reading status
- existing links

Avoid destructive changes.

---

# 27. Coding Style

Follow the style of the existing repository.

Priorities:

- readable code
- descriptive function names
- logical sections
- comments for major functionality
- no unnecessary dependencies
- no unnecessary cleverness

Prefer straightforward vanilla JavaScript.

---

# 28. Testing Expectations

After making changes, test relevant existing functionality.

At minimum, consider:

## Navigation
- Home
- Discover
- My Library
- Reviews
- Work Details

## Discover
- curated searches
- external searches
- filters
- sorting

## Work Details
- curated work
- Open Library work
- missing cover
- missing description

## Personal Library
- Want to Read
- Currently Reading
- Read
- Favorite
- refresh persistence

## Rating System
- whole-star rating
- half-star rating
- hover preview
- clear rating
- persistence
- overall calculation

## Reviews
- create
- edit
- delete
- persistence
- Reviews page sorting

Do not declare a feature complete if it breaks an established feature.

---

# 29. Git Discipline

Prefer focused commits.

Examples:

- Add reading date tracking
- Add preferred Open Library covers
- Display ratings in My Library
- Add edition metadata to work details

Avoid combining unrelated major changes into one large modification.

---

# 30. Roadmap

Before beginning substantial new functionality, read:

`ROADMAP.md`

Implement roadmap items incrementally rather than attempting to complete the entire roadmap in a single change.

---

# 31. Final Rule

Crypt & Quill is not merely an Open Library interface.

The value of the project comes from the combination of:

- a deliberately curated literary archive
- Crypt & Quill's own taxonomy
- connections between works
- external bibliographic metadata
- personal reading history
- ratings
- reviews

Preserve that identity while expanding the project.
