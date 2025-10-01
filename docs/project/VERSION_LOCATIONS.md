# Version Change Locations

This file documents all the locations where the version number needs to be updated when releasing a new version.

## Current Version: 0.250

## Files to Update:

### 1. README.md
- **Location**: Line 3
- **Format**: `**Version X.XX**`
- **Example**: `**Version 0.23**`

### 2. constants.ts
- **Location**: Line 4
- **Format**: `export const APP_VERSION = "X.XX";`
- **Example**: `export const APP_VERSION = "0.23";`
- **Note**: This constant is used by:
  - `components/modals/AboutModal.tsx` - Shows version in About dialog
  - `components/layout/Toolbar.tsx` - Shows version in toolbar

## Quick Update Checklist:

When updating to a new version (e.g., 0.231):

1. [ ] Update README.md: Change `**Version 0.23**` to `**Version 0.231**`
2. [ ] Update constants.ts: Change `export const APP_VERSION = "0.23";` to `export const APP_VERSION = "0.231";`
3. [ ] Update this file: Change "Current Version: 0.23" to "Current Version: 0.231"

## Automated Usage:

You can use find/replace across the project:
- Find: `0.23` 
- Replace: `0.231`
- Files to include: `README.md`, `constants.ts`, `VERSION_LOCATIONS.md`

## Version Increment Rules:

**IMPORTANT**: When asked to "incrementar version" or "increment version":
- Always increment by 0.001 (e.g., 0.23 → 0.231)
- This is the standard increment for this project

## Pregunta al usuario:
1. ¿quieres actualizar changeLog.txt?
2. Si responde "sí" o "yes":
  -   ejecuta "node generateChangeLog.js"
  

## Git Workflow:

After updating the version:
1. **Always ask**: "¿Quieres subirlo a GitHub?"
2. **If user responds "sí" or "yes"**:
   - Create git commit with message: "Version X.XX - [brief description of changes]"
   - Push to GitHub automatically
   - Format: `git commit -m "Version 0.231 - [brief description of changes]"`

## Notes:

- The `APP_VERSION` constant automatically updates the version display in:
  - About Modal
  - Toolbar version indicator
- No need to manually update the About modal or Toolbar files
- Always update this file when changing versions to keep track of the current version
- **Remember**: Standard increment is +0.01