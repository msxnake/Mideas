# Session Notes - joc_manic_miner_clone2

Date: 2026-02-21
Project file: `Examples/joc_manic_miner_clone2.asm`

## Current State

- Start screen restored to original as screen index `0`.
- New custom screen (based on your mockup) is now screen index `1` (`LEVEL_MAP_0`).
- Third screen remains in `LEVEL_MAP_2` (screen index `2`).
- Screen progression:
  - `0 -> 1` at `12` gems.
  - `1 -> 2` at `24` gems.
- HUD reworked:
  - Top framed panel drawn by `DRAW_HUD_PANEL`.
  - Score text is `SCORE::000000`.
  - Right side shows `LEVEL 0x` from `CURRENT_SCREEN + 1`.
- HUD tile set imported from `C:\Users\salam\Downloads\custom_tileset_SCREEN2.asm`:
  - Frame tiles integrated in tiles `9..13`.
  - Digits `7,8,9` restored in tiles `4,5,6`.
- Audio:
  - Gem pickup `plink` via PSG.
  - Game over jingle `ta da naaa` via PSG state machine.
- Fall behavior:
  - Wrap from bottom to top (Bubble Bobble style) in `STEP_PLAYER_DOWN_ONE`.

## Key Labels

- `COPY_LEVEL_TO_RAM`
- `SET_ENTITIES_FOR_SCREEN`
- `CHECK_SCREEN_PROGRESS`
- `DRAW_HUD_PANEL`
- `DRAW_SCORE`
- `PLAY_GEM_PLINK`
- `START_GAMEOVER_SFX`
- `STEP_PLAYER_DOWN_ONE`

## Next Pending Item

- Implement a second-screen layout matching the latest image you provided (sector-style platforms).

## Build / Run Commands

Compile:

```powershell
python C:/Users/salam/.codex/skills/compilar-con-glass-jar/scripts/compile_glass.py --source Examples/joc_manic_miner_clone2.asm --output Examples/joc_manic_miner_clone2.rom --project-root c:/Users/salam/Documents/Programacion/Mideas
```

Run in OpenMSX:

```powershell
python C:/Users/salam/.codex/skills/abrir-openmsx-rom/scripts/open_openmsx.py --rom Examples/joc_manic_miner_clone2.rom --project-root c:/Users/salam/Documents/Programacion/Mideas
```

## Note About Workspace State

There are other modified/untracked files in the repo unrelated to this game file. They were not reverted.
