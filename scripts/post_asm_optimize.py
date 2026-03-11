#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


LABEL_RE = re.compile(r"^\s*([A-Za-z_.$?@][A-Za-z0-9_.$?@]*):(?:\s*(.*))?$")
SPACE_RE = re.compile(r"\s+")
DIRECTIVES = {
    "org",
    "db",
    "dw",
    "ds",
    "equ",
    "end",
    "include",
    "incbin",
    "macro",
    "endm",
    "if",
    "else",
    "endif",
}
PARENT_LABEL_RE = re.compile(
    r"^(update_|init_|check_|load_|render_|force_|task_|gameflow_|music_|sfx_|SM_|Action_|Condition_|"
    r"get_|set_|print_|clear_|copy_|apply_|spawn_|show_|hide_|enable_|disable_|mapper_|FAST_|dzx0_)",
    re.IGNORECASE,
)


@dataclass
class AsmLine:
    raw: str
    lineno: int
    kind: str
    label: str | None = None
    opcode: str | None = None
    operands: str | None = None
    comment: str | None = None

    @property
    def normalized(self) -> str:
        if self.kind != "instr":
            return ""
        base = self.opcode or ""
        if self.operands:
            base = f"{base} {self.operands}"
        return SPACE_RE.sub(" ", base.strip().lower())


@dataclass
class Routine:
    name: str
    start_index: int
    end_index: int
    lines: list[AsmLine]

    @property
    def has_active_entity_list(self) -> bool:
        return any(line.normalized == "ld hl, active_entity_list" for line in self.lines)

    @property
    def significant_indexes(self) -> list[int]:
        indexes: list[int] = []
        for idx, line in enumerate(self.lines):
            if line.kind == "instr":
                indexes.append(idx)
        return indexes


@dataclass
class AsmModule:
    path: Path
    lines: list[AsmLine]
    routines: dict[str, Routine]
    routine_order: list[str]
    label_to_line: dict[str, int]
    duplicate_labels: list[str]


@dataclass
class Patch:
    start_index: int
    end_index: int
    replacement_lines: list[str]
    reason: str


@dataclass
class Finding:
    rule_id: str
    title: str
    routine: str
    line_start: int
    line_end: int
    summary: str
    patch: Patch | None = None

    @property
    def patchable(self) -> bool:
        return self.patch is not None


class Rule(Protocol):
    id: str
    description: str

    def find(self, module: AsmModule) -> list[Finding]:
        ...


def split_comment(raw: str) -> tuple[str, str | None]:
    if ";" not in raw:
        return raw.rstrip("\n"), None
    code, comment = raw.split(";", 1)
    return code.rstrip("\n"), comment.rstrip("\n")


def parse_asm_line(raw: str, lineno: int) -> AsmLine:
    code_part, comment = split_comment(raw)
    stripped = code_part.strip()
    if not stripped:
        if comment is not None:
            return AsmLine(raw=raw, lineno=lineno, kind="comment", comment=comment.strip())
        return AsmLine(raw=raw, lineno=lineno, kind="blank")

    match = LABEL_RE.match(code_part)
    if match:
        label = match.group(1)
        trailing = (match.group(2) or "").strip()
        if trailing:
            pieces = trailing.split(None, 1)
            opcode = pieces[0]
            operands = pieces[1] if len(pieces) > 1 else ""
            kind = "directive" if opcode.lower() in DIRECTIVES else "instr"
            return AsmLine(
                raw=raw,
                lineno=lineno,
                kind=kind,
                label=label,
                opcode=opcode,
                operands=operands,
                comment=comment.strip() if comment else None,
            )
        return AsmLine(
            raw=raw,
            lineno=lineno,
            kind="label",
            label=label,
            comment=comment.strip() if comment else None,
        )

    pieces = stripped.split(None, 1)
    opcode = pieces[0]
    operands = pieces[1] if len(pieces) > 1 else ""
    kind = "directive" if opcode.lower() in DIRECTIVES else "instr"
    return AsmLine(
        raw=raw,
        lineno=lineno,
        kind=kind,
        opcode=opcode,
        operands=operands,
        comment=comment.strip() if comment else None,
    )


def build_module(path: Path, raw_lines: list[str]) -> AsmModule:
    lines = [parse_asm_line(raw, index + 1) for index, raw in enumerate(raw_lines)]
    label_to_line: dict[str, int] = {}
    duplicate_labels: list[str] = []
    global_label_indexes: list[tuple[int, str]] = []

    for index, line in enumerate(lines):
        if line.label:
            if line.label in label_to_line:
                duplicate_labels.append(line.label)
            label_to_line[line.label] = line.lineno
            if not line.label.startswith("."):
                global_label_indexes.append((index, line.label))

    routines: dict[str, Routine] = {}
    routine_order: list[str] = []
    for idx, (start_index, name) in enumerate(global_label_indexes):
        next_start = global_label_indexes[idx + 1][0] if idx + 1 < len(global_label_indexes) else len(lines)
        routine_lines = lines[start_index:next_start]
        routines[name] = Routine(
            name=name,
            start_index=start_index,
            end_index=next_start,
            lines=routine_lines,
        )
        routine_order.append(name)

    return AsmModule(
        path=path,
        lines=lines,
        routines=routines,
        routine_order=routine_order,
        label_to_line=label_to_line,
        duplicate_labels=duplicate_labels,
    )


def parse_module(path: Path) -> AsmModule:
    raw_lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    return build_module(path, raw_lines)


def make_patch_for_significant_window(routine: Routine, indexes: list[int], local_start: int, local_end: int, reason: str) -> Patch:
    start_local = indexes[local_start]
    end_local = indexes[local_end]
    start_abs = routine.start_index + start_local
    end_abs = routine.start_index + end_local + 1
    return Patch(
        start_index=start_abs,
        end_index=end_abs,
        replacement_lines=[],
        reason=reason,
    )


def make_patch_for_significant_line(routine: Routine, indexes: list[int], local_index: int, reason: str) -> Patch:
    absolute_index = routine.start_index + indexes[local_index]
    return Patch(
        start_index=absolute_index,
        end_index=absolute_index + 1,
        replacement_lines=[],
        reason=reason,
    )


def make_patch_for_absolute_window(start_abs: int, end_abs: int, reason: str) -> Patch:
    return Patch(
        start_index=start_abs,
        end_index=end_abs,
        replacement_lines=[],
        reason=reason,
    )


def module_significant_indexes(module: AsmModule) -> list[int]:
    return [index for index, line in enumerate(module.lines) if line.kind == "instr"]


def find_parent_label(module: AsmModule, absolute_index: int) -> str:
    for index in range(absolute_index, -1, -1):
        line = module.lines[index]
        if not line.label or line.label.startswith("."):
            continue
        if PARENT_LABEL_RE.match(line.label):
            return line.label
    for index in range(absolute_index, -1, -1):
        line = module.lines[index]
        if line.label and not line.label.startswith("."):
            return line.label
    return "<unknown>"


def routine_contains_call_before(routine: Routine, first_call: str, second_call: str) -> bool:
    seen_first = False
    for line in routine.lines:
        if line.normalized == f"call {first_call.lower()}":
            seen_first = True
        if line.normalized == f"call {second_call.lower()}":
            return seen_first
    return False


class ActiveListRedundantScreenCheckRule:
    id = "active-list-redundant-screen-check"
    description = "Remove exact current_screen_id rechecks inside routines already iterating active_entity_list."

    PATTERN = [
        "push hl",
        "ld hl, entity_screen_id",
        "ld e, c",
        "ld d, 0",
        "add hl, de",
        "ld a, (hl)",
        "ld hl, current_screen_id",
        "cp (hl)",
        "pop hl",
    ]

    def find(self, module: AsmModule) -> list[Finding]:
        findings: list[Finding] = []
        indexes = module_significant_indexes(module)
        normals = [module.lines[idx].normalized for idx in indexes]
        for offset in range(0, max(0, len(normals) - len(self.PATTERN)) + 1):
            if normals[offset:offset + len(self.PATTERN)] != self.PATTERN:
                continue
            branch_index = offset + len(self.PATTERN)
            if branch_index >= len(normals):
                continue
            branch = normals[branch_index]
            if not (branch.startswith("jp nz, ") or branch.startswith("jr nz, ")):
                continue
            context_start = max(0, offset - 20)
            if "ld hl, active_entity_list" not in normals[context_start:offset]:
                continue
            start_abs = indexes[offset]
            end_abs = indexes[branch_index] + 1
            routine_name = find_parent_label(module, start_abs)
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Redundant screen filter after active_entity_list",
                    routine=routine_name,
                    line_start=module.lines[start_abs].lineno,
                    line_end=module.lines[indexes[branch_index]].lineno,
                    summary=(
                        f"Routine `{routine_name}` rechecks `entity_screen_id` against `current_screen_id` "
                        "after iterating `active_entity_list`, which already encodes current-screen membership."
                    ),
                    patch=make_patch_for_absolute_window(
                        start_abs,
                        end_abs,
                        "Remove redundant current_screen_id filter after active_entity_list.",
                    ),
                )
            )
        return findings


class ActiveListRedundantActiveCheckRule:
    id = "active-list-redundant-active-check"
    description = "Remove exact entity_active rechecks inside routines already iterating active_entity_list."

    PATTERN = [
        "push hl",
        "ld hl, entity_active",
        "ld e, c",
        "ld d, 0",
        "add hl, de",
        "ld a, (hl)",
        "pop hl",
        "or a",
    ]

    def find(self, module: AsmModule) -> list[Finding]:
        findings: list[Finding] = []
        indexes = module_significant_indexes(module)
        normals = [module.lines[idx].normalized for idx in indexes]
        for offset in range(0, max(0, len(normals) - len(self.PATTERN)) + 1):
            if normals[offset:offset + len(self.PATTERN)] != self.PATTERN:
                continue
            branch_index = offset + len(self.PATTERN)
            if branch_index >= len(normals):
                continue
            branch = normals[branch_index]
            if not (branch.startswith("jp z, ") or branch.startswith("jr z, ")):
                continue
            context_start = max(0, offset - 20)
            if "ld hl, active_entity_list" not in normals[context_start:offset]:
                continue
            start_abs = indexes[offset]
            end_abs = indexes[branch_index] + 1
            routine_name = find_parent_label(module, start_abs)
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Redundant entity_active check after active_entity_list",
                    routine=routine_name,
                    line_start=module.lines[start_abs].lineno,
                    line_end=module.lines[indexes[branch_index]].lineno,
                    summary=(
                        f"Routine `{routine_name}` rechecks `entity_active` after iterating `active_entity_list`, "
                        "which already excludes inactive entities."
                    ),
                    patch=make_patch_for_absolute_window(
                        start_abs,
                        end_abs,
                        "Remove redundant entity_active filter after active_entity_list.",
                    ),
                )
            )
        return findings


class HudDoubleWorkRule:
    id = "hud-double-work"
    description = "Report adjacent update_hud_score + force_render_hud sequences."

    PATTERN = [
        "call update_hud_score",
        "call force_render_hud",
    ]

    def find(self, module: AsmModule) -> list[Finding]:
        findings: list[Finding] = []
        for routine in module.routines.values():
            indexes = routine.significant_indexes
            normals = [routine.lines[idx].normalized for idx in indexes]
            for offset in range(0, max(0, len(normals) - len(self.PATTERN)) + 1):
                if normals[offset:offset + len(self.PATTERN)] != self.PATTERN:
                    continue
                findings.append(
                    Finding(
                        rule_id=self.id,
                        title="HUD score update followed by full HUD render",
                        routine=routine.name,
                        line_start=routine.lines[indexes[offset]].lineno,
                        line_end=routine.lines[indexes[offset + 1]].lineno,
                        summary=(
                            f"Routine `{routine.name}` updates score digits and then forces a full HUD render. "
                            "The first call can be removed because force_render_hud already re-applies score digits."
                        ),
                        patch=make_patch_for_significant_line(
                            routine,
                            indexes,
                            offset,
                            "Remove redundant update_hud_score immediately before force_render_hud.",
                        ),
                    )
                )
        return findings


class DeadlyRecomputeRule:
    id = "deadly-recompute-in-tile-interaction"
    description = "Report deadly recomputation inside check_tile_interaction."

    def find(self, module: AsmModule) -> list[Finding]:
        routine = module.routines.get("check_tile_interaction")
        if routine is None:
            return []
        update_all_entities = module.routines.get("update_all_entities")
        has_deadly_pass = (
            "update_deadly_tiles_component" in module.routines
            and update_all_entities is not None
            and routine_contains_call_before(
                update_all_entities,
                "update_deadly_tiles_component",
                "check_tile_interaction",
            )
        )
        findings: list[Finding] = []
        start_abs: int | None = None
        end_abs: int | None = None
        line_start: int | None = None
        line_end: int | None = None
        for index in range(routine.start_index, routine.end_index):
            line = module.lines[index]
            if line.raw.strip().startswith("ld hl, entity_comp_masks_hi") and start_abs is None:
                block_text = "\n".join(module.lines[i].raw for i in range(index, min(index + 24, routine.end_index)))
                if "call update_entity_deadly_flag_runtime" in block_text and ".ti_deadly_done:" in block_text:
                    start_abs = index
                    line_start = line.lineno
            if start_abs is not None and line.label == ".ti_deadly_done":
                end_abs = index + 1
                line_end = line.lineno
                break

        if start_abs is None or end_abs is None or line_start is None or line_end is None:
            return findings

        summary = (
            "Tile interaction recomputes deadly state late in the frame. "
            "This overlaps with earlier deadly/collision passes."
        )
        patch = None
        if has_deadly_pass:
            summary += " A prior `update_deadly_tiles_component` pass already runs earlier in `update_all_entities`, so this block can be removed."
            patch = make_patch_for_absolute_window(
                start_abs,
                end_abs,
                "Remove duplicate deadly recomputation in check_tile_interaction; rely on earlier update_deadly_tiles_component pass.",
            )
        else:
            summary += " The optimizer left it untouched because no earlier deadly pass was proven."

        findings.append(
            Finding(
                rule_id=self.id,
                title="Deadly flag recomputed inside tile interaction",
                routine=routine.name,
                line_start=line_start,
                line_end=line_end,
                summary=summary,
                patch=patch,
            )
        )
        return findings


RULES: dict[str, Rule] = {
    "active-list-redundant-screen-check": ActiveListRedundantScreenCheckRule(),
    "active-list-redundant-active-check": ActiveListRedundantActiveCheckRule(),
    "hud-double-work": HudDoubleWorkRule(),
    "deadly-recompute-in-tile-interaction": DeadlyRecomputeRule(),
}

PATCH_WHITELISTS: dict[str, set[str]] = {
    "active-list-redundant-screen-check": {
        "update_position_component",
        "update_input_component",
        "update_gravity_component",
    },
    "active-list-redundant-active-check": {
        "update_sprite_component",
    },
    "hud-double-work": {
        "check_tile_interaction",
    },
    "deadly-recompute-in-tile-interaction": {
        "check_tile_interaction",
    },
}


def enforce_patch_whitelist(findings: list[Finding]) -> list[Finding]:
    filtered: list[Finding] = []
    for finding in findings:
        whitelist = PATCH_WHITELISTS.get(finding.rule_id)
        if finding.patch is not None and whitelist is not None and finding.routine not in whitelist:
            filtered.append(
                Finding(
                    rule_id=finding.rule_id,
                    title=finding.title,
                    routine=finding.routine,
                    line_start=finding.line_start,
                    line_end=finding.line_end,
                    summary=f"{finding.summary} Patch disabled because `{finding.routine}` is outside the rule whitelist.",
                    patch=None,
                )
            )
            continue
        filtered.append(finding)
    return filtered


def validate_transformed_module(original: AsmModule, transformed_lines: list[str]) -> list[str]:
    errors: list[str] = []
    transformed = build_module(original.path, transformed_lines)
    if transformed.duplicate_labels:
        errors.append(f"Duplicate labels after transform: {', '.join(sorted(set(transformed.duplicate_labels)))}")

    original_global = {name for name in original.label_to_line if not name.startswith(".")}
    transformed_global = {name for name in transformed.label_to_line if not name.startswith(".")}
    missing = sorted(original_global - transformed_global)
    if missing:
        sample = ", ".join(missing[:12])
        suffix = "" if len(missing) <= 12 else f" ... (+{len(missing) - 12} more)"
        errors.append(f"Missing global labels after transform: {sample}{suffix}")
    return errors


def build_metrics(original_line_count: int, output_line_count: int, findings: list[Finding], applied_count: int) -> dict:
    by_rule: dict[str, dict] = {}
    for finding in findings:
        bucket = by_rule.setdefault(
            finding.rule_id,
            {
                "findings": 0,
                "patchable": 0,
                "routines": set(),
                "removed_lines": 0,
            },
        )
        bucket["findings"] += 1
        bucket["routines"].add(finding.routine)
        if finding.patch is not None:
            bucket["patchable"] += 1
            bucket["removed_lines"] += max(0, finding.patch.end_index - finding.patch.start_index - len(finding.patch.replacement_lines))

    normalized = {}
    for rule_id, bucket in by_rule.items():
        normalized[rule_id] = {
            "findings": bucket["findings"],
            "patchable": bucket["patchable"],
            "routines": sorted(bucket["routines"]),
            "removed_lines": bucket["removed_lines"],
        }

    return {
        "original_line_count": original_line_count,
        "output_line_count": output_line_count,
        "net_line_delta": output_line_count - original_line_count,
        "applied_patches": applied_count,
        "by_rule": normalized,
    }


def collect_file_metrics(path: Path) -> dict:
    data = path.read_bytes()
    return {
        "path": str(path),
        "size_bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def attach_rom_comparison(metrics: dict, original_rom: dict | None, optimized_rom: dict | None) -> dict:
    enriched = dict(metrics)
    if optimized_rom is None:
        return enriched

    rom_validation = {
        "optimized": optimized_rom,
        "original": original_rom,
    }
    if original_rom is not None:
        rom_validation["delta_bytes"] = optimized_rom["size_bytes"] - original_rom["size_bytes"]
        rom_validation["same_sha256"] = optimized_rom["sha256"] == original_rom["sha256"]
    enriched["rom_validation"] = rom_validation
    return enriched


def build_markdown_report(path: Path, findings: list[Finding], applied_count: int, metrics: dict) -> str:
    lines = [
        f"# Post-ASM Report",
        "",
        f"- Input: `{path}`",
        f"- Findings: {len(findings)}",
        f"- Applied patches: {applied_count}",
        f"- Original lines: {metrics['original_line_count']}",
        f"- Output lines: {metrics['output_line_count']}",
        f"- Net line delta: {metrics['net_line_delta']}",
        "",
    ]
    rom_validation = metrics.get("rom_validation")
    if rom_validation:
        if rom_validation.get("original"):
            lines.extend(
                [
                    "## ROM Validation",
                    "",
                    f"- Original ROM bytes: {rom_validation['original']['size_bytes']}",
                    f"- Optimized ROM bytes: {rom_validation['optimized']['size_bytes']}",
                    f"- ROM byte delta: {rom_validation['delta_bytes']}",
                    f"- ROM SHA256 equal: {rom_validation['same_sha256']}",
                    "",
                ]
            )
        else:
            lines.extend(
                [
                    "## ROM Validation",
                    "",
                    "- Original ROM: unavailable (original ASM did not validate with Glass)",
                    f"- Optimized ROM bytes: {rom_validation['optimized']['size_bytes']}",
                    "",
                ]
            )
    if not findings:
        lines.append("No findings.")
        return "\n".join(lines) + "\n"

    by_rule: dict[str, list[Finding]] = {}
    for finding in findings:
        by_rule.setdefault(finding.rule_id, []).append(finding)

    for rule_id, bucket in by_rule.items():
        lines.append(f"## {rule_id}")
        lines.append("")
        rule_metrics = metrics["by_rule"].get(rule_id, {})
        if rule_metrics:
            routines = ", ".join(rule_metrics["routines"])
            lines.append(f"- Metrics: findings={rule_metrics['findings']}, patchable={rule_metrics['patchable']}, removed_lines={rule_metrics['removed_lines']}")
            lines.append(f"- Routines: {routines}")
            lines.append("")
        for finding in bucket:
            patch_note = "patchable" if finding.patchable else "report-only"
            lines.append(
                f"- [{patch_note}] `{finding.routine}` lines {finding.line_start}-{finding.line_end}: {finding.summary}"
            )
        lines.append("")
    return "\n".join(lines) + "\n"


def build_json_report(path: Path, findings: list[Finding], applied_count: int, metrics: dict) -> dict:
    return {
        "input": str(path),
        "metrics": metrics,
        "findings": [
            {
                "rule_id": finding.rule_id,
                "title": finding.title,
                "routine": finding.routine,
                "line_start": finding.line_start,
                "line_end": finding.line_end,
                "summary": finding.summary,
                "patchable": finding.patchable,
                "patch": None if finding.patch is None else {
                    "start_index": finding.patch.start_index,
                    "end_index": finding.patch.end_index,
                    "replacement_lines": finding.patch.replacement_lines,
                    "reason": finding.patch.reason,
                },
            }
            for finding in findings
        ],
        "applied_patches": applied_count,
    }


def apply_patches(lines: list[AsmLine], findings: list[Finding]) -> list[str]:
    patches = [finding.patch for finding in findings if finding.patch is not None]
    if not patches:
        return [line.raw for line in lines]
    patches = sorted(patches, key=lambda patch: patch.start_index, reverse=True)
    for left, right in zip(patches, patches[1:]):
        if right.end_index > left.start_index:
            raise RuntimeError("Overlapping patches detected; aborting apply.")
    output = [line.raw for line in lines]
    for patch in patches:
        output[patch.start_index:patch.end_index] = patch.replacement_lines
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Post-process generated MSX ASM with conservative pattern rules.")
    parser.add_argument("--input", required=True, help="Input ASM path")
    parser.add_argument("--apply", action="store_true", help="Apply patchable rules and emit optimized ASM")
    parser.add_argument("--output", help="Output ASM path when --apply is set")
    parser.add_argument(
        "--rules",
        help="Comma-separated rule ids to enable (default: all)",
    )
    parser.add_argument("--report-json", help="Optional JSON report path")
    parser.add_argument("--report-md", help="Optional Markdown report path")
    parser.add_argument("--validate-glass", help="Optional glass.jar path to validate the optimized ASM")
    parser.add_argument("--validate-rom-output", help="Optional ROM output path used during Glass validation")
    return parser.parse_args()


def resolve_rules(raw: str | None) -> list[Rule]:
    if not raw:
        return list(RULES.values())
    selected: list[Rule] = []
    for item in [part.strip() for part in raw.split(",") if part.strip()]:
        rule = RULES.get(item)
        if rule is None:
            raise KeyError(f"Unknown rule: {item}")
        selected.append(rule)
    return selected


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def run_glass_validation(glass_jar: Path, asm_path: Path, rom_output: Path) -> tuple[bool, str]:
    ensure_parent(rom_output)
    command = ["java", "-jar", str(glass_jar), str(asm_path), str(rom_output)]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = "\n".join(part for part in [result.stdout.strip(), result.stderr.strip()] if part).strip()
    return result.returncode == 0, output


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    if not input_path.exists():
        print(f"Input ASM not found: {input_path}", file=sys.stderr)
        return 2
    if args.validate_glass and not args.apply:
        print("--validate-glass requires --apply.", file=sys.stderr)
        return 2

    try:
        rules = resolve_rules(args.rules)
    except KeyError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    module = parse_module(input_path)
    findings: list[Finding] = []
    for rule in rules:
        findings.extend(rule.find(module))
    findings = enforce_patch_whitelist(findings)
    findings.sort(key=lambda finding: (finding.line_start, finding.rule_id))

    applied_count = 0
    output_line_count = len(module.lines)
    output_path: Path | None = None
    original_rom_metrics: dict | None = None
    optimized_rom_metrics: dict | None = None
    if args.apply:
        output_path = (
            Path(args.output).expanduser().resolve()
            if args.output
            else input_path.with_suffix(".optimized.asm")
        )
        ensure_parent(output_path)
        optimized_lines = apply_patches(module.lines, findings)
        validation_errors = validate_transformed_module(module, optimized_lines)
        if validation_errors:
            for error in validation_errors:
                print(f"Validation error: {error}", file=sys.stderr)
            return 1
        output_path.write_text("\n".join(optimized_lines) + "\n", encoding="utf-8")
        applied_count = sum(1 for finding in findings if finding.patchable)
        output_line_count = len(optimized_lines)
        print(f"Optimized ASM written: {output_path}")

        if args.validate_glass:
            glass_jar = Path(args.validate_glass).expanduser().resolve()
            if not glass_jar.exists():
                print(f"Glass jar not found: {glass_jar}", file=sys.stderr)
                return 2

            with tempfile.TemporaryDirectory(prefix="post-asm-glass-") as temp_dir:
                temp_root = Path(temp_dir)
                original_rom_candidate = temp_root / f"{input_path.stem}.original.rom"
                if args.validate_rom_output:
                    optimized_rom_candidate = Path(args.validate_rom_output).expanduser().resolve()
                else:
                    optimized_rom_candidate = temp_root / f"{output_path.stem}.optimized.rom"

                success, compiler_output = run_glass_validation(glass_jar, input_path, original_rom_candidate)
                if not success:
                    print("Glass validation failed for original ASM; continuing with optimized ASM.", file=sys.stderr)
                    if compiler_output:
                        print(compiler_output, file=sys.stderr)
                else:
                    original_rom_metrics = collect_file_metrics(original_rom_candidate)

                success, compiler_output = run_glass_validation(glass_jar, output_path, optimized_rom_candidate)
                if not success:
                    print("Glass validation failed for optimized ASM.", file=sys.stderr)
                    if compiler_output:
                        print(compiler_output, file=sys.stderr)
                    return 1

                optimized_rom_metrics = collect_file_metrics(optimized_rom_candidate)
            print(f"Glass validation passed: {glass_jar}")

    metrics = build_metrics(len(module.lines), output_line_count, findings, applied_count)
    metrics = attach_rom_comparison(metrics, original_rom_metrics, optimized_rom_metrics)

    report_md_path = (
        Path(args.report_md).expanduser().resolve()
        if args.report_md
        else input_path.with_suffix(".post-asm-report.md")
    )
    report_json_path = (
        Path(args.report_json).expanduser().resolve()
        if args.report_json
        else input_path.with_suffix(".post-asm-report.json")
    )
    ensure_parent(report_md_path)
    ensure_parent(report_json_path)

    report_md_path.write_text(build_markdown_report(input_path, findings, applied_count, metrics), encoding="utf-8")
    report_json_path.write_text(
        json.dumps(build_json_report(input_path, findings, applied_count, metrics), indent=2),
        encoding="utf-8",
    )

    print(f"Findings: {len(findings)}")
    print(f"Markdown report: {report_md_path}")
    print(f"JSON report: {report_json_path}")
    rom_validation = metrics.get("rom_validation")
    if rom_validation:
        print(
            "ROM validation: "
            f"original={rom_validation['original']['size_bytes']} bytes, "
            f"optimized={rom_validation['optimized']['size_bytes']} bytes, "
            f"same_sha256={rom_validation['same_sha256']}"
        )
    if findings:
        for finding in findings[:20]:
            patch_note = "patchable" if finding.patchable else "report-only"
            print(
                f"- [{patch_note}] {finding.rule_id} {finding.routine}:{finding.line_start}-{finding.line_end} "
                f"{finding.title}"
            )
        if len(findings) > 20:
            print(f"... and {len(findings) - 20} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
