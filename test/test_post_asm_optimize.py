#!/usr/bin/env python3
from pathlib import Path
import importlib.util
import json
import subprocess
import sys
import tempfile


def load_optimizer_module():
    sys.dont_write_bytecode = True
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "post_asm_optimize.py"
    spec = importlib.util.spec_from_file_location("post_asm_optimize", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {script_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def load_builder_module():
    sys.dont_write_bytecode = True
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "build_mideas_unified_rom.py"
    spec = importlib.util.spec_from_file_location("build_mideas_unified_rom", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {script_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


ASM_WITH_BLOCKS = """
boot_entry:
    call used_label
    call referenced_runtime_helper
    call load_screen_used
    ret

tilebank_pattern_data_0:
    db 1, 2, 3, 4

SM_GlobalVarWordTable:
    db 0, 1
SM_TemplateProfileCount EQU 1

NINA_DEAD_RIGHT_6_F1_LAYER2:
    db 0, 1, 2, 3

print_string_loop:
    ld a, (hl)
    jr print_string_loop

check_transition_worldmap_1_s0_apply_east:
    ret

unused_runtime_helper:
    ld a, 1
    ret

referenced_runtime_helper:
    ld a, 2
    ret

load_screen_unused:
    call resource_load_screen_tiles
    ret

load_screen_used:
    call resource_load_screen_tiles
    ret

load_screen_review_far:
    call load_screen_review
    ret

; @mideas:block id=runtime.screens.load_screen_review.loader kind=routine owner=screens roots=load_screen_review
load_screen_review:
    ret
; @mideas:endblock id=runtime.screens.load_screen_review.loader

; ; @mideas:block id=commented_artifact kind=component owner=test
; commented_artifact_label:
;     ret
; ; @mideas:endblock id=commented_artifact

; @mideas:block id=root_block kind=system owner=test roots=boot deps=dep_block
root_label:
    ret
; @mideas:endblock id=root_block

; @mideas:block id=used_block kind=component owner=test
used_label:
    ret
; @mideas:endblock id=used_block

; @mideas:block id=dep_block kind=component owner=test
dep_label:
    ret
; @mideas:endblock id=dep_block

; @mideas:block id=preserved_block kind=component owner=test preserve=true
preserved_label:
    ret
; @mideas:endblock id=preserved_block

; @mideas:block id=dead_block kind=component owner=test
dead_label:
    ret
; @mideas:endblock id=dead_block
""".strip()


STRICT_GATE_CLEAN_ASM = """
boot_entry:
    call live_label
    ret

; @mideas:block id=live_block kind=component owner=test roots=boot
live_label:
    ret
; @mideas:endblock id=live_block
""".strip()


STRICT_GATE_DEAD_ASM = """
boot_entry:
    call live_label
    ret

; @mideas:block id=live_block kind=component owner=test roots=boot
live_label:
    ret
; @mideas:endblock id=live_block

; @mideas:block id=dead_block kind=component owner=test
dead_label:
    ret
; @mideas:endblock id=dead_block
""".strip()


INACTIVE_FEATURE_ASM = """
boot_entry:
    ret

init_sound_system:
    ret

music_update:
    ret

sfx_update:
    ret

init_menus:
    ret

show_main_menu:
    ret

show_menu_main:
    ret

show_dialogue_box:
    ret

init_boss_system:
    ret

Action_SetVelocity:
    ret
""".strip()


INACTIVE_STATE_MACHINE_EXECUTOR_ASM = """
boot_entry:
    ret

init_statemachine_system:
    ret

update_statemachine_system:
    ret

execute_all_state_machines:
    ret
""".strip()


STATE_MACHINE_DISPATCH_ASM = """
SM_ActionTable:
    DW Action_SetVelocity ; 3

SM_ConditionTable:
    DW Condition_KeyPressed ; 4

Action_SetVelocity:
    ret

Condition_KeyPressed:
    ret
""".strip()


BOSS_ATTACK_USAGE_ASM = """
boot_entry:
    call call_draw_boss_attack_resident
    ret

call_draw_boss_attack_resident:
    jp draw_boss_attack_far

call_draw_boss_meteor_attack_resident:
    jp draw_boss_meteor_attack_far

call_draw_boss_bomb_attack_resident:
    jp draw_boss_bomb_attack_far

draw_boss_attack_far:
    jp draw_boss_attack

draw_boss_meteor_attack_far:
    jp draw_boss_meteor_attack

draw_boss_bomb_attack_far:
    jp draw_boss_bomb_attack

draw_boss_attack:
    jp draw_boss_projectile_attack

draw_boss_projectile_attack:
    ret

draw_boss_meteor_attack:
    ret

draw_boss_bomb_attack:
    ret
""".strip()


BOSS_ATTACK_PATCHABLE_ASM = """
boot_entry:
    ret

call_draw_boss_meteor_attack_resident:
    jp resident_noop

call_draw_boss_bomb_attack_resident:
    jp resident_noop

call_draw_boss_boomerang_attack_resident:
    jp resident_noop

call_draw_boss_rock_attack_resident:
    jp resident_noop

call_draw_boss_laser_attack_resident:
    jp resident_noop

call_draw_boss_sine_wave_attack_resident:
    jp resident_noop

call_draw_boss_homing_missile_attack_resident:
    jp resident_noop

resident_noop:
    ret
""".strip()


BOSS_ATTACK_COMPLEX_REPORT_ONLY_ASM = """
boot_entry:
    ret

update_boss_projectile_runtime_far:
    jp update_boss_projectile_runtime

draw_boss_projectile_attack_far:
    jp draw_boss_projectile_attack

call_update_boss_projectile_runtime_resident:
    jp update_boss_projectile_runtime_far

update_boss_projectile_runtime:
    ret

draw_boss_projectile_attack:
    ret

boss_projectile_select_velocity:
    ret

boss_projectile_show_current:
    ret

boss_projectile_hide_all:
    ret
""".strip()


BOSS_ATTACK_PROJECTILE_EXTERNAL_REF_ASM = """
boot_entry:
    call draw_boss_projectile_attack
    ret

update_boss_projectile_runtime:
    ret

draw_boss_projectile_attack:
    ret

boss_projectile_select_velocity:
    ret

boss_projectile_show_current:
    ret

boss_projectile_hide_all:
    ret
""".strip()


BOSS_ATTACK_COMPLEX_HELPER_REPORT_ASM = """
boot_entry:
    ret

draw_boss_slam_rocks_attack:
    ret

update_boss_slam_rocks_runtime:
    ret

boss_slam_rocks_update_boss_y:
    ret

boss_slam_rocks_seed_lanes:
    ret

boss_slam_rocks_random_byte:
    ret

boss_slam_rocks_clamp_random_x:
    ret

boss_slam_rocks_draw_lanes:
    ret

boss_slam_rocks_age_to_distance:
    ret

boss_slam_rocks_get_lane_x:
    ret

boss_slam_rocks_hide_all:
    ret

draw_boss_falling_blocks_attack:
    ret

update_boss_falling_blocks_runtime:
    ret

boss_falling_blocks_seed_lanes:
    ret

boss_falling_blocks_random_byte:
    ret

boss_falling_blocks_clamp_random_x:
    ret

boss_falling_blocks_draw_lanes:
    ret

boss_falling_blocks_age_to_distance:
    ret

boss_falling_blocks_lane_mask:
    ret

boss_falling_blocks_get_lane_x:
    ret

boss_falling_blocks_write_landed_tile:
    ret

boss_falling_blocks_hide_all:
    ret
""".strip()


BOSS_ATTACK_COMPLEX_HELPER_EXTERNAL_REF_ASM = """
boot_entry:
    call boss_slam_rocks_draw_lanes
    call boss_falling_blocks_write_landed_tile
    ret

draw_boss_slam_rocks_attack:
    ret

update_boss_slam_rocks_runtime:
    ret

boss_slam_rocks_update_boss_y:
    ret

boss_slam_rocks_seed_lanes:
    ret

boss_slam_rocks_random_byte:
    ret

boss_slam_rocks_clamp_random_x:
    ret

boss_slam_rocks_draw_lanes:
    ret

boss_slam_rocks_age_to_distance:
    ret

boss_slam_rocks_get_lane_x:
    ret

boss_slam_rocks_hide_all:
    ret

draw_boss_falling_blocks_attack:
    ret

update_boss_falling_blocks_runtime:
    ret

boss_falling_blocks_seed_lanes:
    ret

boss_falling_blocks_random_byte:
    ret

boss_falling_blocks_clamp_random_x:
    ret

boss_falling_blocks_draw_lanes:
    ret

boss_falling_blocks_age_to_distance:
    ret

boss_falling_blocks_lane_mask:
    ret

boss_falling_blocks_get_lane_x:
    ret

boss_falling_blocks_write_landed_tile:
    ret

boss_falling_blocks_hide_all:
    ret
""".strip()


COMPONENT_RUNTIME_USAGE_ASM = """
boot_entry:
    call update_jump_component
    ret

update_input_component:
    ret

update_jump_component:
    ret

init_gravity_system:
    ret

update_gravity_component:
    ret
""".strip()


COMPONENT_RUNTIME_HELPER_EXTERNAL_ASM = """
boot_entry:
    call walljump_process_entity_c
    ret

init_walljump_system:
    ret

update_walljump_component:
    ret

walljump_process_entity_c:
    ret

walljump_input_is_left:
    ret

walljump_input_is_right:
    ret
""".strip()


COMPONENT_RUNTIME_WALLGRAB_HELPER_EXTERNAL_ASM = """
boot_entry:
    call refresh_player_wallgrab_fastpath
    ret

gameflow_world_game_loop:
    call update_wallgrab_component
    ret

init_wallgrab_system:
    ret

update_wallgrab_component:
    ret

refresh_player_wallgrab_fastpath:
    call wallgrab_process_entity_c
    ret

wallgrab_process_entity_c:
    ret
""".strip()


COMPONENT_RUNTIME_TILE_INTERACTION_ASM = """
boot_entry:
    call update_slash_component
    ret

gameflow_world_game_loop:
    call refresh_player_tile_interaction_fastpath
    ret

init_tile_interaction_system:
    ret

update_slash_component:
    ret

refresh_player_tile_interaction_fastpath:
    ret
""".strip()


COMPONENT_RUNTIME_AUTO_CONTROL_EVENT_EXTERNAL_ASM = """
boot_entry:
    call update_auto_event_string_component
    ret

init_auto_control_script_system:
    ret

update_auto_control_script_component:
    ret

update_auto_event_string_component:
    ret
""".strip()


COMPONENT_RUNTIME_CURSORS_INIT_EXTERNAL_ASM = """
boot_entry:
    call init_cursors_system
    ret

init_cursors_system:
    ret

update_cursors_component:
    ret
""".strip()


COMPONENT_RUNTIME_DAMAGE_HELPER_EXTERNAL_ASM = """
boot_entry:
    call apply_damage_to_entity
    ret

init_damage_system:
    ret

update_damage_component:
    ret

apply_damage_to_entity:
    ret

check_entity_invincible:
    ret
""".strip()


COMPONENT_RUNTIME_HEALTH_HELPER_EXTERNAL_ASM = """
boot_entry:
    call decrease_entity_lives
    ret

init_health_system:
    ret

update_health_component:
    ret

decrease_entity_lives:
    ret

increase_entity_lives:
    ret
""".strip()


ANNOTATED_INACTIVE_FEATURE_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.sound.resident_wrappers kind=routine owner=sound roots=call_music_update_resident,call_sfx_update_resident
call_music_update_resident:
    jp music_update_far

call_sfx_update_resident:
    jp sfx_update_far
; @mideas:endblock id=runtime.sound.resident_wrappers

music_update_far:
    ret

sfx_update_far:
    ret
""".strip()


ATOMIC_INACTIVE_FEATURE_GROUP_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.sound.resident.music_execute_command kind=routine owner=sound
call_music_execute_command_resident:
    jp music_execute_command_far
; @mideas:endblock id=runtime.sound.resident.music_execute_command

music_execute_command_far:
    jp music_execute_command

; @mideas:block id=runtime.sound.music_noop_runtime kind=routine owner=sound
music_stop:
    ret

music_execute_command:
    jp music_stop
; @mideas:endblock id=runtime.sound.music_noop_runtime
""".strip()


ATOMIC_MUSIC_STOP_GROUP_ASM = """
boot_entry:
    call music_update
    ret

; @mideas:block id=runtime.sound.resident.music_stop kind=routine owner=sound
call_music_stop_resident:
    jp music_stop_far
; @mideas:endblock id=runtime.sound.resident.music_stop

music_stop_far:
    jp music_stop

; @mideas:block id=runtime.sound.music_noop_runtime kind=routine owner=sound
music_update:
    ret

music_stop:
    ret
; @mideas:endblock id=runtime.sound.music_noop_runtime
""".strip()


ATOMIC_SFX_UPDATE_GROUP_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.sound.resident.sfx_update kind=routine owner=sound
call_sfx_update_resident:
    jp sfx_update_far
; @mideas:endblock id=runtime.sound.resident.sfx_update

sfx_update_far:
    jp sfx_update

; @mideas:block id=runtime.sound.sfx_runtime kind=routine owner=sound
sfx_update:
    ret

psg_idle:
    ret
; @mideas:endblock id=runtime.sound.sfx_runtime
""".strip()


ATOMIC_MUSIC_UPDATE_GROUP_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.sound.resident.music_update kind=routine owner=sound
call_music_update_resident:
    jp music_update_far
; @mideas:endblock id=runtime.sound.resident.music_update

music_update_far:
    jp music_update

; @mideas:block id=runtime.sound.music_runtime kind=routine owner=sound
music_update:
    ret

psg_idle:
    ret
; @mideas:endblock id=runtime.sound.music_runtime
""".strip()


ATOMIC_BOSS_GROUP_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.far_trampoline.init_boss_system_far kind=routine owner=far-call preserve=true
init_boss_system_far:
    jp init_boss_system
; @mideas:endblock id=runtime.far_trampoline.init_boss_system_far

; @mideas:block id=runtime.far_trampoline.init_screen_boss_from_current_screen_far kind=routine owner=far-call preserve=true
init_screen_boss_from_current_screen_far:
    jp init_screen_boss_from_current_screen
; @mideas:endblock id=runtime.far_trampoline.init_screen_boss_from_current_screen_far

; @mideas:block id=runtime.far_trampoline.update_boss_system_far kind=routine owner=far-call preserve=true
update_boss_system_far:
    jp update_boss_system
; @mideas:endblock id=runtime.far_trampoline.update_boss_system_far

; @mideas:block id=runtime.far_trampoline.draw_boss_attack_far kind=routine owner=far-call preserve=true
draw_boss_attack_far:
    jp draw_boss_attack
; @mideas:endblock id=runtime.far_trampoline.draw_boss_attack_far

; @mideas:block id=runtime.boss.resident_wrappers kind=routine owner=bosses
call_init_boss_system_resident:
    jp init_boss_system_far
call_init_screen_boss_from_current_screen_resident:
    jp init_screen_boss_from_current_screen_far
call_update_boss_system_resident:
    jp update_boss_system_far
call_update_boss_projectile_runtime_resident:
    jp update_boss_projectile_runtime
call_draw_boss_attack_resident:
    jp draw_boss_attack_far
call_draw_boss_meteor_attack_resident:
    ret
call_draw_boss_bomb_attack_resident:
    ret
call_draw_boss_boomerang_attack_resident:
    ret
call_draw_boss_rock_attack_resident:
    ret
call_draw_boss_laser_attack_resident:
    ret
call_draw_boss_sine_wave_attack_resident:
    ret
call_draw_boss_homing_missile_attack_resident:
    ret
; @mideas:endblock id=runtime.boss.resident_wrappers

; @mideas:block id=runtime.boss.entry kind=routine owner=bosses
init_boss_system:
    ret
update_boss_system:
    ret
init_screen_boss_from_current_screen:
    ret
; @mideas:endblock id=runtime.boss.entry

; @mideas:block id=runtime.boss.core kind=routine owner=bosses
update_boss_projectile_runtime:
    ret
update_boss_behavior:
    ret
draw_boss_attack:
    jp draw_boss_projectile_attack
draw_boss_projectile_attack:
    ret
draw_active_boss_tiles:
    ret
restore_active_boss_tiles:
    ret
restore_active_boss_tiles_exposed:
    ret
boss_push_data_bank:
    ret
boss_pop_data_bank:
    ret
boss_resolve_initial_phase:
    ret
boss_init_behavior_state:
    ret
boss_prepare_behavior_move_timing:
    ret
boss_tick_behavior_move_step:
    ret
boss_step_towards_behavior_target:
    ret
boss_resolve_behavior_target:
    ret
boss_load_current_behavior_action:
    ret
boss_apply_behavior_form:
    ret
boss_draw_behavior_attack:
    ret
boss_attack_get_sprite_pattern:
    ret
boss_get_active_tile_char:
    ret
boss_get_runtime_layout_char:
    ret
boss_current_shape_covers_draw_cell:
    ret
boss_draw_write_cell:
    ret
boss_projectile_show_current:
    ret
boss_projectile_hide_all:
    ret
boss_slam_rocks_hide_all:
    ret
boss_falling_blocks_hide_all:
    ret
; @mideas:endblock id=runtime.boss.core
""".strip()


ATOMIC_BOSS_STUB_GROUP_ASM = """
boot_entry:
    ret

; @mideas:block id=runtime.far_trampoline.init_boss_system_far kind=routine owner=far-call preserve=true
init_boss_system_far:
    jp init_boss_system
; @mideas:endblock id=runtime.far_trampoline.init_boss_system_far

; @mideas:block id=runtime.far_trampoline.init_screen_boss_from_current_screen_far kind=routine owner=far-call preserve=true
init_screen_boss_from_current_screen_far:
    jp init_screen_boss_from_current_screen
; @mideas:endblock id=runtime.far_trampoline.init_screen_boss_from_current_screen_far

; @mideas:block id=runtime.far_trampoline.update_boss_system_far kind=routine owner=far-call preserve=true
update_boss_system_far:
    jp update_boss_system
; @mideas:endblock id=runtime.far_trampoline.update_boss_system_far

; @mideas:block id=runtime.boss.resident_wrappers kind=routine owner=bosses
call_init_boss_system_resident:
    jp init_boss_system_far
call_init_screen_boss_from_current_screen_resident:
    jp init_screen_boss_from_current_screen_far
call_update_boss_system_resident:
    jp update_boss_system_far
call_update_boss_projectile_runtime_resident:
    jp resident_noop
call_draw_boss_attack_resident:
    jp resident_noop
call_draw_boss_meteor_attack_resident:
    jp resident_noop
call_draw_boss_bomb_attack_resident:
    jp resident_noop
call_draw_boss_boomerang_attack_resident:
    jp resident_noop
call_draw_boss_rock_attack_resident:
    jp resident_noop
call_draw_boss_laser_attack_resident:
    jp resident_noop
call_draw_boss_sine_wave_attack_resident:
    jp resident_noop
call_draw_boss_homing_missile_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident_wrappers

; @mideas:block id=runtime.boss.entry kind=routine owner=bosses
init_boss_system:
    ret
update_boss_system:
    ret
init_screen_boss_from_current_screen:
    ret
; @mideas:endblock id=runtime.boss.entry

resident_noop:
    ret
""".strip()


BLOCKED_MUSIC_UPDATE_GROUP_ASM = ATOMIC_MUSIC_UPDATE_GROUP_ASM.replace(
    "boot_entry:\n    ret",
    "boot_entry:\n    call call_music_update_resident\n    ret",
)


def build_module(optimizer, text: str, metadata: dict | None = None):
    return optimizer.build_module(Path("inline.asm"), text.splitlines(), metadata=metadata)


def status_by_block(optimizer, module):
    return {analysis.block_id: analysis for analysis in optimizer.analyze_blocks(module)}


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def assert_in(needle: str, haystack: str, label: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"{label}: expected {needle!r} in output")


def assert_not_in(needle: str, haystack: str, label: str) -> None:
    if needle in haystack:
        raise AssertionError(f"{label}: did not expect {needle!r} in output")


def assert_raises_contains(callback, expected: str, label: str) -> None:
    try:
        callback()
    except RuntimeError as exc:
        if expected not in str(exc):
            raise AssertionError(f"{label}: expected {expected!r}, got {exc!r}") from exc
        return
    raise AssertionError(f"{label}: expected RuntimeError containing {expected!r}")


def verify_strict_gate() -> None:
    builder = load_builder_module()
    project_root = Path(__file__).resolve().parents[1]
    optimizer = project_root / "scripts" / "post_asm_optimize.py"
    with tempfile.TemporaryDirectory() as raw_tmp:
        tmpdir = Path(raw_tmp)
        clean_asm = tmpdir / "clean.asm"
        clean_asm.write_text(STRICT_GATE_CLEAN_ASM, encoding="utf-8")
        builder.enforce_post_asm_no_dead_blocks(project_root, optimizer, clean_asm)
        clean_report = builder.post_asm_report_json_path(clean_asm)
        if not clean_report.exists():
            raise AssertionError("strict gate should emit a clean post-ASM JSON report")

        dead_asm = tmpdir / "dead.asm"
        dead_asm.write_text(STRICT_GATE_DEAD_ASM, encoding="utf-8")
        assert_raises_contains(
            lambda: builder.enforce_post_asm_no_dead_blocks(project_root, optimizer, dead_asm),
            "strict dead-block gate requires zero candidates",
            "strict dead-block gate failure",
        )


def verify_build_post_asm_summary_formatter() -> None:
    builder = load_builder_module()
    report_path = Path("inline.post-asm-report.json")
    report = {
        "findings": [{"rule_id": "dead-blocks"} for _ in range(2)],
        "applied_patches": 2,
        "metrics": {
            "selected_rules": ["dead-blocks", "unused-screen-loaders"],
            "block_inventory": {
                "dead_block_candidates": 2,
                "dead_candidate_lines": 9,
                "dead_candidate_source_bytes": 321,
            },
            "optimization_summary": {
                "passes_run": 2,
                "removed_lines": 9,
                "removed_source_bytes": 321,
            },
            "optimization_passes": [
                {
                    "pass": 1,
                    "patchable": 2,
                    "removed_lines": 9,
                    "removed_source_bytes": 321,
                    "input_line_count": 100,
                    "output_line_count": 91,
                },
                {
                    "pass": 2,
                    "patchable": 0,
                    "removed_lines": 0,
                    "removed_source_bytes": 0,
                    "input_line_count": 91,
                    "output_line_count": 91,
                },
            ],
        },
    }
    summary = "\n".join(builder.format_post_asm_report_summary(report_path, report))
    assert_in("findings=2", summary, "build post-ASM summary finding count")
    assert_in("Post-ASM rules: dead-blocks, unused-screen-loaders", summary, "build post-ASM rules summary")
    assert_in("deadBlocks=2 (9 lines / 321 bytes)", summary, "build post-ASM dead-block summary")
    assert_in("Post-ASM savings: passes=2, removed=9 lines / 321 bytes", summary, "build post-ASM savings")
    assert_in("p1:2 patches,9l/321b,100->91", summary, "build post-ASM pass detail")


def verify_cli_apply_defaults_to_patchable_rules() -> None:
    project_root = Path(__file__).resolve().parents[1]
    optimizer = project_root / "scripts" / "post_asm_optimize.py"
    with tempfile.TemporaryDirectory() as raw_tmp:
        tmpdir = Path(raw_tmp)
        asm_path = tmpdir / "default_apply.asm"
        output_path = tmpdir / "default_apply.optimized.asm"
        asm_path.write_text(STRICT_GATE_DEAD_ASM, encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(optimizer),
                "--input",
                str(asm_path),
                "--apply",
                "--output",
                str(output_path),
                "--passes",
                "1",
            ],
            cwd=project_root,
            text=True,
            capture_output=True,
        )
        if result.returncode != 0:
            raise AssertionError(f"default --apply command failed: {result.stderr or result.stdout}")
        transformed = output_path.read_text(encoding="utf-8")
        assert_not_in("dead_label:", transformed, "default --apply removes dead block")
        report = json.loads(asm_path.with_suffix(".post-asm-report.json").read_text(encoding="utf-8"))
        assert_equal(report["applied_patches"], 1, "default --apply applied patch count")
        assert_equal(
            report["metrics"]["selected_rules"],
            [
                "dead-blocks",
                "unused-screen-loaders",
                "inactive-feature-runtime",
                "unused-boss-attack-runtime",
                "unused-component-runtime",
                "state-machine-dispatch-handlers",
            ],
            "default --apply selected rule ids",
        )


def main() -> int:
    optimizer = load_optimizer_module()
    metadata = {
        "project_usage": {
            "gameFlowReachability": {
                "scenes": [
                    {
                        "id": "screenmap_unused",
                        "name": "unused",
                        "index": 0,
                        "reachable": False,
                        "reason": "not reached from GameFlow start graph",
                        "sources": [],
                    },
                    {
                        "id": "screenmap_review",
                        "name": "review",
                        "index": 1,
                        "reachable": False,
                        "reason": "not reached from GameFlow start graph",
                        "sources": [],
                    },
                ]
            },
            "scenes": [
                {"id": "screenmap_unused", "name": "unused", "index": 0, "resourceCount": 3},
                {"id": "screenmap_review", "name": "review", "index": 1, "resourceCount": 4},
            ]
        },
        "load_plan": {"scenes": []},
    }
    module = build_module(optimizer, ASM_WITH_BLOCKS, metadata=metadata)
    inactive_feature_module = build_module(
        optimizer,
        INACTIVE_FEATURE_ASM,
        metadata={
            "project_usage": {
                "features": {
                    "sounds": False,
                    "menus": False,
                    "dialogues": False,
                    "bosses": False,
                    "stateMachines": True,
                },
                "counts": {
                    "sounds": 0,
                    "tracks": 0,
                    "menus": 0,
                    "dialogues": 0,
                    "bosses": 0,
                    "bossInstances": 0,
                    "stateMachines": 1,
                },
            }
        },
    )
    embedded_metadata = optimizer.extract_embedded_artifact_metadata([
        "; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]",
        "; {",
        ';   "scenes": [{"id": "screenmap_unused", "name": "unused", "index": 0}],',
        ';   "gameFlowReachability": {"scenes": [{"id": "screenmap_unused", "reachable": false}]}',
        "; }",
        "; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]",
    ])
    assert_equal(
        embedded_metadata["project_usage"]["gameFlowReachability"]["scenes"][0]["reachable"],
        False,
        "embedded project_usage artifact extraction",
    )
    boss_attack_usage_module = build_module(
        optimizer,
        BOSS_ATTACK_USAGE_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": True},
                "counts": {"bosses": 1, "bossInstances": 1},
                "bossAttackRuntime": {
                    "usedTypes": ["Projectile"],
                    "unusedTypes": ["Meteor", "Bomb"],
                    "typeCounts": {"Projectile": 1},
                    "referencedAttacks": 1,
                },
            }
        },
    )
    boss_attack_findings = optimizer.collect_rule_findings(
        boss_attack_usage_module,
        [optimizer.UnusedBossAttackRuntimeRule()],
    )
    assert_equal(
        [finding.routine for finding in boss_attack_findings],
        ["runtime.boss.attack.meteor", "runtime.boss.attack.bomb"],
        "unused boss attack type findings",
    )
    if any(finding.patchable for finding in boss_attack_findings):
        raise AssertionError("unused boss attack runtime rule must remain report-only")
    boss_attack_summary = "\n".join(finding.summary for finding in boss_attack_findings)
    assert_in(
        "`project_usage.bossAttackRuntime.usedTypes` is Projectile",
        boss_attack_summary,
        "unused boss attack type project_usage evidence",
    )
    assert_in(
        "Patch policy: report-only",
        boss_attack_summary,
        "unused boss attack type report-only policy",
    )
    boss_attack_report_only_apply = optimizer.collect_rule_findings(
        boss_attack_usage_module,
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    assert_in(
        "External references still exist",
        "\n".join(finding.summary for finding in boss_attack_report_only_apply),
        "unused boss attack group blocks referenced far-trampoline patch",
    )
    boss_attack_patchable_module = build_module(
        optimizer,
        BOSS_ATTACK_PATCHABLE_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": True},
                "counts": {"bosses": 1, "bossInstances": 1},
                "bossAttackRuntime": {
                    "usedTypes": ["Projectile"],
                    "unusedTypes": ["Meteor", "Bomb", "Boomerang", "Rock", "Laser", "SineWave", "HomingMissile"],
                    "typeCounts": {"Projectile": 1},
                    "referencedAttacks": 1,
                },
            }
        },
    )
    boss_attack_patchable_findings = optimizer.collect_rule_findings(
        boss_attack_patchable_module,
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    boss_attack_patchable_by_routine = {
        finding.routine: finding.patchable for finding in boss_attack_patchable_findings
    }
    for group_id, label, display_name in [
        ("runtime.boss.attack.meteor", "call_draw_boss_meteor_attack_resident", "meteor"),
        ("runtime.boss.attack.bomb", "call_draw_boss_bomb_attack_resident", "bomb"),
        ("runtime.boss.attack.boomerang", "call_draw_boss_boomerang_attack_resident", "boomerang"),
        ("runtime.boss.attack.rock", "call_draw_boss_rock_attack_resident", "rock"),
        ("runtime.boss.attack.laser", "call_draw_boss_laser_attack_resident", "laser"),
        ("runtime.boss.attack.sine_wave", "call_draw_boss_sine_wave_attack_resident", "sine wave"),
        ("runtime.boss.attack.homing_missile", "call_draw_boss_homing_missile_attack_resident", "homing missile"),
    ]:
        assert_equal(
            boss_attack_patchable_by_routine[f"{group_id}:{label}"],
            True,
            f"unused {display_name} resident wrapper is atomically patchable",
        )
    boss_attack_transformed_lines = optimizer.apply_patches(
        boss_attack_patchable_module.lines,
        boss_attack_patchable_findings,
    )
    boss_attack_validation_errors = optimizer.validate_transformed_module(
        boss_attack_patchable_module,
        boss_attack_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            boss_attack_patchable_module,
            boss_attack_patchable_findings,
        ),
    )
    assert_equal(boss_attack_validation_errors, [], "unused boss attack transform validation")
    boss_attack_transformed_text = "\n".join(boss_attack_transformed_lines)
    for removed_label in [
        "call_draw_boss_meteor_attack_resident:",
        "call_draw_boss_bomb_attack_resident:",
        "call_draw_boss_boomerang_attack_resident:",
        "call_draw_boss_rock_attack_resident:",
        "call_draw_boss_laser_attack_resident:",
        "call_draw_boss_sine_wave_attack_resident:",
        "call_draw_boss_homing_missile_attack_resident:",
    ]:
        assert_not_in(removed_label, boss_attack_transformed_text, f"removed unused {removed_label}")
    assert_in("resident_noop:", boss_attack_transformed_text, "kept shared resident noop")
    boss_attack_complex_module = build_module(
        optimizer,
        BOSS_ATTACK_COMPLEX_REPORT_ONLY_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": True},
                "counts": {"bosses": 1, "bossInstances": 1},
                "bossAttackRuntime": {
                    "usedTypes": ["Meteor"],
                    "unusedTypes": ["Projectile"],
                    "typeCounts": {"Meteor": 1},
                    "referencedAttacks": 1,
                },
            }
        },
    )
    boss_attack_complex_findings = optimizer.collect_rule_findings(
        boss_attack_complex_module,
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    boss_attack_complex_patchable = {
        finding.routine for finding in boss_attack_complex_findings if finding.patchable
    }
    for label in [
        "update_boss_projectile_runtime_far",
        "draw_boss_projectile_attack_far",
        "call_update_boss_projectile_runtime_resident",
        "update_boss_projectile_runtime",
        "draw_boss_projectile_attack",
        "boss_projectile_select_velocity",
        "boss_projectile_show_current",
        "boss_projectile_hide_all",
    ]:
        assert_in(
            f"runtime.boss.attack.projectile:{label}",
            boss_attack_complex_patchable,
            f"unused projectile label `{label}` is atomically patchable",
        )
    boss_attack_complex_summary = "\n".join(
        finding.summary for finding in boss_attack_complex_findings
    )
    assert_in(
        "boss_projectile_select_velocity",
        boss_attack_complex_summary,
        "projectile velocity helper appears in report-only coverage",
    )
    assert_in(
        "Atomic patch enabled as `runtime.boss.attack.projectile`",
        boss_attack_complex_summary,
        "projectile boss attack patchable policy",
    )
    boss_attack_complex_transformed_lines = optimizer.apply_patches(
        boss_attack_complex_module.lines,
        boss_attack_complex_findings,
    )
    boss_attack_complex_validation_errors = optimizer.validate_transformed_module(
        boss_attack_complex_module,
        boss_attack_complex_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            boss_attack_complex_module,
            boss_attack_complex_findings,
        ),
    )
    assert_equal(
        boss_attack_complex_validation_errors,
        [],
        "unused projectile attack transform validation",
    )
    boss_attack_complex_transformed_text = "\n".join(boss_attack_complex_transformed_lines)
    for removed_label in [
        "update_boss_projectile_runtime_far:",
        "draw_boss_projectile_attack_far:",
        "call_update_boss_projectile_runtime_resident:",
        "update_boss_projectile_runtime:",
        "draw_boss_projectile_attack:",
        "boss_projectile_select_velocity:",
        "boss_projectile_show_current:",
        "boss_projectile_hide_all:",
    ]:
        assert_not_in(
            removed_label,
            boss_attack_complex_transformed_text,
            f"removed unused projectile {removed_label}",
        )
    boss_attack_projectile_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            BOSS_ATTACK_PROJECTILE_EXTERNAL_REF_ASM,
            metadata={
                "project_usage": {
                    "features": {"bosses": True},
                    "counts": {"bosses": 1, "bossInstances": 1},
                    "bossAttackRuntime": {
                        "usedTypes": ["Meteor"],
                        "unusedTypes": ["Projectile"],
                        "typeCounts": {"Meteor": 1},
                        "referencedAttacks": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in boss_attack_projectile_external_findings):
        raise AssertionError("externally referenced projectile boss attack runtime must remain blocked")
    assert_in(
        "External references still exist",
        "\n".join(finding.summary for finding in boss_attack_projectile_external_findings),
        "projectile boss attack external references block patching",
    )
    boss_attack_helper_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            BOSS_ATTACK_COMPLEX_HELPER_REPORT_ASM,
            metadata={
                "project_usage": {
                    "features": {"bosses": True},
                    "counts": {"bosses": 1, "bossInstances": 1},
                    "bossAttackRuntime": {
                        "usedTypes": ["Meteor"],
                        "unusedTypes": ["SlamRocks", "FallingBlocks"],
                        "typeCounts": {"Meteor": 1},
                        "referencedAttacks": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    boss_attack_helper_patchable = {
        finding.routine for finding in boss_attack_helper_findings if finding.patchable
    }
    for group_id, labels in {
        "runtime.boss.attack.slam_rocks": [
            "draw_boss_slam_rocks_attack",
            "update_boss_slam_rocks_runtime",
            "boss_slam_rocks_update_boss_y",
            "boss_slam_rocks_seed_lanes",
            "boss_slam_rocks_random_byte",
            "boss_slam_rocks_clamp_random_x",
            "boss_slam_rocks_draw_lanes",
            "boss_slam_rocks_age_to_distance",
            "boss_slam_rocks_get_lane_x",
            "boss_slam_rocks_hide_all",
        ],
        "runtime.boss.attack.falling_blocks": [
            "draw_boss_falling_blocks_attack",
            "update_boss_falling_blocks_runtime",
            "boss_falling_blocks_seed_lanes",
            "boss_falling_blocks_random_byte",
            "boss_falling_blocks_clamp_random_x",
            "boss_falling_blocks_draw_lanes",
            "boss_falling_blocks_age_to_distance",
            "boss_falling_blocks_lane_mask",
            "boss_falling_blocks_get_lane_x",
            "boss_falling_blocks_write_landed_tile",
            "boss_falling_blocks_hide_all",
        ],
    }.items():
        for label in labels:
            assert_in(
                f"{group_id}:{label}",
                boss_attack_helper_patchable,
                f"unused helper label `{label}` is atomically patchable",
            )
    boss_attack_helper_summary = "\n".join(
        finding.summary for finding in boss_attack_helper_findings
    )
    assert_in(
        "boss_slam_rocks_draw_lanes",
        boss_attack_helper_summary,
        "slam-rocks helper appears in report-only coverage",
    )
    assert_in(
        "boss_falling_blocks_write_landed_tile",
        boss_attack_helper_summary,
        "falling-blocks helper appears in report-only coverage",
    )
    assert_in(
        "Atomic patch enabled as `runtime.boss.attack.slam_rocks`",
        boss_attack_helper_summary,
        "slam-rocks boss attack patchable policy",
    )
    assert_in(
        "Atomic patch enabled as `runtime.boss.attack.falling_blocks`",
        boss_attack_helper_summary,
        "falling-blocks boss attack patchable policy",
    )
    boss_attack_helper_module = build_module(
        optimizer,
        BOSS_ATTACK_COMPLEX_HELPER_REPORT_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": True},
                "counts": {"bosses": 1, "bossInstances": 1},
                "bossAttackRuntime": {
                    "usedTypes": ["Meteor"],
                    "unusedTypes": ["SlamRocks", "FallingBlocks"],
                    "typeCounts": {"Meteor": 1},
                    "referencedAttacks": 1,
                },
            }
        },
    )
    boss_attack_helper_transformed_lines = optimizer.apply_patches(
        boss_attack_helper_module.lines,
        boss_attack_helper_findings,
    )
    boss_attack_helper_validation_errors = optimizer.validate_transformed_module(
        boss_attack_helper_module,
        boss_attack_helper_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            boss_attack_helper_module,
            boss_attack_helper_findings,
        ),
    )
    assert_equal(
        boss_attack_helper_validation_errors,
        [],
        "unused complex helper attack transform validation",
    )
    boss_attack_helper_transformed_text = "\n".join(boss_attack_helper_transformed_lines)
    for removed_label in [
        "draw_boss_slam_rocks_attack:",
        "update_boss_slam_rocks_runtime:",
        "boss_slam_rocks_update_boss_y:",
        "boss_slam_rocks_seed_lanes:",
        "boss_slam_rocks_random_byte:",
        "boss_slam_rocks_clamp_random_x:",
        "boss_slam_rocks_draw_lanes:",
        "boss_slam_rocks_age_to_distance:",
        "boss_slam_rocks_get_lane_x:",
        "boss_slam_rocks_hide_all:",
        "draw_boss_falling_blocks_attack:",
        "update_boss_falling_blocks_runtime:",
        "boss_falling_blocks_seed_lanes:",
        "boss_falling_blocks_random_byte:",
        "boss_falling_blocks_clamp_random_x:",
        "boss_falling_blocks_draw_lanes:",
        "boss_falling_blocks_age_to_distance:",
        "boss_falling_blocks_lane_mask:",
        "boss_falling_blocks_get_lane_x:",
        "boss_falling_blocks_write_landed_tile:",
        "boss_falling_blocks_hide_all:",
    ]:
        assert_not_in(
            removed_label,
            boss_attack_helper_transformed_text,
            f"removed unused helper attack {removed_label}",
        )
    boss_attack_helper_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            BOSS_ATTACK_COMPLEX_HELPER_EXTERNAL_REF_ASM,
            metadata={
                "project_usage": {
                    "features": {"bosses": True},
                    "counts": {"bosses": 1, "bossInstances": 1},
                    "bossAttackRuntime": {
                        "usedTypes": ["Meteor"],
                        "unusedTypes": ["SlamRocks", "FallingBlocks"],
                        "typeCounts": {"Meteor": 1},
                        "referencedAttacks": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedBossAttackRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in boss_attack_helper_external_findings):
        raise AssertionError("externally referenced complex helper attack runtime must remain blocked")
    assert_in(
        "External references still exist",
        "\n".join(finding.summary for finding in boss_attack_helper_external_findings),
        "complex helper attack external references block patching",
    )
    no_boss_attack_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            BOSS_ATTACK_USAGE_ASM,
            metadata={
                "project_usage": {
                    "features": {"bosses": False},
                    "counts": {"bosses": 0, "bossInstances": 0},
                    "bossAttackRuntime": {"usedTypes": []},
                }
            },
        ),
        [optimizer.UnusedBossAttackRuntimeRule()],
    )
    assert_equal(no_boss_attack_findings, [], "boss attack type rule skips inactive boss family")
    component_runtime_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_USAGE_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 3},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["Jump", "Gravity"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule()],
    )
    component_runtime_by_group = {finding.routine: finding for finding in component_runtime_findings}
    assert_in(
        "runtime.components.system.jump",
        component_runtime_by_group,
        "unused jump component runtime is reported",
    )
    assert_in(
        "runtime.components.system.gravity",
        component_runtime_by_group,
        "unused gravity component runtime is reported",
    )
    if "runtime.components.system.input" in component_runtime_by_group:
        raise AssertionError("used input component runtime must not be reported")
    assert_in(
        "External references still exist",
        component_runtime_by_group["runtime.components.system.jump"].summary,
        "unused component runtime reports blocking external scheduler/caller references",
    )
    assert_in(
        "No external references outside this component group were found",
        component_runtime_by_group["runtime.components.system.gravity"].summary,
        "unused component runtime reports patch candidate when unreferenced",
    )
    assert_in(
        "Patch policy: report-only",
        "\n".join(finding.summary for finding in component_runtime_findings),
        "component runtime pruning starts as report-only",
    )
    component_runtime_patchable_module = build_module(
        optimizer,
        COMPONENT_RUNTIME_USAGE_ASM,
        metadata={
            "project_usage": {
                "features": {"components": True},
                "counts": {"components": 3},
                "componentRuntime": {
                    "usedComponents": ["Input"],
                    "unusedComponents": ["Jump", "Gravity"],
                    "componentCounts": {"Input": 1},
                    "activeEntities": 1,
                },
            }
        },
    )
    component_runtime_patchable_findings = optimizer.collect_rule_findings(
        component_runtime_patchable_module,
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    component_runtime_patchable_routines = {
        finding.routine for finding in component_runtime_patchable_findings if finding.patchable
    }
    assert_in(
        "runtime.components.system.gravity:update_gravity_component",
        component_runtime_patchable_routines,
        "unreferenced unused component runtime is atomically patchable",
    )
    assert_in(
        "runtime.components.system.gravity:init_gravity_system",
        component_runtime_patchable_routines,
        "unreferenced unused component init helper is atomically patchable",
    )
    if "runtime.components.system.jump:update_jump_component" in component_runtime_patchable_routines:
        raise AssertionError("externally referenced unused component runtime must remain blocked")
    component_runtime_transformed_lines = optimizer.apply_patches(
        component_runtime_patchable_module.lines,
        component_runtime_patchable_findings,
    )
    component_runtime_validation_errors = optimizer.validate_transformed_module(
        component_runtime_patchable_module,
        component_runtime_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            component_runtime_patchable_module,
            component_runtime_patchable_findings,
        ),
    )
    assert_equal(
        component_runtime_validation_errors,
        [],
        "unused component runtime transform validation",
    )
    component_runtime_transformed_text = "\n".join(component_runtime_transformed_lines)
    assert_not_in(
        "update_gravity_component:",
        component_runtime_transformed_text,
        "removed unreferenced unused gravity component runtime",
    )
    assert_not_in(
        "init_gravity_system:",
        component_runtime_transformed_text,
        "removed unreferenced unused gravity component init helper",
    )
    assert_in(
        "update_jump_component:",
        component_runtime_transformed_text,
        "kept externally referenced unused jump component runtime",
    )
    component_runtime_helper_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_HELPER_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["WallJump"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_helper_external_findings):
        raise AssertionError("externally referenced unused component helper must block the whole group")
    component_runtime_helper_summary = "\n".join(
        finding.summary for finding in component_runtime_helper_external_findings
    )
    assert_in(
        "walljump_process_entity_c",
        component_runtime_helper_summary,
        "unused component helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_helper_summary,
        "unused component helper external references block group patching",
    )
    component_runtime_wallgrab_helper_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_WALLGRAB_HELPER_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["WallGrab"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_wallgrab_helper_external_findings):
        raise AssertionError("externally referenced wall-grab helper must block the whole group")
    component_runtime_wallgrab_helper_summary = "\n".join(
        finding.summary for finding in component_runtime_wallgrab_helper_external_findings
    )
    assert_in(
        "refresh_player_wallgrab_fastpath",
        component_runtime_wallgrab_helper_summary,
        "wall-grab fastpath helper appears in group coverage",
    )
    assert_in(
        "wallgrab_process_entity_c",
        component_runtime_wallgrab_helper_summary,
        "wall-grab process helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_wallgrab_helper_summary,
        "unused wall-grab helper external references block group patching",
    )
    component_runtime_tile_interaction_used_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_TILE_INTERACTION_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["TileInteraction"],
                        "unusedComponents": ["Input"],
                        "componentCounts": {"TileInteraction": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(
        finding.routine.startswith("runtime.components.system.tile_interaction")
        for finding in component_runtime_tile_interaction_used_findings
    ):
        raise AssertionError("used tile-interaction runtime must not be reported as unused slash runtime")
    component_runtime_tile_interaction_unused_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_TILE_INTERACTION_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["TileInteraction"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    component_runtime_tile_interaction_summary = "\n".join(
        finding.summary for finding in component_runtime_tile_interaction_unused_findings
    )
    assert_in(
        "refresh_player_tile_interaction_fastpath",
        component_runtime_tile_interaction_summary,
        "tile-interaction fastpath appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_tile_interaction_summary,
        "unused tile-interaction external references block group patching",
    )
    component_runtime_auto_control_event_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_AUTO_CONTROL_EVENT_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["AutoControlScript"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_auto_control_event_external_findings):
        raise AssertionError("externally referenced auto-control event helper must block the whole group")
    component_runtime_auto_control_event_summary = "\n".join(
        finding.summary for finding in component_runtime_auto_control_event_external_findings
    )
    assert_in(
        "update_auto_event_string_component",
        component_runtime_auto_control_event_summary,
        "auto-control event-string helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_auto_control_event_summary,
        "unused auto-control event helper external references block group patching",
    )
    component_runtime_cursors_init_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_CURSORS_INIT_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["Cursors"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_cursors_init_external_findings):
        raise AssertionError("externally referenced cursors init helper must block the whole group")
    component_runtime_cursors_init_summary = "\n".join(
        finding.summary for finding in component_runtime_cursors_init_external_findings
    )
    assert_in(
        "init_cursors_system",
        component_runtime_cursors_init_summary,
        "cursors init helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_cursors_init_summary,
        "unused cursors init external references block group patching",
    )
    component_runtime_damage_helper_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_DAMAGE_HELPER_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["Damage"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_damage_helper_external_findings):
        raise AssertionError("externally referenced damage helper must block the whole group")
    component_runtime_damage_helper_summary = "\n".join(
        finding.summary for finding in component_runtime_damage_helper_external_findings
    )
    assert_in(
        "apply_damage_to_entity",
        component_runtime_damage_helper_summary,
        "damage apply helper appears in group coverage",
    )
    assert_in(
        "check_entity_invincible",
        component_runtime_damage_helper_summary,
        "damage invincibility helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_damage_helper_summary,
        "unused damage helper external references block group patching",
    )
    component_runtime_health_helper_external_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            COMPONENT_RUNTIME_HEALTH_HELPER_EXTERNAL_ASM,
            metadata={
                "project_usage": {
                    "features": {"components": True},
                    "counts": {"components": 1},
                    "componentRuntime": {
                        "usedComponents": ["Input"],
                        "unusedComponents": ["Health"],
                        "componentCounts": {"Input": 1},
                        "activeEntities": 1,
                    },
                }
            },
        ),
        [optimizer.UnusedComponentRuntimeRule(allow_patches=True)],
    )
    if any(finding.patchable for finding in component_runtime_health_helper_external_findings):
        raise AssertionError("externally referenced health helper must block the whole group")
    component_runtime_health_helper_summary = "\n".join(
        finding.summary for finding in component_runtime_health_helper_external_findings
    )
    assert_in(
        "decrease_entity_lives",
        component_runtime_health_helper_summary,
        "health decrease helper appears in group coverage",
    )
    assert_in(
        "increase_entity_lives",
        component_runtime_health_helper_summary,
        "health increase helper appears in group coverage",
    )
    assert_in(
        "External references still exist",
        component_runtime_health_helper_summary,
        "unused health helper external references block group patching",
    )
    inactive_feature_findings = optimizer.collect_rule_findings(
        inactive_feature_module,
        [optimizer.InactiveFeatureRuntimeRule()],
    )
    assert_equal(
        [finding.routine for finding in inactive_feature_findings],
        [
            "init_sound_system",
            "music_update",
            "sfx_update",
            "init_menus",
            "show_main_menu",
            "show_menu_main",
            "show_dialogue_box",
            "init_boss_system",
        ],
        "inactive feature runtime findings",
    )
    if any(finding.patchable for finding in inactive_feature_findings):
        raise AssertionError("inactive feature runtime must remain report-only")
    inactive_feature_summary = "\n".join(finding.summary for finding in inactive_feature_findings)
    assert_in("feature `sounds` disabled", inactive_feature_summary, "inactive audio feature metadata")
    assert_in("feature `menus` disabled", inactive_feature_summary, "inactive menu feature metadata")
    assert_in("feature `dialogues` disabled", inactive_feature_summary, "inactive dialogue feature metadata")
    assert_in("feature `bosses` disabled", inactive_feature_summary, "inactive boss feature metadata")
    assert_in("No external label references were found", inactive_feature_summary, "inactive feature reference evidence")
    assert_in(
        "feature family `dialogues` is report-only",
        inactive_feature_summary,
        "inactive dialogue report-only patch policy",
    )
    assert_in(
        "feature family `sounds` can be patched only in apply mode",
        inactive_feature_summary,
        "inactive audio analysis-only patch policy",
    )
    assert_in("Block ownership: unannotated", inactive_feature_summary, "inactive unannotated ownership note")
    inactive_feature_metrics = optimizer.build_metrics(
        inactive_feature_module,
        len(inactive_feature_module.lines),
        inactive_feature_findings,
        0,
        optimizer.analyze_blocks(inactive_feature_module),
    )["inactive_feature_runtime"]["by_feature"]
    assert_equal(inactive_feature_metrics["menus"]["findings"], 3, "inactive menu metric count")
    assert_equal(inactive_feature_metrics["menus"]["unannotated"], 3, "inactive menu unannotated metric")
    assert_equal(inactive_feature_metrics["dialogues"]["report_only"], 1, "inactive dialogue report-only metric")
    assert_not_in("Action_SetVelocity", inactive_feature_summary, "enabled state-machine feature is ignored")
    patchable_inactive_feature_findings = optimizer.collect_rule_findings(
        inactive_feature_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    inactive_patchable_by_routine = {
        finding.routine: finding.patchable for finding in patchable_inactive_feature_findings
    }
    assert_equal(
        inactive_patchable_by_routine["init_sound_system"],
        True,
        "inactive audio init routine is patchable without external refs",
    )
    assert_equal(
        inactive_patchable_by_routine["music_update"],
        True,
        "inactive music routine is patchable without external refs",
    )
    assert_equal(
        inactive_patchable_by_routine["sfx_update"],
        True,
        "inactive sfx routine is patchable without external refs",
    )
    assert_equal(
        inactive_patchable_by_routine["init_menus"],
        False,
        "inactive menu init remains report-only",
    )
    assert_equal(
        inactive_patchable_by_routine["show_main_menu"],
        False,
        "inactive menu compatibility routine remains report-only",
    )
    assert_equal(
        inactive_patchable_by_routine["show_menu_main"],
        False,
        "inactive menu routine remains report-only",
    )
    assert_equal(
        inactive_patchable_by_routine["show_dialogue_box"],
        False,
        "inactive dialogue routine remains report-only",
    )
    assert_equal(
        inactive_patchable_by_routine["runtime.menu.group.core"],
        False,
        "inactive menu runtime group remains report-only",
    )
    inactive_menu_group_summary = next(
        finding.summary
        for finding in patchable_inactive_feature_findings
        if finding.routine == "runtime.menu.group.core"
    )
    assert_in(
        "runtime group `runtime.menu.group.core` is report-only",
        inactive_menu_group_summary,
        "inactive menu group patch policy",
    )
    assert_equal(
        inactive_patchable_by_routine["runtime.dialogue.group.box"],
        False,
        "inactive dialogue runtime group remains report-only",
    )
    inactive_dialogue_group_summary = next(
        finding.summary
        for finding in patchable_inactive_feature_findings
        if finding.routine == "runtime.dialogue.group.box"
    )
    assert_in(
        "runtime group `runtime.dialogue.group.box` is report-only",
        inactive_dialogue_group_summary,
        "inactive dialogue group patch policy",
    )
    assert_equal(
        inactive_patchable_by_routine["runtime.sound.group.music_update"],
        False,
        "inactive audio group candidate is report-only until multi-window patching",
    )
    inactive_transformed_lines = optimizer.apply_patches(
        inactive_feature_module.lines,
        patchable_inactive_feature_findings,
    )
    inactive_validation_errors = optimizer.validate_transformed_module(
        inactive_feature_module,
        inactive_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            inactive_feature_module,
            patchable_inactive_feature_findings,
        ),
    )
    assert_equal(inactive_validation_errors, [], "inactive feature transform validation")
    inactive_transformed_text = "\n".join(inactive_transformed_lines)
    assert_not_in("init_sound_system:", inactive_transformed_text, "removed inactive audio init")
    assert_not_in("music_update:", inactive_transformed_text, "removed inactive music update")
    assert_not_in("sfx_update:", inactive_transformed_text, "removed inactive sfx update")
    assert_in("init_menus:", inactive_transformed_text, "kept inactive menu init report-only")
    assert_in("show_main_menu:", inactive_transformed_text, "kept inactive menu compatibility report-only")
    assert_in("show_menu_main:", inactive_transformed_text, "kept inactive menu report-only")
    assert_in("show_dialogue_box:", inactive_transformed_text, "kept inactive dialogue report-only")
    inactive_state_machine_module = build_module(
        optimizer,
        INACTIVE_STATE_MACHINE_EXECUTOR_ASM,
        metadata={
            "project_usage": {
                "features": {"stateMachines": False},
                "counts": {"stateMachines": 0},
            }
        },
    )
    inactive_state_machine_findings = optimizer.collect_rule_findings(
        inactive_state_machine_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    inactive_state_machine_by_routine = {
        finding.routine: finding for finding in inactive_state_machine_findings
    }
    assert_in(
        "runtime.state_machine.group.executor",
        inactive_state_machine_by_routine,
        "inactive state-machine executor group is reported",
    )
    if inactive_state_machine_by_routine["runtime.state_machine.group.executor"].patchable:
        raise AssertionError("inactive state-machine executor group must remain report-only")
    assert_in(
        "runtime group `runtime.state_machine.group.executor` is report-only",
        inactive_state_machine_by_routine["runtime.state_machine.group.executor"].summary,
        "inactive state-machine group patch policy",
    )
    dispatch_handler_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            STATE_MACHINE_DISPATCH_ASM,
            metadata={
                "project_usage": {
                    "stateMachineRuntime": {
                        "usedActionIds": [3],
                        "usedConditionIds": [],
                    }
                }
            },
        ),
        [optimizer.StateMachineDispatchHandlersRule()],
    )
    dispatch_handler_by_routine = {
        finding.routine: finding for finding in dispatch_handler_findings
    }
    assert_in(
        "Action_SetVelocity",
        dispatch_handler_by_routine,
        "state-machine action dispatch handler is reported",
    )
    assert_in(
        "Condition_KeyPressed",
        dispatch_handler_by_routine,
        "state-machine condition dispatch handler is reported",
    )
    if any(finding.patchable for finding in dispatch_handler_findings):
        raise AssertionError("state-machine dispatch handler diagnostics must remain report-only")
    dispatch_handler_summary = "\n".join(finding.summary for finding in dispatch_handler_findings)
    assert_in("SM_ActionTable", dispatch_handler_summary, "action handler dispatch table evidence")
    assert_in("SM_ConditionTable", dispatch_handler_summary, "condition handler dispatch table evidence")
    assert_in(
        "Dispatch id 3 is listed",
        dispatch_handler_summary,
        "action handler metadata id evidence",
    )
    assert_in(
        "Dispatch id 4 is not listed",
        dispatch_handler_summary,
        "condition handler metadata id evidence",
    )
    assert_in("data-driven through action/condition ids", dispatch_handler_summary, "dispatch handler patch policy")
    dispatch_handler_patch_findings = optimizer.collect_rule_findings(
        build_module(
            optimizer,
            STATE_MACHINE_DISPATCH_ASM,
            metadata={
                "project_usage": {
                    "stateMachineRuntime": {
                        "usedActionIds": [3],
                        "usedConditionIds": [],
                    }
                }
            },
        ),
        [optimizer.StateMachineDispatchHandlersRule(allow_patches=True)],
    )
    dispatch_patchable = {
        finding.routine for finding in dispatch_handler_patch_findings if finding.patchable
    }
    assert_in(
        "Condition_KeyPressed",
        dispatch_patchable,
        "unused state-machine condition handler is patchable",
    )
    assert_in(
        "Condition_KeyPressed:table:4",
        dispatch_patchable,
        "unused state-machine condition table entry is patchable",
    )
    if "Action_SetVelocity" in dispatch_patchable:
        raise AssertionError("used state-machine action handler must not be patchable")
    dispatch_transformed_lines = optimizer.apply_patches(
        build_module(
            optimizer,
            STATE_MACHINE_DISPATCH_ASM,
            metadata={
                "project_usage": {
                    "stateMachineRuntime": {
                        "usedActionIds": [3],
                        "usedConditionIds": [],
                    }
                }
            },
        ).lines,
        dispatch_handler_patch_findings,
    )
    dispatch_transformed = "\n".join(dispatch_transformed_lines)
    assert_in("DW 0 ; 4 unused Condition_KeyPressed", dispatch_transformed, "unused condition table entry is nulled")
    if "Condition_KeyPressed:" in dispatch_transformed:
        raise AssertionError("unused condition handler body must be removed")
    assert_in("Action_SetVelocity:", dispatch_transformed, "used action handler body is preserved")
    annotated_inactive_feature_module = build_module(
        optimizer,
        ANNOTATED_INACTIVE_FEATURE_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    annotated_inactive_findings = optimizer.collect_rule_findings(
        annotated_inactive_feature_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    annotated_patchable_by_routine = {
        finding.routine: finding.patchable for finding in annotated_inactive_findings
    }
    assert_equal(
        annotated_patchable_by_routine["call_music_update_resident"],
        False,
        "inactive audio routine inside annotated block remains grouped report-only",
    )
    assert_equal(
        annotated_patchable_by_routine["call_sfx_update_resident"],
        False,
        "inactive sfx routine inside annotated block remains grouped report-only",
    )
    assert_equal(
        annotated_patchable_by_routine["runtime.sound.group.music_update"],
        False,
        "annotated inactive audio group candidate remains report-only",
    )
    annotated_inactive_summary = "\n".join(finding.summary for finding in annotated_inactive_findings)
    assert_in(
        "group-level deletion must be handled by dead-blocks",
        annotated_inactive_summary,
        "annotated inactive audio grouping note",
    )
    assert_in(
        "Block ownership: `runtime.sound.resident_wrappers` owner=`sound` preserve=false",
        annotated_inactive_summary,
        "annotated inactive audio ownership note",
    )
    annotated_inactive_metrics = optimizer.build_metrics(
        annotated_inactive_feature_module,
        len(annotated_inactive_feature_module.lines),
        annotated_inactive_findings,
        0,
        optimizer.analyze_blocks(annotated_inactive_feature_module),
    )["inactive_feature_runtime"]["by_feature"]
    assert_equal(annotated_inactive_metrics["sounds"]["annotated"], 2, "annotated inactive audio metric")
    assert_equal(
        annotated_inactive_metrics["sounds"]["owners"]["sound"],
        2,
        "annotated inactive audio owner metric",
    )
    atomic_group_module = build_module(
        optimizer,
        ATOMIC_INACTIVE_FEATURE_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    atomic_group_findings = optimizer.collect_rule_findings(
        atomic_group_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_group_patch_findings = [
        finding
        for finding in atomic_group_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.sound.group.music_execute_command"
    ]
    assert_equal(
        len(atomic_group_patch_findings),
        3,
        "inactive music command group emits three atomic patch windows",
    )
    atomic_group_transformed_lines = optimizer.apply_patches(
        atomic_group_module.lines,
        atomic_group_findings,
    )
    atomic_group_validation_errors = optimizer.validate_transformed_module(
        atomic_group_module,
        atomic_group_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_group_module,
            atomic_group_findings,
        ),
    )
    assert_equal(atomic_group_validation_errors, [], "inactive music command group validation")
    atomic_group_transformed_text = "\n".join(atomic_group_transformed_lines)
    assert_not_in("call_music_execute_command_resident:", atomic_group_transformed_text, "removed command resident wrapper")
    assert_not_in("music_execute_command_far:", atomic_group_transformed_text, "removed command far wrapper")
    assert_not_in("music_execute_command:", atomic_group_transformed_text, "removed command runtime")
    assert_in("runtime.sound.music_noop_runtime", atomic_group_transformed_text, "kept enclosing noop runtime block")
    assert_in("music_stop:", atomic_group_transformed_text, "kept unrelated label in enclosing noop runtime block")
    atomic_music_stop_module = build_module(
        optimizer,
        ATOMIC_MUSIC_STOP_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    atomic_music_stop_findings = optimizer.collect_rule_findings(
        atomic_music_stop_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_music_stop_patch_findings = [
        finding
        for finding in atomic_music_stop_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.sound.group.music_stop"
    ]
    assert_equal(
        len(atomic_music_stop_patch_findings),
        3,
        "inactive music stop group emits three atomic patch windows",
    )
    atomic_music_stop_transformed_lines = optimizer.apply_patches(
        atomic_music_stop_module.lines,
        atomic_music_stop_findings,
    )
    atomic_music_stop_validation_errors = optimizer.validate_transformed_module(
        atomic_music_stop_module,
        atomic_music_stop_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_music_stop_module,
            atomic_music_stop_findings,
        ),
    )
    assert_equal(atomic_music_stop_validation_errors, [], "inactive music stop group validation")
    atomic_music_stop_transformed_text = "\n".join(atomic_music_stop_transformed_lines)
    assert_not_in("call_music_stop_resident:", atomic_music_stop_transformed_text, "removed stop resident wrapper")
    assert_not_in("music_stop_far:", atomic_music_stop_transformed_text, "removed stop far wrapper")
    assert_not_in("music_stop:", atomic_music_stop_transformed_text, "removed stop runtime")
    assert_in("runtime.sound.music_noop_runtime", atomic_music_stop_transformed_text, "kept enclosing noop runtime block")
    assert_in("music_update:", atomic_music_stop_transformed_text, "kept unrelated noop runtime label")
    atomic_sfx_update_module = build_module(
        optimizer,
        ATOMIC_SFX_UPDATE_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    atomic_sfx_update_findings = optimizer.collect_rule_findings(
        atomic_sfx_update_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_sfx_update_patch_findings = [
        finding
        for finding in atomic_sfx_update_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.sound.group.sfx_update"
    ]
    assert_equal(
        len(atomic_sfx_update_patch_findings),
        3,
        "inactive sfx update group emits three atomic patch windows",
    )
    atomic_sfx_update_transformed_lines = optimizer.apply_patches(
        atomic_sfx_update_module.lines,
        atomic_sfx_update_findings,
    )
    atomic_sfx_update_validation_errors = optimizer.validate_transformed_module(
        atomic_sfx_update_module,
        atomic_sfx_update_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_sfx_update_module,
            atomic_sfx_update_findings,
        ),
    )
    assert_equal(atomic_sfx_update_validation_errors, [], "inactive sfx update group validation")
    atomic_sfx_update_transformed_text = "\n".join(atomic_sfx_update_transformed_lines)
    assert_not_in("call_sfx_update_resident:", atomic_sfx_update_transformed_text, "removed sfx resident wrapper")
    assert_not_in("sfx_update_far:", atomic_sfx_update_transformed_text, "removed sfx far wrapper")
    assert_not_in("sfx_update:", atomic_sfx_update_transformed_text, "removed sfx runtime")
    assert_in("runtime.sound.sfx_runtime", atomic_sfx_update_transformed_text, "kept enclosing sfx runtime block")
    assert_in("psg_idle:", atomic_sfx_update_transformed_text, "kept unrelated sfx runtime label")
    atomic_music_update_module = build_module(
        optimizer,
        ATOMIC_MUSIC_UPDATE_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    atomic_music_update_findings = optimizer.collect_rule_findings(
        atomic_music_update_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_music_update_patch_findings = [
        finding
        for finding in atomic_music_update_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.sound.group.music_update"
    ]
    assert_equal(
        len(atomic_music_update_patch_findings),
        3,
        "inactive music update group emits three atomic patch windows",
    )
    atomic_music_update_transformed_lines = optimizer.apply_patches(
        atomic_music_update_module.lines,
        atomic_music_update_findings,
    )
    atomic_music_update_validation_errors = optimizer.validate_transformed_module(
        atomic_music_update_module,
        atomic_music_update_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_music_update_module,
            atomic_music_update_findings,
        ),
    )
    assert_equal(atomic_music_update_validation_errors, [], "inactive music update group validation")
    atomic_music_update_transformed_text = "\n".join(atomic_music_update_transformed_lines)
    assert_not_in("call_music_update_resident:", atomic_music_update_transformed_text, "removed music update resident wrapper")
    assert_not_in("music_update_far:", atomic_music_update_transformed_text, "removed music update far wrapper")
    assert_not_in("music_update:", atomic_music_update_transformed_text, "removed music update runtime")
    assert_in("runtime.sound.music_runtime", atomic_music_update_transformed_text, "kept enclosing music runtime block")
    assert_in("psg_idle:", atomic_music_update_transformed_text, "kept unrelated music runtime label")
    blocked_music_update_module = build_module(
        optimizer,
        BLOCKED_MUSIC_UPDATE_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"sounds": False},
                "counts": {"sounds": 0, "tracks": 0},
            }
        },
    )
    blocked_music_update_findings = optimizer.collect_rule_findings(
        blocked_music_update_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    blocked_music_update_patch_findings = [
        finding
        for finding in blocked_music_update_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.sound.group.music_update"
    ]
    assert_equal(
        len(blocked_music_update_patch_findings),
        0,
        "inactive music update group stays blocked by external caller",
    )
    atomic_boss_module = build_module(
        optimizer,
        ATOMIC_BOSS_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": False},
                "counts": {"bosses": 0, "bossInstances": 0},
            }
        },
    )
    atomic_boss_findings = optimizer.collect_rule_findings(
        atomic_boss_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_boss_patch_findings = [
        finding
        for finding in atomic_boss_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.boss.group.all"
    ]
    assert_equal(
        len(atomic_boss_patch_findings),
        7,
        "inactive boss group emits atomic patch windows",
    )
    atomic_boss_transformed_lines = optimizer.apply_patches(
        atomic_boss_module.lines,
        atomic_boss_findings,
    )
    atomic_boss_validation_errors = optimizer.validate_transformed_module(
        atomic_boss_module,
        atomic_boss_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_boss_module,
            atomic_boss_findings,
        ),
    )
    assert_equal(atomic_boss_validation_errors, [], "inactive boss group validation")
    atomic_boss_transformed_text = "\n".join(atomic_boss_transformed_lines)
    assert_not_in("init_boss_system_far:", atomic_boss_transformed_text, "removed boss far trampoline")
    assert_not_in("call_init_boss_system_resident:", atomic_boss_transformed_text, "removed boss resident wrapper")
    assert_not_in("init_boss_system:", atomic_boss_transformed_text, "removed boss init runtime")
    assert_not_in("boss_push_data_bank:", atomic_boss_transformed_text, "removed boss core runtime")
    atomic_boss_stub_module = build_module(
        optimizer,
        ATOMIC_BOSS_STUB_GROUP_ASM,
        metadata={
            "project_usage": {
                "features": {"bosses": False},
                "counts": {"bosses": 0, "bossInstances": 0},
            }
        },
    )
    atomic_boss_stub_findings = optimizer.collect_rule_findings(
        atomic_boss_stub_module,
        [optimizer.InactiveFeatureRuntimeRule(allow_patches=True)],
    )
    atomic_boss_stub_patch_findings = [
        finding
        for finding in atomic_boss_stub_findings
        if finding.patch is not None and finding.patch.group_id == "runtime.boss.group.stubs"
    ]
    assert_equal(
        len(atomic_boss_stub_patch_findings),
        5,
        "inactive boss stub group emits atomic patch windows",
    )
    atomic_boss_stub_transformed_lines = optimizer.apply_patches(
        atomic_boss_stub_module.lines,
        atomic_boss_stub_findings,
    )
    atomic_boss_stub_validation_errors = optimizer.validate_transformed_module(
        atomic_boss_stub_module,
        atomic_boss_stub_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(
            atomic_boss_stub_module,
            atomic_boss_stub_findings,
        ),
    )
    assert_equal(atomic_boss_stub_validation_errors, [], "inactive boss stub group validation")
    atomic_boss_stub_transformed_text = "\n".join(atomic_boss_stub_transformed_lines)
    assert_not_in("init_boss_system_far:", atomic_boss_stub_transformed_text, "removed boss stub far trampoline")
    assert_not_in("call_init_boss_system_resident:", atomic_boss_stub_transformed_text, "removed boss stub resident wrapper")
    assert_not_in("init_boss_system:", atomic_boss_stub_transformed_text, "removed boss stub entry")
    assert_in("resident_noop:", atomic_boss_stub_transformed_text, "kept shared resident noop")
    analyses = status_by_block(optimizer, module)

    assert_equal(analyses["root_block"].status, "rooted", "root block status")
    assert_equal(analyses["used_block"].status, "referenced", "used block status")
    assert_equal(analyses["dep_block"].status, "referenced", "dependency block status")
    assert_equal(analyses["preserved_block"].status, "preserved", "preserved block status")
    assert_equal(analyses["dead_block"].status, "candidate_unreferenced", "dead block status")
    if "commented_artifact" in analyses:
        raise AssertionError("double-commented artifact marker should be ignored")
    assert_equal(analyses["dead_block"].candidate, True, "dead block candidate")
    assert_equal(analyses["dead_block"].line_count, 4, "dead block source lines")
    if analyses["dead_block"].source_bytes <= 0:
        raise AssertionError("dead block source bytes should be positive")

    metrics = optimizer.build_metrics(module, len(module.lines), [], 0, list(analyses.values()))
    block_inventory = metrics["block_inventory"]
    routine_inventory = metrics["routine_inventory"]
    assert_equal(block_inventory["dead_candidate_lines"], 4, "dead candidate source lines")
    assert_equal(
        block_inventory["dead_candidate_source_bytes"],
        analyses["dead_block"].source_bytes,
        "dead candidate source bytes",
    )
    largest_blocks = block_inventory["largest_blocks"]
    if not largest_blocks:
        raise AssertionError("largest annotated blocks should not be empty")
    if "source_bytes" not in largest_blocks[0] or "line_count" not in largest_blocks[0]:
        raise AssertionError("largest annotated blocks should include source pressure fields")
    assert_equal(
        [item["source_bytes"] for item in largest_blocks],
        sorted((item["source_bytes"] for item in largest_blocks), reverse=True),
        "largest annotated blocks ordering",
    )
    if routine_inventory["count"] <= 0:
        raise AssertionError("routine inventory should include parsed global labels")
    if not routine_inventory["largest_routines"]:
        raise AssertionError("largest routines should not be empty")
    if routine_inventory["unannotated_count"] <= 0:
        raise AssertionError("routine inventory should include unannotated labels")
    if not routine_inventory["largest_unannotated_labels"]:
        raise AssertionError("largest unannotated labels should not be empty")
    categories = {item["name"]: item.get("category") for item in routine_inventory["largest_routines"]}
    assert_equal(categories.get("boot_entry"), "boot_or_init", "boot label category")
    assert_equal(categories.get("tilebank_pattern_data_0"), "data", "data label category")
    assert_equal(categories.get("SM_GlobalVarWordTable"), "data", "state machine table category")
    assert_equal(categories.get("NINA_DEAD_RIGHT_6_F1_LAYER2"), "data", "sprite layer data category")
    assert_equal(categories.get("print_string_loop"), "runtime_inner_label", "print string loop category")
    assert_equal(
        categories.get("check_transition_worldmap_1_s0_apply_east"),
        "runtime_inner_label",
        "world transition branch category",
    )
    if routine_inventory["by_category"]["data"]["unannotated_count"] <= 0:
        raise AssertionError("data category should count unannotated data labels")
    if "data" not in routine_inventory["largest_unannotated_by_category"]:
        raise AssertionError("largest unannotated by category should include data labels")
    assert_equal(
        [item["source_bytes"] for item in routine_inventory["largest_routines"]],
        sorted((item["source_bytes"] for item in routine_inventory["largest_routines"]), reverse=True),
        "largest routines ordering",
    )
    if any(item.get("block_id") for item in routine_inventory["largest_unannotated_labels"]):
        raise AssertionError("largest unannotated labels should not include labels already owned by blocks")

    unused_runtime_findings = optimizer.collect_rule_findings(module, [optimizer.UnusedRuntimeLabelsRule()])
    assert_equal(
        [finding.routine for finding in unused_runtime_findings],
        ["unused_runtime_helper"],
        "unused runtime labels findings",
    )
    unused_runtime_finding = unused_runtime_findings[0]
    assert_equal(unused_runtime_finding.patchable, False, "unused runtime labels are report-only")
    assert_in("unannotated runtime code", unused_runtime_finding.summary, "unused runtime summary")

    unused_loader_findings = optimizer.collect_rule_findings(module, [optimizer.UnusedScreenLoadersRule()])
    assert_equal(
        [finding.routine for finding in unused_loader_findings],
        ["load_screen_unused", "load_screen_review_far"],
        "unused screen loader findings",
    )
    unused_loader_finding = unused_loader_findings[0]
    assert_equal(unused_loader_finding.patchable, False, "unused screen loaders are report-only")
    assert_in("generated screen loader", unused_loader_finding.summary, "unused screen loader summary")
    assert_in("Project metadata maps it to scene", unused_loader_finding.summary, "unused screen loader metadata")
    assert_in("GameFlow reachability marks this scene unreachable", unused_loader_finding.summary, "unused screen loader reachability metadata")
    review_loader_finding = unused_loader_findings[1]
    assert_in(
        "Related annotated loader block `runtime.screens.load_screen_review.loader`",
        review_loader_finding.summary,
        "unused screen loader related block metadata",
    )

    patchable_loader_findings = optimizer.collect_rule_findings(module, [optimizer.UnusedScreenLoadersRule(allow_patches=True)])
    patchable_loader_by_routine = {finding.routine: finding for finding in patchable_loader_findings}
    assert_equal(
        patchable_loader_by_routine["load_screen_unused"].patchable,
        True,
        "unreachable unannotated screen loader is patchable",
    )
    assert_equal(
        patchable_loader_by_routine["load_screen_review_far"].patchable,
        True,
        "unreachable far screen loader wrapper is patchable",
    )
    assert_equal(
        patchable_loader_by_routine["runtime.screens.load_screen_review.loader"].patchable,
        True,
        "unreachable related screen loader block is patchable",
    )
    loader_transformed_lines = optimizer.apply_patches(module.lines, patchable_loader_findings)
    loader_validation_errors = optimizer.validate_transformed_module(
        module,
        loader_transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(module, patchable_loader_findings),
    )
    assert_equal(loader_validation_errors, [], "unused screen loader transform validation")
    loader_transformed_text = "\n".join(loader_transformed_lines)
    assert_not_in("load_screen_unused:", loader_transformed_text, "removed unreachable screen loader")
    assert_not_in("load_screen_review_far:", loader_transformed_text, "removed unreachable far screen loader")
    assert_not_in("load_screen_review:", loader_transformed_text, "removed unreachable related screen loader block")
    assert_in("load_screen_used:", loader_transformed_text, "kept referenced screen loader")

    rules = [optimizer.DeadBlocksRule(allow_patches=True)]
    findings = optimizer.collect_rule_findings(module, rules)
    assert_equal([finding.routine for finding in findings], ["dead_block"], "patchable dead-block findings")
    patch_metrics = optimizer.collect_patch_metrics(module.lines, findings)
    assert_equal(patch_metrics["patchable"], 1, "patch metrics patchable count")
    assert_equal(patch_metrics["removed_lines"], 4, "patch metrics removed lines")
    assert_equal(
        patch_metrics["removed_source_bytes"],
        analyses["dead_block"].source_bytes,
        "patch metrics removed source bytes",
    )
    atomic_group_patches = optimizer.select_non_overlapping_patches(
        [
            optimizer.Patch(10, 12, [], "group-a", group_id="audio.group"),
            optimizer.Patch(30, 32, [], "group-b", group_id="audio.group"),
        ]
    )
    assert_equal(
        [(patch.start_index, patch.end_index, patch.group_id) for patch in atomic_group_patches],
        [(30, 32, "audio.group"), (10, 12, "audio.group")],
        "atomic multi-window patch group is selected as a whole",
    )
    atomic_group_with_overlap = optimizer.select_non_overlapping_patches(
        [
            optimizer.Patch(10, 12, [], "group-a", group_id="audio.group"),
            optimizer.Patch(30, 32, [], "group-b", group_id="audio.group"),
            optimizer.Patch(9, 13, [], "broader"),
        ]
    )
    assert_equal(
        [(patch.start_index, patch.end_index, patch.group_id) for patch in atomic_group_with_overlap],
        [(9, 13, None)],
        "atomic multi-window patch group is skipped instead of partially applied",
    )

    transformed_lines = optimizer.apply_patches(module.lines, findings)
    validation_errors = optimizer.validate_transformed_module(
        module,
        transformed_lines,
        allowed_missing_global_labels=optimizer.collect_allowed_removed_labels(module, findings),
    )
    assert_equal(validation_errors, [], "dead-block transform validation")

    transformed_text = "\n".join(transformed_lines)
    assert_not_in("dead_label:", transformed_text, "removed dead label")
    assert_not_in("@mideas:block id=dead_block", transformed_text, "removed dead marker")
    assert_in("used_label:", transformed_text, "kept externally referenced block")
    assert_in("dep_label:", transformed_text, "kept dependency referenced block")
    assert_in("preserved_label:", transformed_text, "kept preserved block")

    metrics = optimizer.build_metrics(
        module,
        len(transformed_lines),
        findings,
        1,
        list(analyses.values()),
        [
            {
                "pass": 1,
                "findings": len(findings),
                "patchable": patch_metrics["patchable"],
                "removed_lines": patch_metrics["removed_lines"],
                "removed_source_bytes": patch_metrics["removed_source_bytes"],
                "input_line_count": len(module.lines),
                "output_line_count": len(transformed_lines),
            }
        ],
    )
    assert_equal(metrics["optimization_summary"]["removed_lines"], 4, "optimization summary removed lines")
    assert_equal(
        metrics["optimization_summary"]["removed_source_bytes"],
        analyses["dead_block"].source_bytes,
        "optimization summary removed source bytes",
    )
    assert_equal(
        metrics["by_rule"]["dead-blocks"]["removed_source_bytes"],
        analyses["dead_block"].source_bytes,
        "rule metrics removed source bytes",
    )

    report = optimizer.build_markdown_report(Path("inline.asm"), module, findings, 1, metrics, list(analyses.values()))
    assert_in("Dead-candidate source: 4 lines", report, "dead candidate source report")
    assert_in("Optimization source removed: 4 lines", report, "optimization pass summary report")
    assert_in("Pass 1: findings=1, patchable=1, removed=4 lines", report, "optimization pass detail report")
    assert_in("### Largest Annotated Blocks", report, "largest block report section")
    assert_in("## Global Label Inventory", report, "global label inventory report section")
    assert_in("### Largest Unannotated Global Labels", report, "unannotated label report section")
    assert_in("`data`", report, "unannotated category report")
    assert_in("`dead_block`: 4 lines", report, "dead candidate prioritized report")

    verify_strict_gate()
    verify_build_post_asm_summary_formatter()
    verify_cli_apply_defaults_to_patchable_rules()

    print("Post-ASM optimizer dead-block tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
