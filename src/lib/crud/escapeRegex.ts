// Escape user-supplied text for safe use inside a RegExp literal. Mongo's
// regex queries are still interpreted, so callers MUST escape before passing
// untrusted input into `new RegExp(...)`.
export const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
