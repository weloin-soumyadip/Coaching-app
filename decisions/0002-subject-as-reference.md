# ADR-0002: Subject is its own collection; CoachingCenter references it via ObjectId

**Status:** Accepted (2026-05-20)

## Context

A CoachingCenter offers multiple subjects (Math, Physics, English, ...). Embedding these as a free-text string array opens the door to duplicates like `Math`/`Maths`/`Mathematics` and breaks filtering precision.

## Decision

`Subject` is a separate collection, admin-curated. `CoachingCenter.subjectsOffered` is an array of `ObjectId` references.

## Consequences

- Search-by-subject is a clean indexed lookup (`{ subjectsOffered: { $in: [...] } }`).
- Adding a new subject is an admin action, not a side-effect of any user creating a center.
- A `populate()` is needed when returning subject names alongside a center.
- An initial subject list seeder belongs in Phase 2.
