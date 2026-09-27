# Changelog Guide

> How to maintain the CHANGELOG.md file and document changes.

## Overview

Lumora follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions for documenting changes. The changelog is user-facing and should be written for app users, not just developers.

---

## File Location

`CHANGELOG.md` at the project root.

---

## Format

### Structure

```markdown
# Changelog

All notable changes to Lumora will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features go here

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Removed
- Removed features

## [1.0.0] - 2026-08-26

### Added
- Initial release
- Album browsing with FlashList
...
```

---

## Entry Categories

### Added

For new features:

```markdown
### Added
- Search history dropdown with tap-to-reuse functionality
- Favorites button in photo viewer
- Grid density persistence across app restarts
```

### Changed

For changes to existing functionality:

```markdown
### Changed
- Improved cache invalidation to be more targeted
- Updated theme colors for better contrast
- Changed default grid size to medium
```

### Deprecated

For soon-to-be-removed features:

```markdown
### Deprecated
- Legacy widget API (will be removed in 2.0.0)
```

### Removed

For removed features:

```markdown
### Removed
- Unused expo-secure-store dependency
- Legacy storage migration code
```

### Fixed

For bug fixes:

```markdown
### Fixed
- Fixed crash when deleting last photo in album
- Fixed incorrect photo count after deletion
- Fixed theme not persisting on iOS
```

### Security

For security fixes:

```markdown
### Security
- Fixed potential XSS in search input
- Updated dependencies with known vulnerabilities
```

---

## Writing Entries

### Good Examples ✅

```markdown
- Added search history with 20-item limit and deduplication
- Fixed thumbnail loading failure causing infinite spinner
- Improved FlashList performance with accurate estimatedItemSize
- Removed unused expo-font dependency
```

**Why good:**
- Clear and specific
- User-focused (what changed for them)
- Actionable (they understand the impact)

### Bad Examples ❌

```markdown
- Updated hook
- Fixed bug
- Refactored service
- Changed file
```

**Why bad:**
- Vague (which hook? what bug?)
- Developer-focused (users don't care about refactoring)
- No context or impact

---

## Versioning

Follow [Semantic Versioning](https://semver.org/):

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** — Breaking changes (1.0.0 → 2.0.0)
- **MINOR** — New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH** — Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Examples

```markdown
## [2.0.0] - 2027-01-15
### Changed
- **BREAKING:** Renamed `usePhotos` hook to `useAlbumPhotos`

## [1.3.0] - 2026-12-10
### Added
- Cloud backup for favorites

## [1.2.1] - 2026-11-05
### Fixed
- Fixed search crash on empty query
```

---

## Unreleased Section

Always keep an `[Unreleased]` section at the top:

```markdown
## [Unreleased]

### Added
- Work in progress features
```

When releasing a version:

1. Rename `[Unreleased]` to the version and date
2. Add a new `[Unreleased]` section above it

**Before release:**
```markdown
## [Unreleased]

### Added
- Favorites widget
```

**After releasing v1.1.0:**
```markdown
## [Unreleased]

## [1.1.0] - 2026-09-15

### Added
- Favorites widget
```

---

## When to Update

### Every PR

If your PR adds a user-facing change:

1. Add an entry to `[Unreleased]`
2. Commit it with your PR
3. Use present tense: "Add" not "Added"

### At Release Time

When cutting a new release:

1. Rename `[Unreleased]` to the version
2. Add the release date
3. Change present tense to past tense
4. Add a new `[Unreleased]` section

---

## Grouping Changes

Within each category, group related changes:

```markdown
### Added

**Search**
- Search history dropdown with recent queries
- Clear all history button
- Tap to reuse previous searches

**Widgets**
- Daily memory widget
- Random photos widget
- Favorites widget

**Accessibility**
- Screen reader labels on all buttons
- Reduced motion support
```

---

## Links

Add version comparison links at the bottom:

```markdown
[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

---

## Examples from Lumora

### Real Changelog Entry

```markdown
## [1.0.0] - 2026-08-26

### Added
- Album browsing with pull-to-refresh and skeleton loading
- Photo grid with adaptive 2/3/4-column density
- Full-screen photo viewer with pinch-zoom, pan, and swipe gestures
- Photo deletion with confirmation dialog
- Light/dark/system theme with MMKV persistence
- Reduced motion support (system + manual override)
- Widget dashboard with 4 widget types
- Favorites storage infrastructure
- Search with debounced filtering and history
- Comprehensive test suite with 93%+ coverage

### Changed
- Migrated to React Native 0.79 with New Architecture
- Upgraded to Expo SDK 53
- Updated to React 19

### Removed
- Unused expo-secure-store dependency
- Unused expo-web-browser dependency
- Legacy expo-font dependency

### Fixed
- Lint warnings in test files
- Type errors in MediaService
- Cache invalidation edge cases
```

---

## PR Template

When creating a PR, include a changelog entry in your description:

```markdown
## Changelog Entry

**Category:** Added / Changed / Fixed / Removed

**Entry:**
- Brief description of the change from user perspective

---

*This will be added to `[Unreleased]` section*
```

---

## Review Checklist

Before merging:

- [ ] Entry is in `[Unreleased]` section
- [ ] Entry is user-focused, not developer-focused
- [ ] Entry is specific and clear
- [ ] Entry is in the correct category
- [ ] Entry uses present tense
- [ ] Related entries are grouped together

---

## Automation

### Commit Message Format

Use conventional commits to help automate changelog generation:

```
feat: add search history dropdown
^--^  ^-----------------------^
│     │
│     └─⫸ Summary in present tense
│
└─────⫸ Type: feat, fix, docs, style, refactor, test, chore
```

**Types:**
- `feat` → Added
- `fix` → Fixed
- `refactor` → Changed (internal)
- `docs` → (no changelog entry)
- `test` → (no changelog entry)
- `chore` → (no changelog entry)

---

## See Also

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — PR workflow
