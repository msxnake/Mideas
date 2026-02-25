# MSX Skill Wrappers

These repo-local wrappers forward to Codex skill scripts in `~/.codex/skills`.
Use them directly so command paths stay stable across sessions.

## Commands

```powershell
python scripts/build_mideas_unified_rom.py --help
python scripts/compile_glass.py --help
python scripts/open_openmsx.py --help
```

## Notes

- Wrapper search order: `CODEX_HOME`, `%USERPROFILE%\.codex`, `~/.codex`.
- If a skill is missing, the wrapper prints a clear error and exits with code `1`.
