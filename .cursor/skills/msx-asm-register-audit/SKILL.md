---
name: msx-asm-register-audit
description: Audit MSX Z80 ASM routines (generated or hand-written) for register corruption, stack imbalance, and invalid instructions before merge or after gameplay bugs. Use when modifying utils/msxGenerator ASM emitters, debugging OpenMSX behavior, reviewing push/collision/IRQ routines, or when the user mentions register clobber, stack corruption, or ASM review.
---

# MSX ASM Register Audit

Systematic review of Z80 routines emitted by Mideas or written by hand. Goal: every `call`/`ret` path preserves the contract callers rely on.

## When to run

- After changing any file under `utils/msxGenerator/generators/**/*.ts` that emits ASM strings.
- When runtime diverges from Play mode (wrong position, death on touch, silent no-op).
- Before closing a bug labeled "works in editor, wrong in ROM".
- Pair with `docs/msx/Z80_INSTRUCTIONS_REFERENCE.md` and `docs/msx/Z80_LDA_I_ERRATA.md`.

Also read Codex skill `asm-generator-register-guard` when **editing** generators; this skill is for **auditing** the emitted result.

## Audit workflow

1. **Name the routine** and list every `call` site (`rg "call <label>"`).
2. **Write the contract** (explicit or inferred):
   - Inputs: registers / RAM variables read on entry.
   - Outputs: registers, flags (carry/zero), RAM written.
   - Must preserve: registers callers still need after return.
   - May clobber: everything else (document it in a `; Clobbers …` comment if missing).
3. **Trace every exit** (`ret`, `jp`/`jr` to outside, early `ret z`, tail `jp`):
   - Same restore logic on all paths?
   - `push`/`pop` balanced? Count depth per path.
4. **Trace through helpers**: if routine A calls B, B's clobbers must not break A's contract unless A saved first.
5. **Flag IRQ-sensitive code**: never use `ld a,i` / `ld a,r` + flag tricks for interrupt state (see errata doc).
6. **Verify indexing**: slot in `C` + `ld b,0` + `add hl,bc` — not `ld hl,bc`. Store 8-bit to `(addr)` via `ld a,r` / `ld (addr),a`, never `ld (addr),b`.
7. **Verify jump distance**: prefer `jp` when label may be far; `jr` out of range fails at compile time.
8. **Output a short report** (see template below).

## High-risk patterns in Mideas

| Pattern | Risk |
|---------|------|
| `push bc` then reuse `B` as zero index without `pop` before `djnz` | Loop count destroyed |
| `ld c,a` after helper that returns value in `A` but caller needed old `C` | Wrong slot index |
| Using pixel coords in char-grid helpers (`msx2_grid_draw_char_block_16`) | Wrong VRAM position |
| `call` that clobbers `DE` then `ldir` source/dest still in `DE` | Memory corruption |
| Effect layer stamps `kind:hazard` on pushable props | Player death without enemy slot |
| Enemy/hazard tables including `msx2_push_box` entities | Damage + duplicate behavior |

## Coordinate helpers

`msx2_grid_draw_char_block_16` expects **char grid** coords:

- `B` = pixel X ÷ 8
- `C` = pixel Y ÷ 8

Runtime push-box logic uses **pixels** in RAM; convert before char draw.

## Report template

```markdown
## ASM audit: <routine>

**Call sites:** …
**Contract:** In … / Out … / Preserve … / Clobber …

### Findings
1. [SEVERITY] Path `.label` — …
2. …

### Suggested fix
- …
```

## Severity

- **BLOCKER**: Wrong exit path, stack leak, invalid Z80, IRQ errata violation.
- **HIGH**: Output register wrong on some branches; caller register clobbered.
- **MEDIUM**: Missing clobber comment; redundant push/pop (size only).
- **LOW**: Style / could use `jp` instead of risky `jr`.

## Scope shortcuts

| Subsystem | Generator file |
|-----------|----------------|
| Push box | `msx2PushBoxComponentGenerator.ts` |
| Grid snap / char draw | `msx2GridSnapComponentGenerator.ts` |
| Player move + hooks | `msx2Screen4Generator.ts` (~move_hardware_sprite_*) |
| Enemy damage | `msx2Screen4Generator.ts` (~update_msx2_enemy_state) |
| Effects / hazards | `msx2Screen4Generator.ts` (~buildTileScreenLayerBytes effects) |

After fixes, regenerate ASM from project JSON and compile with glass.jar.
