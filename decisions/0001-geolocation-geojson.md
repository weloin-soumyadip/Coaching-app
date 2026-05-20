# ADR-0001: Store coaching center location as GeoJSON Point with 2dsphere index

**Status:** Accepted (2026-05-20)

## Context

Students need to find coaching centers "near me" — within X km of their current location or a chosen pin. Without an indexed geospatial type, every "near me" request would require scanning all centers and computing distance in JS, which is O(n) per request and not viable as the dataset grows.

## Decision

Store `CoachingCenter.location` as a GeoJSON Point:

```js
{
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: [lng, lat]
}
```

Apply a `2dsphere` index on the field.

## Consequences

- MongoDB-native `$near` / `$geoWithin` operators become available in Phase 2 search endpoints.
- Coordinates are `[lng, lat]` (GeoJSON convention), not `[lat, lng]` — must be consistent in clients and seeders.
- Slightly more storage than plain numbers, but negligible at this scale.
