# Crypt & Quill — Development Roadmap

Crypt & Quill is being developed incrementally.

Completed functionality should remain stable while new capabilities are added.

See `AGENTS.md` before implementing roadmap items.

---

# Current Status

## Core Site

- [x] Home page
- [x] Gothic archive visual design
- [x] Responsive layout
- [x] GitHub Pages deployment
- [x] Static HTML/CSS/JavaScript architecture

## Curated Archive

- [x] Normalized work model
- [x] Curated works JSON
- [x] 30 founding curated works
- [x] Genres
- [x] Subgenres
- [x] Themes
- [x] Search aliases
- [x] Basic relationships
- [x] Controlled vocabulary

## Open Library

- [x] Search integration
- [x] Cover integration
- [x] Work lookup
- [x] Author lookup
- [x] External subjects
- [x] Curated/Open Library matching
- [x] Curated-first search behavior
- [x] Related-result cleanup

## Discover

- [x] Search
- [x] Curated results
- [x] Open Library results
- [x] Genre filtering
- [x] Subgenre filtering
- [x] Work Type filtering
- [x] Publication filtering
- [x] Featured sorting
- [x] Title sorting
- [x] Author sorting
- [x] Publication-date sorting

## Work Details

- [x] Curated work pages
- [x] Open Library work pages
- [x] Curated classification
- [x] Open Library enrichment
- [x] Cover display
- [x] Description display
- [x] External subjects
- [x] Related works
- [x] Personal Library controls

## My Library

- [x] Want to Read
- [x] Currently Reading
- [x] Read
- [x] Favorite
- [x] localStorage persistence
- [x] My Library page
- [x] status filters
- [x] sorting

## Ratings

- [x] Story / Plot
- [x] Writing
- [x] Atmosphere
- [x] Characters
- [x] Originality
- [x] Horror / Unease Factor
- [x] Ending
- [x] Re-read Value
- [x] half-star ratings
- [x] half-star hover preview
- [x] automatic overall score
- [x] rating persistence

## Reviews

- [x] review editor
- [x] save review
- [x] edit review
- [x] delete review
- [x] review timestamps
- [x] Reviews page
- [x] rating breakdown
- [x] review sorting

---

# Phase 1 — Reading Lifecycle

Priority: HIGH

Improve the personal-library system before adding major new public-facing features.

## DNF

- [ ] Add Did Not Finish status
- [ ] Determine whether DNF behaves as a reading status or separate state
- [ ] Display DNF clearly in My Library
- [ ] Add DNF filter
- [ ] Preserve ratings/reviews if a work is marked DNF
- [ ] Do not destroy previous localStorage records

## Reading Dates

Add optional:

- [ ] date started
- [ ] date finished
- [ ] date abandoned / DNF

Requirements:

- dates must be optional
- do not require exact dates
- existing saved works must continue working
- dates should display on Work Details
- dates should eventually support sorting/filtering

## Reading History

Future enhancement:

- [ ] preserve repeat readings
- [ ] support multiple reading sessions for the same work
- [ ] track rereads without replacing previous dates

This does not need to be implemented with the initial reading-date feature.

---

# Phase 2 — Bibliographic Metadata

Priority: HIGH

Improve the actual archive records using Open Library edition data.

## Edition Metadata

Add optional display for:

- [ ] publisher
- [ ] edition publication year
- [ ] ISBN-10
- [ ] ISBN-13
- [ ] page count
- [ ] edition language
- [ ] edition identifier

## Original Work vs Edition

Maintain distinction between:

Original work:

The Shining — 1977

and a specific edition:

Publisher — 2012  
Page Count — 688  
ISBN — ...

Crypt & Quill's original publication year must not be replaced by an edition year.

## Preferred Edition

Future capability:

- [ ] allow a preferred edition to be associated with a curated work
- [ ] use that edition for page count/publisher/ISBN where appropriate

---

# Phase 3 — Cover Improvements

Priority: MEDIUM-HIGH

## Preferred Covers

Implement optional curated field:

```json
"preferredCoverId": 12345678
```

Behavior:

1. Preferred cover if defined
2. Best automatic Open Library cover match
3. Crypt & Quill no-cover placeholder

## Cover Selection

Future admin/editorial capability:

- [ ] inspect available Open Library covers
- [ ] select preferred cover
- [ ] preserve preferred selections

---

# Phase 4 — My Library Improvements

Priority: MEDIUM

## Display Ratings

- [ ] show overall rating on My Library cards
- [ ] optionally show star representation

## Display Review State

- [ ] indicate whether a written review exists

## Additional Filters

Potential filters:

- [ ] Rated
- [ ] Unrated
- [ ] Reviewed
- [ ] Not Reviewed
- [ ] DNF
- [ ] Favorites

## Reading Statistics

Future:

- [ ] total works read
- [ ] total currently reading
- [ ] total want to read
- [ ] average rating
- [ ] favorite genres
- [ ] favorite subgenres
- [ ] most common themes
- [ ] books/pages read by year

---

# Phase 5 — Curated Archive Expansion

Priority: ONGOING

## Continue Curating Works

Current curated archive:

30 works

Targets:

- [ ] 50 curated works
- [ ] 100 curated works
- [ ] 250 curated works
- [ ] 500 curated works

## Archive Priorities

Expand across:

- Gothic
- Weird Fiction
- Cosmic Horror
- Folk Horror
- Occult Horror
- Religious Horror
- Supernatural Horror
- Psychological Horror
- Body Horror
- Science Fiction Horror
- Dark Fantasy
- Literary Horror
- Short Fiction
- Collections
- Anthologies

## Foundational Authors

Future curated expansion should consider:

- Edgar Allan Poe
- H. P. Lovecraft
- Arthur Machen
- Algernon Blackwood
- M. R. James
- Sheridan Le Fanu
- Mary Shelley
- Shirley Jackson
- Robert W. Chambers
- William Hope Hodgson

## Modern Authors

Continue expanding relevant works from authors including:

- Stephen King
- Laird Barron
- John Langan
- Christopher Buehlman
- Tananarive Due
- Thomas Ligotti
- Clive Barker
- Brom
- Thomas Olde Heuvelt
- Jon Padgett

---

# Phase 6 — Elements and Moods

Priority: MEDIUM

The controlled vocabulary already reserves:

- `elements`
- `moods`

These arrays are currently intentionally empty.

## Elements

Potential examples:

- Haunted House
- Witchcraft
- Vampires
- Demons
- Ghosts
- Cults
- Monsters
- Cursed Objects
- Ancient Gods
- Alternate Dimensions
- Possession
- Body Transformation

## Moods

Potential examples:

- Bleak
- Dreamlike
- Claustrophobic
- Dread-Filled
- Melancholic
- Surreal
- Oppressive
- Uncanny
- Grotesque
- Atmospheric

## Discovery Use

Potential future feature:

"I'm in the mood for..."

Users could explore combinations such as:

- Dreamlike + Cosmic
- Bleak + Isolated
- Gothic + Atmospheric
- Surreal + Reality Breakdown

Do not implement until the taxonomy is sufficiently populated.

---

# Phase 7 — Authors

Priority: MEDIUM

## Author Records

Expand:

`data/authors.json`

Possible fields:

- id
- name
- birth year
- death year
- biography
- external IDs
- related curated works

## Author Pages

Create pages such as:

`author.html?id=...`

Potential content:

- author biography
- curated works
- genres
- themes
- Open Library author information
- related authors

---

# Phase 8 — Relationships and Connections

Priority: MEDIUM

## Relationship Types

Support more relationship types:

- [ ] appearsIn
- [ ] contains
- [ ] partOfSeries
- [ ] sequelTo
- [ ] prequelTo
- [ ] inspiredBy
- [ ] adaptedAs
- [ ] relatedTo
- [ ] sameUniverse

## Collection Membership

Examples:

Skeleton Crew

contains:

- The Jaunt
- The Mist
- Survivor Type

Books of Blood

contains individual stories.

## Related Work Recommendations

Create recommendations using combinations of:

- shared themes
- shared genres
- shared subgenres
- explicit relationships

Curated relationships should outweigh generic Open Library similarity.

---

# Phase 9 — Lists

Priority: MEDIUM

Activate the currently disabled Lists navigation item.

## Personal Lists

Possible examples:

- Best Cosmic Horror
- Impossible Places
- Favorite Short Stories
- Books to Read This Fall
- Weirdest Books I've Read

Capabilities:

- [ ] create list
- [ ] rename list
- [ ] delete list
- [ ] add works
- [ ] remove works
- [ ] reorder works
- [ ] list description

## Curated Crypt & Quill Lists

Future editorial lists:

- Impossible Places
- Forbidden Knowledge
- Strange Afterlives
- Reality Breakdown
- Foundational Weird Fiction
- Essential Gothic Horror

---

# Phase 10 — Advanced Discovery

Priority: MEDIUM-LOW

Potential capabilities:

- [ ] browse by theme
- [ ] browse by subgenre
- [ ] browse by decade
- [ ] browse by author
- [ ] browse by work type
- [ ] combine multiple taxonomy filters
- [ ] related-work graph
- [ ] random work
- [ ] recommendation explorer

Potential feature:

"If you liked this..."

Recommendations should favor Crypt & Quill taxonomy and curated relationships.

---

# Phase 11 — Accessibility and Quality Pass

Priority: ONGOING

## Accessibility

- [ ] keyboard navigation review
- [ ] focus state review
- [ ] form-label review
- [ ] ARIA review
- [ ] contrast review
- [ ] screen-reader review

## Mobile

Test:

- [ ] Home
- [ ] Discover
- [ ] My Library
- [ ] Reviews
- [ ] Work Details
- [ ] rating controls
- [ ] filters
- [ ] navigation

## Error Handling

Test:

- [ ] Open Library unavailable
- [ ] missing covers
- [ ] missing descriptions
- [ ] missing authors
- [ ] malformed external records
- [ ] unavailable edition data

---

# Phase 12 — Accounts and Cloud Persistence

Priority: FUTURE

Do not implement until the personal/local version is mature.

Potential backend:

- Supabase
- Firebase
- another approved service

## Accounts

Possible authentication:

- [ ] email
- [ ] Google
- [ ] GitHub

## Cloud Library

Eventually allow:

- [ ] personal library sync
- [ ] ratings sync
- [ ] reviews sync
- [ ] reading dates sync
- [ ] lists sync

## Migration

Existing localStorage data should be migratable into an account.

Do not simply abandon existing local data.

---

# Phase 13 — Community Reviews

Priority: FUTURE

Community functionality should remain separate from personal/private functionality.

## Privacy Model

Reviews should support:

- Private
- Published

Default behavior should not silently publish personal content.

## Community Features

Potential capabilities:

- [ ] published reviews
- [ ] community average rating
- [ ] review author
- [ ] review date
- [ ] likes/helpful votes
- [ ] pagination
- [ ] sorting

## Permissions

Users may:

- edit their own review
- delete their own review

Users may not:

- edit someone else's review
- delete someone else's review

---

# Phase 14 — Community Ratings

Priority: FUTURE

Work Details could eventually show:

My Rating

4.3 / 5

and separately:

Community Rating

4.1 / 5  
327 ratings

Personal ratings and community aggregates must remain distinct.

---

# Phase 15 — Long-Term Archive Vision

Crypt & Quill should eventually function as three interconnected systems.

## 1. Curated Literary Archive

Carefully classified works with:

- genres
- subgenres
- themes
- elements
- moods
- relationships
- editorial metadata

## 2. Wider Archive

Open Library provides access to a much larger external catalog.

## 3. Personal Archive

Users maintain:

- reading status
- reading history
- favorites
- ratings
- reviews
- lists

Future community features can sit on top of these systems without replacing them.

---

# Next Recommended Development Task

Implement:

## DNF + Reading Dates

Requirements:

- preserve existing localStorage data
- maintain current design
- do not break status/favorite/rating/review functionality
- add optional date started
- add optional date finished
- add optional DNF date
- display reading information on Work Details
- update My Library filters appropriately

Implement this as a focused feature rather than beginning multiple roadmap phases at once.
