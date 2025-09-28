# Changelog

All notable changes to this project will be documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic versioning when practical.

## [0.2.1] - 2025-09-28

### Fixed

- Auth: Always wrap app with `ClerkProvider` to prevent prerender build failures when `useUser()` is referenced (resolves intermittent `_not-found` prerender error when env var missing).
- JSON Tools: Hardened SheetJS dynamic import with multi-path fallback (`xlsx`, `xlsx/xlsx.mjs`, `xlsx/dist/xlsx.full.min.js`), retry logic, idle prefetch, and typed ambient module declarations to mitigate transient chunk load failures in production.

### Internal Changes

- Added ambient TypeScript declarations for alternate `xlsx` entrypoints.
- Refactored XLSX loader to cache resolved module and eliminate `any` usage except for a confined normalization cast.

## [0.2.0] - 2025-09-28

### Initial

- JSON Tools: Multi-sheet workbook exports
  - CSV ZIP export (Issue #22) with workbook pattern detection (`sheets[]`, `workbook[]`, object-of-arrays) and dynamic `jszip` import.
  - Native XLSX export (Issue #23) via dynamic `xlsx` import, union-of-keys column ordering, safe sheet naming (<=31 chars), large workbook guard (~200k cell confirm), coexisting ZIP button.
- Advanced JSON Tools earlier enhancements (search regex/plain, depth collapse, performance mode, inline primitive editing, undo/redo history, JSON Pointer & path copy, CSV export, minify, download) incorporated into release scope.

### Documentation

- README and roadmap updated for new export capabilities.

### Internal

- Introduced dynamic module loading pattern for large optional dependencies (`jszip`, `xlsx`).

## [0.1.0] - 2025-09-XX

### Added

- Initial project scaffold: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui base components, Clerk auth wiring, Convex schema stubs.
- Toolkit foundation with initial JSON formatting capability (pre-advanced feature set).

[0.2.0]: https://github.com/romiafan/personal-website/compare/0.1.0...0.2.0
