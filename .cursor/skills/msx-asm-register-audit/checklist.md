# MSX ASM register audit checklist

Copy per routine under review.

## Routine: _______________

- [ ] Listed all `call` sites
- [ ] Documented input registers / RAM
- [ ] Documented output registers / flags / RAM
- [ ] Documented preserved vs clobbered registers
- [ ] Every `ret` path restores stack (push/pop count = 0 net)
- [ ] Every conditional branch to `ret` matches main path restore
- [ ] No `ld hl,de` / `ld hl,bc` / `add hl,a` / invalid `ld (addr),b`
- [ ] No `ld a,i` interrupt-save pattern in critical sections
- [ ] Indexing uses `ld b,0` + `add hl,bc` when slot in C
- [ ] 8-bit stores use `ld a,reg` then `ld (label),a`
- [ ] `jr` targets verified within ±127 bytes (else `jp`)
- [ ] Helper calls accounted for in clobber set
- [ ] Pixel vs char-grid coords consistent at call boundary
- [ ] Play mode vs ROM parity considered

## Common exit-path traps

1. `call foo` → `foo` clobbers `BC` → caller uses `BC` without reload
2. `push bc` / … / `ld b,0` / `add hl,bc` / … / `pop bc` / `inc c` / `djnz` — OK
3. `push bc` / … / forget `pop` on early `ret` — stack leak
4. `ld a,(msx2_push_box_active)` then `ld c,a` but `A` overwritten before use
5. Support check returns carry but `A` no longer holds slot

## Sign-off

- Auditor:
- Files touched:
- Regenerated ASM: yes / no
- glass.jar clean: yes / no
