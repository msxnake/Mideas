# Post-ASM Report

- Input: `C:\Users\salam\Downloads\pp5.asm`
- Findings: 6
- Applied patches: 6
- Original lines: 19296
- Output lines: 19237
- Net line delta: -59

## ROM Validation

- Original ROM bytes: 22962
- Optimized ROM bytes: 22870
- ROM byte delta: -92
- ROM SHA256 equal: False

## active-list-redundant-screen-check

- Metrics: findings=3, patchable=3, removed_lines=30
- Routines: update_gravity_component, update_input_component, update_position_component

- [patchable] `update_position_component` lines 2420-2429: Routine `update_position_component` rechecks `entity_screen_id` against `current_screen_id` after iterating `active_entity_list`, which already encodes current-screen membership.
- [patchable] `update_input_component` lines 3840-3849: Routine `update_input_component` rechecks `entity_screen_id` against `current_screen_id` after iterating `active_entity_list`, which already encodes current-screen membership.
- [patchable] `update_gravity_component` lines 4805-4814: Routine `update_gravity_component` rechecks `entity_screen_id` against `current_screen_id` after iterating `active_entity_list`, which already encodes current-screen membership.

## active-list-redundant-active-check

- Metrics: findings=1, patchable=1, removed_lines=9
- Routines: update_sprite_component

- [patchable] `update_sprite_component` lines 2519-2527: Routine `update_sprite_component` rechecks `entity_active` after iterating `active_entity_list`, which already excludes inactive entities.

## deadly-recompute-in-tile-interaction

- Metrics: findings=1, patchable=1, removed_lines=19
- Routines: check_tile_interaction

- [patchable] `check_tile_interaction` lines 6462-6480: Tile interaction recomputes deadly state late in the frame. This overlaps with earlier deadly/collision passes. A prior `update_deadly_tiles_component` pass already runs earlier in `update_all_entities`, so this block can be removed.

## hud-double-work

- Metrics: findings=1, patchable=1, removed_lines=1
- Routines: check_tile_interaction

- [patchable] `check_tile_interaction` lines 6599-6600: Routine `check_tile_interaction` updates score digits and then forces a full HUD render. The first call can be removed because force_render_hud already re-applies score digits.

