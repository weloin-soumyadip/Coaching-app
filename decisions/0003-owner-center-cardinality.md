# ADR-0003: One owner can manage many coaching centers (no uniqueness constraint)

**Status:** Accepted (2026-05-20)

## Context

Owners may run multiple branches or franchise centers. Enforcing 1:1 (owner:center) limits real-world use without functional benefit.

## Decision

`CoachingCenter.owner` references `User`, with no uniqueness constraint. One owner can have N centers.

## Consequences

- Owner dashboards must support listing multiple centers.
- Permission checks gate per-center actions on the matching `owner` field.
- If product policy ever requires 1:1, a unique partial index can be added later without a schema change.
