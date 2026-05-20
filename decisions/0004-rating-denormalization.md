# ADR-0004: Cache averageRating + totalReviews on CoachingCenter, kept in sync via Review hooks

**Status:** Accepted (2026-05-20)

## Context

Phase 2 search and listing endpoints need "sort by rating" and per-card rating display. Computing the average per request via aggregation over `Review` is O(reviews-per-center) and slows down listing endpoints at scale.

## Decision

Store `averageRating` and `totalReviews` directly on `CoachingCenter`. Keep them in sync via `Review` post-save / post-findOneAndUpdate / post-findOneAndDelete hooks, using a `Review.recalcStats(centerId)` static that runs the aggregation only when reviews change.

## Consequences

- Listing endpoints stay fast (single index hit on `averageRating: -1`).
- Updates to reviews trigger one aggregation per affected center — acceptable, because reviews change rarely compared to reads.
- Hooks live on the `Review` model — anyone changing review semantics must keep the recalc logic consistent.
- Direct DB writes that bypass the Mongoose Review model (e.g., bulk imports) must call `recalcStats` manually.
