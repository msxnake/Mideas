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
MIDEAS_BLOCK_RE = re.compile(r"@mideas:block\b(?P<attrs>.*)$")
MIDEAS_ENDBLOCK_RE = re.compile(r"@mideas:endblock\b(?P<attrs>.*)$")
BANK_EQU_RE = re.compile(r"^\s*(?:FAR_)?BANK_\d+\s+EQU\b", re.IGNORECASE)
ASM_TOKEN_RE = re.compile(r"[A-Za-z_.$?@][A-Za-z0-9_.$?@]*")
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
    r"get_|set_|print_|clear_|copy_|apply_|spawn_|show_|hide_|play_|enable_|disable_|call_|mapper_|FAST_|dzx0_)",
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
class AsmBlock:
    id: str
    start_index: int
    end_index: int
    start_line: int
    end_line: int
    attrs: dict[str, str]
    labels: list[str]

    @property
    def kind(self) -> str:
        return self.attrs.get("kind", "unknown")

    @property
    def owner(self) -> str:
        return self.attrs.get("owner", "unknown")

    @property
    def preserve(self) -> bool:
        return parse_bool(self.attrs.get("preserve"), default=False)

    @property
    def deps(self) -> list[str]:
        return parse_csv_attr(self.attrs.get("deps"))

    @property
    def roots(self) -> list[str]:
        return parse_csv_attr(self.attrs.get("roots"))

    @property
    def bank(self) -> str | None:
        return self.attrs.get("bank")


@dataclass
class AsmModule:
    path: Path
    lines: list[AsmLine]
    routines: dict[str, Routine]
    routine_order: list[str]
    label_to_line: dict[str, int]
    duplicate_labels: list[str]
    blocks: list[AsmBlock]
    block_errors: list[str]
    metadata: dict | None = None


@dataclass
class Patch:
    start_index: int
    end_index: int
    replacement_lines: list[str]
    reason: str
    group_id: str | None = None


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


@dataclass
class LabelReference:
    label: str
    line: int
    source_block_id: str | None
    source_label: str
    raw: str


@dataclass
class BlockAnalysis:
    block_id: str
    status: str
    incoming_references: list[LabelReference]
    external_reference_count: int
    line_count: int
    source_bytes: int
    candidate: bool
    reason: str


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


def parse_bool(raw: str | None, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def parse_csv_attr(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def parse_marker_attrs(raw: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for token in raw.strip().split():
        if "=" not in token:
            continue
        key, value = token.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            attrs[key] = value
    return attrs


def is_active_mideas_marker_comment(comment: str) -> bool:
    """Return true for real marker comments, not artifact copies like '; ; @mideas:block'."""
    stripped = comment.lstrip()
    return stripped.startswith("@mideas:")


def collect_mideas_blocks(lines: list[AsmLine]) -> tuple[list[AsmBlock], list[str]]:
    blocks: list[AsmBlock] = []
    errors: list[str] = []
    stack: list[tuple[dict[str, str], int, int]] = []

    def make_block(attrs: dict[str, str], start_index: int, end_index: int, start_line: int, end_line: int) -> AsmBlock:
        block_id = attrs.get("id") or f"<missing-id-line-{start_line}>"
        labels = [
            line.label
            for line in lines[start_index:end_index]
            if line.label and not line.label.startswith(".")
        ]
        return AsmBlock(
            id=block_id,
            start_index=start_index,
            end_index=end_index,
            start_line=start_line,
            end_line=end_line,
            attrs=attrs,
            labels=labels,
        )

    for index, line in enumerate(lines):
        comment = line.comment or ""
        if not is_active_mideas_marker_comment(comment):
            continue
        block_match = MIDEAS_BLOCK_RE.search(comment)
        if block_match:
            attrs = parse_marker_attrs(block_match.group("attrs"))
            if "id" not in attrs:
                errors.append(f"Line {line.lineno}: @mideas:block missing id.")
            stack.append((attrs, index, line.lineno))
            continue

        end_match = MIDEAS_ENDBLOCK_RE.search(comment)
        if not end_match:
            continue

        attrs = parse_marker_attrs(end_match.group("attrs"))
        end_id = attrs.get("id")
        if not stack:
            errors.append(f"Line {line.lineno}: @mideas:endblock without open block.")
            continue

        match_index = len(stack) - 1
        if end_id:
            for candidate in range(len(stack) - 1, -1, -1):
                if stack[candidate][0].get("id") == end_id:
                    match_index = candidate
                    break
            else:
                errors.append(f"Line {line.lineno}: @mideas:endblock id={end_id} has no matching open block.")
                continue
        elif len(stack) > 1:
            errors.append(f"Line {line.lineno}: @mideas:endblock without id closes the innermost nested block.")

        open_attrs, start_index, start_line = stack.pop(match_index)
        if end_id and open_attrs.get("id") != end_id:
            errors.append(
                f"Line {line.lineno}: @mideas:endblock id={end_id} closed block id={open_attrs.get('id', '<missing>')}."
            )
        blocks.append(make_block(open_attrs, start_index, index + 1, start_line, line.lineno))

    for attrs, start_index, start_line in stack:
        block_id = attrs.get("id", "<missing>")
        errors.append(f"Line {start_line}: @mideas:block id={block_id} has no closing @mideas:endblock.")
        blocks.append(make_block(attrs, start_index, len(lines), start_line, lines[-1].lineno if lines else start_line))

    blocks.sort(key=lambda block: (block.start_index, block.end_index, block.id))
    return blocks, errors


def generated_artifact_dir_for_asm(path: Path) -> Path:
    stem = path.name[:-4] if path.name.lower().endswith(".asm") else path.stem
    return path.with_name(f"{stem}_generated")


def load_post_asm_metadata(path: Path) -> dict:
    artifact_dir = generated_artifact_dir_for_asm(path)
    metadata: dict = {
        "artifact_dir": str(artifact_dir),
        "project_usage": None,
        "load_plan": None,
    }
    for key, file_name in (("project_usage", "project_usage.json"), ("load_plan", "load_plan.json")):
        json_path = artifact_dir / file_name
        if not json_path.exists():
            continue
        try:
            parsed = json.loads(json_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(parsed, dict):
            metadata[key] = parsed
    return metadata


def extract_embedded_artifact_metadata(raw_lines: list[str]) -> dict:
    wanted = {
        "project_usage.json": "project_usage",
        "load_plan.json": "load_plan",
    }
    metadata: dict = {}
    current_file: str | None = None
    current_lines: list[str] = []

    def flush_current() -> None:
        nonlocal current_file, current_lines
        if current_file not in wanted:
            current_file = None
            current_lines = []
            return
        text = "\n".join(current_lines).strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict):
            metadata[wanted[current_file]] = parsed
        current_file = None
        current_lines = []

    begin_re = re.compile(r";\s*\[\[\[MIDEAS_ARTIFACT:([^:]+):BEGIN\]\]\]")
    end_re = re.compile(r";\s*\[\[\[MIDEAS_ARTIFACT:([^:]+):END\]\]\]")
    for raw_line in raw_lines:
        begin = begin_re.match(raw_line)
        if begin:
            flush_current()
            current_file = begin.group(1)
            current_lines = []
            continue
        if current_file:
            if end_re.match(raw_line):
                flush_current()
                continue
            current_lines.append(re.sub(r"^\s*;\s?", "", raw_line))
    flush_current()
    return metadata


def build_module(path: Path, raw_lines: list[str], metadata: dict | None = None) -> AsmModule:
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

    blocks, block_errors = collect_mideas_blocks(lines)

    return AsmModule(
        path=path,
        lines=lines,
        routines=routines,
        routine_order=routine_order,
        label_to_line=label_to_line,
        duplicate_labels=duplicate_labels,
        blocks=blocks,
        block_errors=block_errors,
        metadata=metadata,
    )


def parse_module(path: Path) -> AsmModule:
    raw_lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    metadata = load_post_asm_metadata(path)
    metadata.update(extract_embedded_artifact_metadata(raw_lines))
    return build_module(path, raw_lines, metadata=metadata)


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


def make_patch_for_absolute_window(
    start_abs: int,
    end_abs: int,
    reason: str,
    group_id: str | None = None,
) -> Patch:
    return Patch(
        start_index=start_abs,
        end_index=end_abs,
        replacement_lines=[],
        reason=reason,
        group_id=group_id,
    )


def routine_deletion_end_index(routine: Routine) -> int:
    end_index = routine.end_index
    while end_index > routine.start_index:
        previous = routine.lines[end_index - routine.start_index - 1]
        if previous.kind == "comment" and previous.comment and is_active_mideas_marker_comment(previous.comment):
            end_index -= 1
            continue
        if previous.kind in {"blank", "comment"}:
            end_index -= 1
            continue
        break
    return max(routine.start_index + 1, end_index)


def patch_window_contains_bank_equ(lines: list[AsmLine], start_index: int, end_index: int) -> bool:
    return any(BANK_EQU_RE.match(line.raw) for line in lines[start_index:end_index])


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


class DeadBlocksRule:
    id = "dead-blocks"
    description = "Report annotated @mideas blocks with no proven external references."

    def __init__(self, allow_patches: bool = False) -> None:
        self.allow_patches = allow_patches

    def find(self, module: AsmModule) -> list[Finding]:
        block_by_id = {block.id: block for block in module.blocks}
        findings: list[Finding] = []
        for analysis in analyze_blocks(module):
            if not analysis.candidate:
                continue
            block = block_by_id.get(analysis.block_id)
            if block is None:
                continue
            label_note = ", ".join(block.labels[:5])
            if len(block.labels) > 5:
                label_note += f", ... (+{len(block.labels) - 5})"
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Annotated ASM block has no proven external references",
                    routine=block.id,
                    line_start=block.start_line,
                    line_end=block.end_line,
                    summary=(
                        f"Block `{block.id}` ({block.kind}/{block.owner}) is a dead-code candidate. "
                        f"{analysis.reason} Labels: {label_note or 'none'}."
                    ),
                    patch=(
                        make_patch_for_absolute_window(
                            block.start_index,
                            block.end_index,
                            "Remove annotated dead-block candidate with no proven external references.",
                        )
                        if self.allow_patches
                        else None
                    ),
                )
            )
        return findings


class UnusedRuntimeLabelsRule:
    id = "unused-runtime-labels"
    description = "Report unannotated instruction-bearing global labels with no proven external references."

    def find(self, module: AsmModule) -> list[Finding]:
        references_by_label = collect_label_references(module)
        block_by_label = {
            label: block.id
            for block in module.blocks
            for label in block.labels
        }
        findings: list[Finding] = []

        for routine in module.routines.values():
            if routine.name in block_by_label:
                continue
            category, category_reason = classify_global_label(routine)
            if category != "runtime_code":
                continue

            incoming = [
                reference
                for reference in references_by_label.get(routine.name, [])
                if reference.source_label != routine.name
            ]
            if incoming:
                continue

            line_count = routine_line_count(routine)
            source_bytes = routine_source_bytes(routine)
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Unannotated runtime label has no proven external references",
                    routine=routine.name,
                    line_start=module.lines[routine.start_index].lineno,
                    line_end=module.lines[routine.end_index - 1].lineno,
                    summary=(
                        f"`{routine.name}` is unannotated runtime code ({line_count} lines, "
                        f"{source_bytes} source bytes) and no external label references were found. "
                        f"Category reason: {category_reason}."
                    ),
                    patch=None,
                )
            )

        return findings


FEATURE_RUNTIME_FAMILIES: list[dict[str, object]] = [
    {
        "feature": "sounds",
        "name": "audio",
        "count_keys": ("sounds", "tracks"),
        "prefixes": (
            "music_",
            "sfx_",
            "call_music_",
            "call_sfx_",
        ),
        "exact": (
            "init_sound_system",
            "init_sound_system_far",
            "call_init_sound_system_resident",
            "task_audio_tick",
            "task_audio_tick_far",
            "call_task_audio_tick_resident",
        ),
    },
    {
        "feature": "menus",
        "name": "menus",
        "count_keys": ("menus",),
        "prefixes": (
            "menu_",
            "show_menu_",
            "handle_menu_",
            "call_show_menu_",
        ),
        "exact": (
            "init_menus",
            "update_menu_state",
            "init_menu_system",
            "show_main_menu",
        ),
    },
    {
        "feature": "bosses",
        "name": "bosses",
        "count_keys": ("bosses", "bossInstances"),
        "prefixes": (
            "boss_",
            "draw_boss_",
            "update_boss_",
            "init_boss_",
            "call_boss_",
            "call_draw_boss_",
            "call_update_boss_",
            "call_init_boss_",
        ),
        "exact": (
            "init_screen_boss_from_current_screen",
            "init_screen_boss_from_current_screen_far",
            "call_init_screen_boss_from_current_screen_resident",
            "update_boss_system",
            "update_boss_system_far",
            "call_update_boss_system_resident",
        ),
    },
    {
        "feature": "dialogues",
        "name": "dialogues",
        "count_keys": ("dialogues",),
        "prefixes": (
            "dialog_",
            "dialogue_",
            "show_dialog_",
            "show_dialogue_",
            "print_dialog_",
            "print_dialogue_",
            "call_dialog_",
            "call_dialogue_",
        ),
        "exact": (
            "init_dialogue_system",
            "update_dialogue_system",
        ),
    },
    {
        "feature": "stateMachines",
        "name": "state machines",
        "count_keys": ("stateMachines",),
        "prefixes": (
            "sm_",
            "action_",
            "condition_",
            "call_sm_",
            "call_action_",
            "call_condition_",
        ),
        "exact": (
            "init_statemachine_system",
            "init_statemachine_system_far",
            "call_init_statemachine_system_resident",
            "update_statemachine_system",
            "update_statemachine_system_far",
            "call_update_statemachine_system_resident",
            "execute_all_state_machines",
            "execute_all_state_machines_far",
            "call_execute_all_state_machines_resident",
        ),
    },
]


FEATURE_RUNTIME_GROUPS: list[dict[str, object]] = [
    {
        "feature": "sounds",
        "id": "runtime.sound.group.init",
        "name": "audio init",
        "labels": (
            "call_init_sound_system_resident",
            "init_sound_system_far",
            "init_sound_system",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.tick",
        "name": "audio tick",
        "labels": (
            "call_task_audio_tick_resident",
            "task_audio_tick_far",
            "task_audio_tick",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.music_update",
        "name": "music update",
        "labels": (
            "call_music_update_resident",
            "music_update_far",
            "music_update",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.sfx_update",
        "name": "SFX update",
        "labels": (
            "call_sfx_update_resident",
            "sfx_update_far",
            "sfx_update",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.music_stop",
        "name": "music stop",
        "labels": (
            "call_music_stop_resident",
            "music_stop_far",
            "music_stop",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.music_play_track",
        "name": "music play-track",
        "labels": (
            "call_music_play_track_resident",
            "music_play_track_far",
            "music_play_track",
        ),
    },
    {
        "feature": "sounds",
        "id": "runtime.sound.group.music_execute_command",
        "name": "music command",
        "labels": (
            "call_music_execute_command_resident",
            "music_execute_command_far",
            "music_execute_command",
        ),
    },
    {
        "feature": "bosses",
        "id": "runtime.boss.group.all",
        "name": "boss runtime",
        "require_all_labels": True,
        "labels": (
            "init_boss_system_far",
            "init_screen_boss_from_current_screen_far",
            "update_boss_system_far",
            "draw_boss_attack_far",
            "call_init_boss_system_resident",
            "call_init_screen_boss_from_current_screen_resident",
            "call_update_boss_system_resident",
            "call_update_boss_projectile_runtime_resident",
            "call_draw_boss_attack_resident",
            "call_draw_boss_meteor_attack_resident",
            "call_draw_boss_bomb_attack_resident",
            "call_draw_boss_boomerang_attack_resident",
            "call_draw_boss_rock_attack_resident",
            "call_draw_boss_laser_attack_resident",
            "call_draw_boss_sine_wave_attack_resident",
            "call_draw_boss_homing_missile_attack_resident",
            "init_boss_system",
            "update_boss_system",
            "init_screen_boss_from_current_screen",
            "update_boss_projectile_runtime",
            "update_boss_behavior",
            "draw_boss_attack",
            "draw_boss_projectile_attack",
            "draw_active_boss_tiles",
            "restore_active_boss_tiles",
            "restore_active_boss_tiles_exposed",
            "boss_push_data_bank",
            "boss_pop_data_bank",
            "boss_resolve_initial_phase",
            "boss_init_behavior_state",
            "boss_prepare_behavior_move_timing",
            "boss_tick_behavior_move_step",
            "boss_step_towards_behavior_target",
            "boss_resolve_behavior_target",
            "boss_load_current_behavior_action",
            "boss_apply_behavior_form",
            "boss_draw_behavior_attack",
            "boss_attack_get_sprite_pattern",
            "boss_get_active_tile_char",
            "boss_get_runtime_layout_char",
            "boss_current_shape_covers_draw_cell",
            "boss_draw_write_cell",
            "boss_projectile_show_current",
            "boss_projectile_hide_all",
            "boss_slam_rocks_hide_all",
            "boss_falling_blocks_hide_all",
        ),
    },
    {
        "feature": "bosses",
        "id": "runtime.boss.group.stubs",
        "name": "boss compatibility stubs",
        "require_all_labels": True,
        "labels": (
            "init_boss_system_far",
            "init_screen_boss_from_current_screen_far",
            "update_boss_system_far",
            "call_init_boss_system_resident",
            "call_init_screen_boss_from_current_screen_resident",
            "call_update_boss_system_resident",
            "call_update_boss_projectile_runtime_resident",
            "call_draw_boss_attack_resident",
            "call_draw_boss_meteor_attack_resident",
            "call_draw_boss_bomb_attack_resident",
            "call_draw_boss_boomerang_attack_resident",
            "call_draw_boss_rock_attack_resident",
            "call_draw_boss_laser_attack_resident",
            "call_draw_boss_sine_wave_attack_resident",
            "call_draw_boss_homing_missile_attack_resident",
            "init_boss_system",
            "update_boss_system",
            "init_screen_boss_from_current_screen",
        ),
    },
    {
        "feature": "dialogues",
        "id": "runtime.dialogue.group.box",
        "name": "dialogue box",
        "labels": (
            "init_dialogue_system",
            "update_dialogue_system",
            "dialogue_update_typewriter",
            "dialogue_open_box",
            "dialogue_start_line",
            "dialogue_clear_box",
            "dialogue_close_box",
            "show_dialogue_box",
        ),
    },
    {
        "feature": "menus",
        "id": "runtime.menu.group.core",
        "name": "menu core",
        "labels": (
            "init_menus",
            "init_menu_system",
            "update_menu_state",
            "show_main_menu",
            "show_menu_main",
            "handle_menu_input",
            "handle_menu_selection",
        ),
    },
    {
        "feature": "stateMachines",
        "id": "runtime.state_machine.group.executor",
        "name": "state-machine executor",
        "labels": (
            "init_statemachine_system",
            "init_statemachine_system_far",
            "call_init_statemachine_system_resident",
            "update_statemachine_system",
            "update_statemachine_system_far",
            "call_update_statemachine_system_resident",
            "execute_all_state_machines",
            "execute_all_state_machines_far",
            "call_execute_all_state_machines_resident",
        ),
    },
]

BOSS_ATTACK_RUNTIME_GROUPS: list[dict[str, object]] = [
    {
        "type": "Projectile",
        "id": "runtime.boss.attack.projectile",
        "name": "boss projectile attack",
        "labels": (
            "update_boss_projectile_runtime_far",
            "draw_boss_projectile_attack_far",
            "call_update_boss_projectile_runtime_resident",
            "update_boss_projectile_runtime",
            "draw_boss_projectile_attack",
            "boss_projectile_select_velocity",
            "boss_projectile_show_current",
            "boss_projectile_hide_all",
        ),
    },
    {
        "type": "Meteor",
        "id": "runtime.boss.attack.meteor",
        "name": "boss meteor attack",
        "labels": (
            "draw_boss_meteor_attack_far",
            "call_draw_boss_meteor_attack_resident",
            "draw_boss_meteor_attack",
        ),
    },
    {
        "type": "Bomb",
        "id": "runtime.boss.attack.bomb",
        "name": "boss bomb attack",
        "labels": (
            "draw_boss_bomb_attack_far",
            "call_draw_boss_bomb_attack_resident",
            "draw_boss_bomb_attack",
        ),
    },
    {
        "type": "Boomerang",
        "id": "runtime.boss.attack.boomerang",
        "name": "boss boomerang attack",
        "labels": (
            "draw_boss_boomerang_attack_far",
            "call_draw_boss_boomerang_attack_resident",
            "draw_boss_boomerang_attack",
        ),
    },
    {
        "type": "Rock",
        "id": "runtime.boss.attack.rock",
        "name": "boss rock attack",
        "labels": (
            "draw_boss_rock_attack_far",
            "call_draw_boss_rock_attack_resident",
            "draw_boss_rock_attack",
        ),
    },
    {
        "type": "Laser",
        "id": "runtime.boss.attack.laser",
        "name": "boss laser attack",
        "labels": (
            "draw_boss_laser_attack_far",
            "call_draw_boss_laser_attack_resident",
            "draw_boss_laser_attack",
        ),
    },
    {
        "type": "SineWave",
        "id": "runtime.boss.attack.sine_wave",
        "name": "boss sine-wave attack",
        "labels": (
            "draw_boss_sine_wave_attack_far",
            "call_draw_boss_sine_wave_attack_resident",
            "draw_boss_sine_wave_attack",
        ),
    },
    {
        "type": "HomingMissile",
        "id": "runtime.boss.attack.homing_missile",
        "name": "boss homing missile attack",
        "labels": (
            "draw_boss_homing_missile_attack_far",
            "call_draw_boss_homing_missile_attack_resident",
            "draw_boss_homing_missile_attack",
        ),
    },
    {
        "type": "SlamRocks",
        "id": "runtime.boss.attack.slam_rocks",
        "name": "boss slam-rocks attack",
        "labels": (
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
        ),
    },
    {
        "type": "FallingBlocks",
        "id": "runtime.boss.attack.falling_blocks",
        "name": "boss falling-blocks attack",
        "labels": (
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
        ),
    },
]

COMPONENT_RUNTIME_GROUPS: list[dict[str, object]] = [
    {"type": "Input", "id": "runtime.components.system.input", "name": "input component", "labels": ("update_input_component",)},
    {"type": "Position", "id": "runtime.components.system.position", "name": "position component", "labels": ("update_position_component",)},
    {"type": "Movement", "id": "runtime.components.system.movement", "name": "movement component", "labels": ("init_movement_system", "update_movement_component")},
    {"type": "Collision", "id": "runtime.components.system.collision", "name": "collision component", "labels": ("update_collision_component",)},
    {"type": "Sprite", "id": "runtime.components.system.sprite", "name": "sprite component", "labels": ("update_sprite_component",)},
    {"type": "Behavior", "id": "runtime.components.system.behavior", "name": "behavior component", "labels": ("update_behavior_component",)},
    {
        "type": "Health",
        "id": "runtime.components.system.health",
        "name": "health component",
        "labels": (
            "init_health_system",
            "update_health_component",
            "decrease_entity_lives",
            "increase_entity_lives",
        ),
    },
    {"type": "Animation", "id": "runtime.components.system.animation", "name": "animation component", "labels": ("update_animation_component",)},
    {"type": "Jump", "id": "runtime.components.system.jump", "name": "jump component", "labels": ("update_jump_component",)},
    {"type": "Gravity", "id": "runtime.components.system.gravity", "name": "gravity component", "labels": ("init_gravity_system", "update_gravity_component")},
    {
        "type": "WallGrab",
        "id": "runtime.components.system.wall_grab",
        "name": "wall-grab component",
        "labels": (
            "init_wallgrab_system",
            "update_wallgrab_component",
            "refresh_player_wallgrab_fastpath",
            "wallgrab_process_entity_c",
        ),
    },
    {
        "type": "WallJump",
        "id": "runtime.components.system.wall_jump",
        "name": "wall-jump component",
        "labels": (
            "init_walljump_system",
            "update_walljump_component",
            "walljump_process_entity_c",
            "walljump_input_is_left",
            "walljump_input_is_right",
        ),
    },
    {
        "type": "TileInteraction",
        "id": "runtime.components.system.tile_interaction",
        "name": "tile-interaction component",
        "labels": (
            "init_tile_interaction_system",
            "update_slash_component",
            "refresh_player_tile_interaction_fastpath",
        ),
    },
    {"type": "AutoDestroy", "id": "runtime.components.system.auto_destroy", "name": "auto-destroy component", "labels": ("init_auto_destroy_system", "update_auto_destroy_component")},
    {"type": "Cursors", "id": "runtime.components.system.cursors", "name": "cursors component", "labels": ("init_cursors_system", "update_cursors_component")},
    {"type": "StateMachine", "id": "runtime.components.system.state_machine", "name": "state-machine component", "labels": ("update_statemachine_component",)},
    {"type": "Carry", "id": "runtime.components.system.carry", "name": "carry component", "labels": ("init_carry_system", "update_carry_component")},
    {
        "type": "Damage",
        "id": "runtime.components.system.damage",
        "name": "damage component",
        "labels": (
            "init_damage_system",
            "update_damage_component",
            "apply_damage_to_entity",
            "check_entity_invincible",
        ),
    },
    {"type": "Shoot", "id": "runtime.components.system.shoot", "name": "shoot component", "labels": ("init_shoot_system", "update_shoot_component")},
    {"type": "WallCollision", "id": "runtime.components.system.wall_collision", "name": "wall-collision component", "labels": ("update_wallcollision_component",)},
    {"type": "DeadlyTiles", "id": "runtime.components.system.deadly_tiles", "name": "deadly-tiles component", "labels": ("update_deadly_tiles_component",)},
    {"type": "InWater", "id": "runtime.components.system.in_water", "name": "in-water component", "labels": ("init_in_water_system", "update_in_water_component")},
    {"type": "Collectible", "id": "runtime.components.system.collectible", "name": "collectible component", "labels": ("init_collectible_system", "update_collectible_component")},
    {"type": "RetractableGate", "id": "runtime.components.system.retractable_gate", "name": "retractable-gate component", "labels": ("init_retractable_gate_system", "update_retractable_gate_component")},
    {
        "type": "AutoControlScript",
        "id": "runtime.components.system.auto_control_script",
        "name": "auto-control-script component",
        "labels": (
            "init_auto_control_script_system",
            "update_auto_control_script_component",
            "update_auto_event_string_component",
        ),
    },
]

PATCHABLE_INACTIVE_FEATURE_FAMILIES = {"sounds"}

PATCHABLE_FEATURE_RUNTIME_GROUP_IDS = {
    "runtime.sound.group.init",
    "runtime.sound.group.tick",
    "runtime.sound.group.music_update",
    "runtime.sound.group.sfx_update",
    "runtime.sound.group.music_stop",
    "runtime.sound.group.music_play_track",
    "runtime.sound.group.music_execute_command",
    "runtime.boss.group.all",
    "runtime.boss.group.stubs",
}

PATCHABLE_BOSS_ATTACK_RUNTIME_GROUP_IDS = {
    "runtime.boss.attack.projectile",
    "runtime.boss.attack.meteor",
    "runtime.boss.attack.bomb",
    "runtime.boss.attack.boomerang",
    "runtime.boss.attack.rock",
    "runtime.boss.attack.laser",
    "runtime.boss.attack.sine_wave",
    "runtime.boss.attack.homing_missile",
    "runtime.boss.attack.slam_rocks",
    "runtime.boss.attack.falling_blocks",
}

PATCHABLE_COMPONENT_RUNTIME_GROUP_IDS = {
    str(group["id"])
    for group in COMPONENT_RUNTIME_GROUPS
}


def numeric_count(value: object) -> int | None:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    return None


def inactive_feature_reason(project_usage: dict, feature: str, count_keys: tuple[str, ...]) -> str | None:
    features = project_usage.get("features") if isinstance(project_usage.get("features"), dict) else {}
    counts = project_usage.get("counts") if isinstance(project_usage.get("counts"), dict) else {}
    known = False
    enabled = False

    if feature in features:
        known = True
        enabled = bool(features.get(feature))

    count_notes = []
    for key in count_keys:
        if key not in counts:
            continue
        known = True
        count_value = numeric_count(counts.get(key))
        if count_value is not None:
            count_notes.append(f"{key}={count_value}")
            enabled = enabled or count_value > 0

    if not known or enabled:
        return None
    if count_notes:
        return f"project_usage marks feature `{feature}` disabled ({', '.join(count_notes)})."
    return f"project_usage marks feature `{feature}` disabled."


def matches_feature_family(label: str, family: dict[str, object]) -> bool:
    lower = label.lower()
    exact = tuple(str(item).lower() for item in family.get("exact", ()))
    prefixes = tuple(str(item).lower() for item in family.get("prefixes", ()))
    return lower in exact or lower.startswith(prefixes)


def collect_group_external_references(
    references_by_label: dict[str, list[LabelReference]],
    group_labels: set[str],
) -> list[LabelReference]:
    external: list[LabelReference] = []
    for label in sorted(group_labels):
        for reference in references_by_label.get(label, []):
            if reference.source_label in group_labels:
                continue
            external.append(reference)
    external.sort(key=lambda reference: (reference.line, reference.label, reference.source_label))
    return external


def patch_window_for_runtime_group_routine(
    module: AsmModule,
    routine: Routine,
    group_labels: set[str],
) -> tuple[int, int]:
    block = block_for_index(module, routine.start_index)
    if block is not None and routine.name in block.labels and set(block.labels).issubset(group_labels):
        return block.start_index, block.end_index
    return routine.start_index, routine_deletion_end_index(routine)


class UnusedBossAttackRuntimeRule:
    id = "unused-boss-attack-runtime"
    description = "Report boss attack runtimes whose attack type is absent from project_usage."

    def __init__(self, allow_patches: bool = False) -> None:
        self.allow_patches = allow_patches

    def find(self, module: AsmModule) -> list[Finding]:
        metadata = module.metadata or {}
        project_usage = metadata.get("project_usage")
        if not isinstance(project_usage, dict):
            return []
        if inactive_feature_reason(project_usage, "bosses", ("bosses", "bossInstances")):
            return []
        attack_runtime = project_usage.get("bossAttackRuntime")
        if not isinstance(attack_runtime, dict):
            return []
        used_types_raw = attack_runtime.get("usedTypes")
        if not isinstance(used_types_raw, list):
            return []
        used_types = {str(item) for item in used_types_raw}
        references_by_label = collect_label_references(module)
        findings: list[Finding] = []

        for group in BOSS_ATTACK_RUNTIME_GROUPS:
            attack_type = str(group.get("type", ""))
            if attack_type in used_types:
                continue
            expected_labels = tuple(label for label in group.get("labels", ()) if isinstance(label, str))
            existing_labels = [
                label
                for label in expected_labels
                if label in module.label_to_line
            ]
            existing_routines = [
                module.routines[label]
                for label in existing_labels
                if label in module.routines
            ]
            if not existing_labels:
                continue
            group_labels = set(existing_labels)
            external_refs = collect_group_external_references(references_by_label, group_labels)
            labels_note = ", ".join(sorted(group_labels))
            used_note = ", ".join(sorted(used_types)) if used_types else "none"
            if external_refs:
                sample = ", ".join(
                    f"{reference.source_label}->{reference.label}@{reference.line}"
                    for reference in external_refs[:5]
                )
                if len(external_refs) > 5:
                    sample += f", ... (+{len(external_refs) - 5} more)"
                reference_note = (
                    f"External references still exist ({len(external_refs)}): {sample}. "
                    "Deletion stays blocked until the caller path is proven dead or grouped."
                )
            else:
                reference_note = (
                    "No external references outside this attack group were found. "
                    "This is a candidate for a future atomic type-specific patch."
                )
            group_id = str(group["id"])
            group_patch_windows: list[tuple[Routine, int, int]] = []
            patch_note = " Patch policy: report-only."
            if self.allow_patches and not external_refs:
                if group_id not in PATCHABLE_BOSS_ATTACK_RUNTIME_GROUP_IDS:
                    patch_note = (
                        " Patch policy: report-only because this attack group has not been "
                        "added to the validated patchable set."
                    )
                else:
                    missing_routines = sorted(set(existing_labels) - set(module.routines))
                    if missing_routines:
                        patch_note = (
                            " Atomic patch remains disabled because these labels are not independent "
                            f"routine windows: {', '.join(missing_routines)}."
                        )
                    else:
                        blocked_reasons: list[str] = []
                        seen_windows: set[tuple[int, int]] = set()
                        for routine in existing_routines:
                            start_index, end_index = patch_window_for_runtime_group_routine(
                                module,
                                routine,
                                group_labels,
                            )
                            window_key = (start_index, end_index)
                            if window_key in seen_windows:
                                continue
                            seen_windows.add(window_key)
                            if patch_window_contains_bank_equ(module.lines, start_index, end_index):
                                blocked_reasons.append(f"`{routine.name}` window contains a bank EQU marker")
                                continue
                            group_patch_windows.append((routine, start_index, end_index))
                        if blocked_reasons:
                            group_patch_windows = []
                            patch_note = " Atomic patch remains disabled: " + "; ".join(blocked_reasons) + "."
                        elif group_patch_windows:
                            patch_note = (
                                f" Atomic patch enabled as `{group_id}` with "
                                f"{len(group_patch_windows)} window(s)."
                            )
            line_start = min(module.lines[module.label_to_line[label]].lineno for label in existing_labels)
            line_end = max(
                module.lines[module.routines[label].end_index - 1].lineno
                if label in module.routines
                else module.lines[module.label_to_line[label]].lineno
                for label in existing_labels
            )
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Boss attack runtime type is unused",
                    routine=group_id,
                    line_start=line_start,
                    line_end=line_end,
                    summary=(
                        f"`{group['id']}` covers {group['name']} labels: {labels_note}. "
                        f"`project_usage.bossAttackRuntime.usedTypes` is {used_note}, "
                        f"so attack type `{attack_type}` is not used by any referenced boss attack. "
                        f"{reference_note}{patch_note}"
                    ),
                    patch=None,
                )
            )
            for routine, start_index, end_index in group_patch_windows:
                findings.append(
                    Finding(
                        rule_id=self.id,
                        title="Unused boss attack runtime group window is atomically patchable",
                        routine=f"{group_id}:{routine.name}",
                        line_start=module.lines[start_index].lineno,
                        line_end=module.lines[end_index - 1].lineno,
                        summary=(
                            f"`{routine.name}` is part of unused boss attack group `{group_id}`. "
                            "The group has no external references, so this window is removed only "
                            "together with the other group windows."
                        ),
                        patch=make_patch_for_absolute_window(
                            start_index,
                            end_index,
                            f"Remove unused boss attack group window `{routine.name}` from `{group_id}`.",
                            group_id=group_id,
                        ),
                    )
                )

        return findings


class InactiveFeatureRuntimeRule:
    id = "inactive-feature-runtime"
    description = "Report runtime labels for feature families that project_usage says are absent."

    def __init__(self, allow_patches: bool = False, patch_features: set[str] | None = None) -> None:
        self.allow_patches = allow_patches
        self.patch_features = patch_features or PATCHABLE_INACTIVE_FEATURE_FAMILIES

    def find(self, module: AsmModule) -> list[Finding]:
        metadata = module.metadata or {}
        project_usage = metadata.get("project_usage")
        if not isinstance(project_usage, dict):
            return []
        references_by_label = collect_label_references(module)
        block_by_label = {
            label: block
            for block in module.blocks
            for label in block.labels
        }

        inactive_families = []
        for family in FEATURE_RUNTIME_FAMILIES:
            feature = str(family["feature"])
            count_keys = tuple(str(item) for item in family.get("count_keys", ()))
            reason = inactive_feature_reason(project_usage, feature, count_keys)
            if reason:
                inactive_families.append((family, reason))
        if not inactive_families:
            return []

        findings: list[Finding] = []
        if self.allow_patches:
            inactive_feature_names = {str(family["feature"]) for family, _reason in inactive_families}
            for group in FEATURE_RUNTIME_GROUPS:
                feature_name = str(group.get("feature", ""))
                if feature_name not in inactive_feature_names:
                    continue
                expected_labels = tuple(label for label in group.get("labels", ()) if isinstance(label, str))
                existing_routines = [
                    module.routines[label]
                    for label in expected_labels
                    if label in module.routines
                ]
                if not existing_routines:
                    continue
                if group.get("require_all_labels") and len(existing_routines) != len(expected_labels):
                    continue
                group_labels = {routine.name for routine in existing_routines}
                external_refs = collect_group_external_references(references_by_label, group_labels)
                labels_note = ", ".join(sorted(group_labels))
                if external_refs:
                    sample = ", ".join(
                        f"{reference.source_label}->{reference.label}@{reference.line}"
                        for reference in external_refs[:5]
                    )
                    if len(external_refs) > 5:
                        sample += f", ... (+{len(external_refs) - 5} more)"
                    group_state = (
                        f"Group deletion remains blocked by {len(external_refs)} external references: {sample}."
                    )
                else:
                    group_state = (
                        "No external references outside the group were found. "
                        "This is ready for a future atomic multi-window patch, or for dead-blocks to remove "
                        "the annotated windows as whole groups."
                    )
                group_id = str(group["id"])
                group_patch_windows: list[tuple[Routine, int, int]] = []
                patch_note = ""
                if not external_refs and group_id in PATCHABLE_FEATURE_RUNTIME_GROUP_IDS:
                    blocked_reasons: list[str] = []
                    seen_windows: set[tuple[int, int]] = set()
                    for routine in existing_routines:
                        start_index, end_index = patch_window_for_runtime_group_routine(
                            module,
                            routine,
                            group_labels,
                        )
                        window_key = (start_index, end_index)
                        if window_key in seen_windows:
                            continue
                        seen_windows.add(window_key)
                        if patch_window_contains_bank_equ(module.lines, start_index, end_index):
                            blocked_reasons.append(
                                f"`{routine.name}` window contains a bank EQU marker"
                            )
                            continue
                        group_patch_windows.append((routine, start_index, end_index))
                    if blocked_reasons:
                        group_patch_windows = []
                        patch_note = " Atomic patch remains disabled: " + "; ".join(blocked_reasons) + "."
                    elif group_patch_windows:
                        patch_note = (
                            f" Atomic patch enabled as `{group_id}` with "
                            f"{len(group_patch_windows)} window(s)."
                        )
                elif not external_refs:
                    patch_note = (
                        f" Patch policy: runtime group `{group_id}` is report-only until "
                        "it is added to the validated patchable set."
                    )
                line_start = min(module.lines[routine.start_index].lineno for routine in existing_routines)
                line_end = max(module.lines[routine.end_index - 1].lineno for routine in existing_routines)
                findings.append(
                    Finding(
                        rule_id=self.id,
                        title="Inactive feature runtime group candidate",
                        routine=str(group["id"]),
                        line_start=line_start,
                        line_end=line_end,
                        summary=(
                            f"`{group['id']}` groups inactive {group['name']} runtime labels: "
                            f"{labels_note}. {group_state}{patch_note}"
                        ),
                        patch=None,
                    )
                )
                for routine, start_index, end_index in group_patch_windows:
                    findings.append(
                        Finding(
                            rule_id=self.id,
                            title="Inactive feature runtime group window is atomically patchable",
                            routine=f"{group_id}:{routine.name}",
                            line_start=module.lines[start_index].lineno,
                            line_end=module.lines[end_index - 1].lineno,
                            summary=(
                                f"`{routine.name}` is part of inactive runtime group `{group_id}`. "
                                "The group has no external references, so this window is removed only "
                                "together with the other group windows."
                            ),
                            patch=make_patch_for_absolute_window(
                                start_index,
                                end_index,
                                f"Remove inactive runtime group window `{routine.name}` from `{group_id}`.",
                                group_id=group_id,
                            ),
                        )
                    )

        seen: set[tuple[str, str]] = set()
        for routine in module.routines.values():
            if routine_instruction_count(routine) == 0:
                continue
            category, category_reason = classify_global_label(routine)
            for family, reason in inactive_families:
                if not matches_feature_family(routine.name, family):
                    continue
                key = (str(family["feature"]), routine.name)
                if key in seen:
                    continue
                seen.add(key)
                incoming = [
                    reference
                    for reference in references_by_label.get(routine.name, [])
                    if reference.source_label != routine.name
                ]
                if incoming:
                    incoming_sample = ", ".join(
                        f"{reference.source_label}@{reference.line}" for reference in incoming[:5]
                    )
                    if len(incoming) > 5:
                        incoming_sample += f", ... (+{len(incoming) - 5} more)"
                    reference_note = (
                        f"External references still exist ({len(incoming)}): {incoming_sample}. "
                        "Deletion must stay blocked until callers are proven dead or rewired."
                    )
                else:
                    reference_note = (
                        "No external label references were found, making this a candidate for a future "
                        "feature-specific patch rule once block ownership and invariants are added."
                    )
                feature_name = str(family["feature"])
                annotated_block = block_by_label.get(routine.name)
                if annotated_block is not None:
                    block_note = (
                        f"Block ownership: `{annotated_block.id}` "
                        f"owner=`{annotated_block.owner}` preserve={str(annotated_block.preserve).lower()}. "
                    )
                else:
                    block_note = "Block ownership: unannotated. "
                patch = None
                patchable_families = ", ".join(f"`{item}`" for item in sorted(self.patch_features))
                if feature_name not in self.patch_features:
                    patch_note = (
                        f"Patch policy: feature family `{feature_name}` is report-only; "
                        f"currently patchable inactive families: {patchable_families}. "
                    )
                elif not self.allow_patches:
                    patch_note = (
                        f"Patch policy: feature family `{feature_name}` can be patched only in apply mode; "
                        "this analysis run does not emit patches. "
                    )
                else:
                    if incoming:
                        patch_note = "Patch remains disabled because external references still exist. "
                    else:
                        if annotated_block is not None:
                            patch_note = (
                                f"Patch remains disabled because `{routine.name}` is inside annotated block "
                                f"`{annotated_block.id}`; group-level deletion must be handled by dead-blocks. "
                            )
                        else:
                            patch_end_index = routine_deletion_end_index(routine)
                            if patch_window_contains_bank_equ(module.lines, routine.start_index, patch_end_index):
                                patch_note = (
                                    "Patch remains disabled because the routine window contains a bank EQU marker. "
                                )
                            else:
                                patch = make_patch_for_absolute_window(
                                    routine.start_index,
                                    patch_end_index,
                                    f"Remove inactive {feature_name} runtime routine with no external references.",
                                )
                            patch_note = (
                                patch_note
                                or "Patch enabled for inactive audio runtime with no external references. "
                            )
                line_count = routine_line_count(routine)
                source_bytes = routine_source_bytes(routine)
                safety_note = (
                    "The patch is still validated by the post-ASM transform invariants."
                    if patch is not None
                    else "This is report-only until the generator metadata and invariants prove deletion is safe."
                )
                findings.append(
                    Finding(
                        rule_id=self.id,
                        title="Runtime label belongs to an inactive project feature",
                        routine=routine.name,
                        line_start=module.lines[routine.start_index].lineno,
                        line_end=module.lines[routine.end_index - 1].lineno,
                        summary=(
                            f"`{routine.name}` looks like {family['name']} runtime "
                            f"({line_count} lines, {source_bytes} source bytes), but {reason} "
                            f"Category: {category} ({category_reason}). "
                            f"{reference_note} "
                            f"{block_note}"
                            f"{patch_note}"
                            f"{safety_note}"
                        ),
                        patch=patch,
                    )
                )
                break
        return findings


class UnusedComponentRuntimeRule:
    id = "unused-component-runtime"
    description = "Report component update runtimes whose component type is absent from project_usage."

    def __init__(self, allow_patches: bool = False) -> None:
        self.allow_patches = allow_patches

    def find(self, module: AsmModule) -> list[Finding]:
        metadata = module.metadata or {}
        project_usage = metadata.get("project_usage")
        if not isinstance(project_usage, dict):
            return []
        if inactive_feature_reason(project_usage, "components", ("components",)):
            return []
        component_runtime = project_usage.get("componentRuntime")
        if not isinstance(component_runtime, dict):
            return []
        used_components_raw = component_runtime.get("usedComponents")
        if not isinstance(used_components_raw, list):
            return []

        used_components = {str(item) for item in used_components_raw}
        component_counts = (
            component_runtime.get("componentCounts")
            if isinstance(component_runtime.get("componentCounts"), dict)
            else {}
        )
        references_by_label = collect_label_references(module)
        findings: list[Finding] = []

        for group in COMPONENT_RUNTIME_GROUPS:
            component_type = str(group.get("type", ""))
            if component_type in used_components:
                continue
            expected_labels = tuple(label for label in group.get("labels", ()) if isinstance(label, str))
            existing_labels = [label for label in expected_labels if label in module.label_to_line]
            existing_routines = [
                module.routines[label]
                for label in existing_labels
                if label in module.routines
            ]
            if not existing_routines:
                continue
            group_labels = set(existing_labels)
            external_refs = collect_group_external_references(references_by_label, group_labels)
            labels_note = ", ".join(sorted(group_labels))
            used_note = ", ".join(sorted(used_components)) if used_components else "none"
            count_note = numeric_count(component_counts.get(component_type)) if isinstance(component_counts, dict) else None
            if external_refs:
                sample = ", ".join(
                    f"{reference.source_label}->{reference.label}@{reference.line}"
                    for reference in external_refs[:5]
                )
                if len(external_refs) > 5:
                    sample += f", ... (+{len(external_refs) - 5} more)"
                reference_note = (
                    f"External references still exist ({len(external_refs)}): {sample}. "
                    "Deletion stays blocked until the scheduler/caller path is proven dead or grouped."
                )
            else:
                reference_note = (
                    "No external references outside this component group were found. "
                    "This is a candidate for a future atomic component-system patch."
                )
            group_id = str(group["id"])
            group_patch_windows: list[tuple[Routine, int, int]] = []
            patch_note = " Patch policy: report-only."
            if self.allow_patches and not external_refs:
                if group_id not in PATCHABLE_COMPONENT_RUNTIME_GROUP_IDS:
                    patch_note = (
                        " Patch policy: report-only because this component group has not been "
                        "added to the validated patchable set."
                    )
                else:
                    missing_routines = sorted(set(existing_labels) - set(module.routines))
                    if missing_routines:
                        patch_note = (
                            " Atomic patch remains disabled because these labels are not independent "
                            f"routine windows: {', '.join(missing_routines)}."
                        )
                    else:
                        blocked_reasons: list[str] = []
                        seen_windows: set[tuple[int, int]] = set()
                        for routine in existing_routines:
                            start_index, end_index = patch_window_for_runtime_group_routine(
                                module,
                                routine,
                                group_labels,
                            )
                            window_key = (start_index, end_index)
                            if window_key in seen_windows:
                                continue
                            seen_windows.add(window_key)
                            if patch_window_contains_bank_equ(module.lines, start_index, end_index):
                                blocked_reasons.append(f"`{routine.name}` window contains a bank EQU marker")
                                continue
                            group_patch_windows.append((routine, start_index, end_index))
                        if blocked_reasons:
                            group_patch_windows = []
                            patch_note = " Atomic patch remains disabled: " + "; ".join(blocked_reasons) + "."
                        elif group_patch_windows:
                            patch_note = (
                                f" Atomic patch enabled as `{group_id}` with "
                                f"{len(group_patch_windows)} window(s)."
                            )
            count_suffix = f" `componentCounts.{component_type}` is {count_note}." if count_note is not None else ""
            line_start = min(module.lines[routine.start_index].lineno for routine in existing_routines)
            line_end = max(module.lines[routine.end_index - 1].lineno for routine in existing_routines)
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Component runtime type is unused",
                    routine=group_id,
                    line_start=line_start,
                    line_end=line_end,
                    summary=(
                        f"`{group['id']}` covers unused {group['name']} labels: {labels_note}. "
                        f"`project_usage.componentRuntime.usedComponents` is {used_note}, "
                        f"so component type `{component_type}` is not used by active entities."
                        f"{count_suffix} {reference_note}{patch_note}"
                    ),
                    patch=None,
                )
            )
            for routine, start_index, end_index in group_patch_windows:
                findings.append(
                    Finding(
                        rule_id=self.id,
                        title="Unused component runtime group window is atomically patchable",
                        routine=f"{group_id}:{routine.name}",
                        line_start=module.lines[start_index].lineno,
                        line_end=module.lines[end_index - 1].lineno,
                        summary=(
                            f"`{routine.name}` is part of unused component runtime group `{group_id}`. "
                            "The group has no external references, so this window is removed only "
                            "together with the other group windows."
                        ),
                        patch=make_patch_for_absolute_window(
                            start_index,
                            end_index,
                            f"Remove unused component runtime group window `{routine.name}` from `{group_id}`.",
                            group_id=group_id,
                        ),
                    )
                )

        return findings


class UnusedScreenLoadersRule:
    id = "unused-screen-loaders"
    description = "Report generated load_screen_* routines with no proven external references."

    def __init__(self, allow_patches: bool = False) -> None:
        self.allow_patches = allow_patches

    def find(self, module: AsmModule) -> list[Finding]:
        references_by_label = collect_label_references(module)
        block_by_label = {
            label: block.id
            for block in module.blocks
            for label in block.labels
        }
        block_by_loader_base = {
            screen_loader_base_name(label): block
            for block in module.blocks
            for label in block.labels
            if screen_loader_base_name(label)
        }
        loader_metadata = collect_screen_loader_metadata(module)
        findings: list[Finding] = []

        for routine in module.routines.values():
            if routine.name in block_by_label:
                continue
            category, category_reason = classify_global_label(routine)
            if category != "screen_loader":
                continue

            incoming = [
                reference
                for reference in references_by_label.get(routine.name, [])
                if reference.source_label != routine.name
            ]
            if incoming:
                continue

            line_count = routine_line_count(routine)
            source_bytes = routine_source_bytes(routine)
            loader_base = screen_loader_base_name(routine.name) or routine.name.lower()
            related_block = block_by_loader_base.get(loader_base)
            scene = loader_metadata.get(loader_base)
            evidence_parts = []
            proven_unreachable = False
            if scene:
                scene_label = scene.get("name") or scene.get("id") or loader_base
                evidence_parts.append(
                    f"Project metadata maps it to scene `{scene_label}`"
                    f" (index={scene.get('index')}, resources={scene.get('resourceCount')})."
                )
                if scene.get("reachable") is False:
                    proven_unreachable = True
                    evidence_parts.append("GameFlow reachability marks this scene unreachable.")
                elif scene.get("reachable") is True:
                    evidence_parts.append("GameFlow reachability marks this scene reachable.")
                elif scene.get("reachable") is None and scene.get("reachabilityReason"):
                    evidence_parts.append(f"GameFlow reachability is unknown: {scene.get('reachabilityReason')}.")
            if related_block:
                evidence_parts.append(
                    f"Related annotated loader block `{related_block.id}` is currently rooted by `{loader_base}`."
                )
            if not evidence_parts:
                evidence_parts.append("No matching project_usage/load_plan metadata was found next to the ASM input.")
            routine_patch = (
                make_patch_for_absolute_window(
                    routine.start_index,
                    routine_deletion_end_index(routine),
                    "Remove unreferenced generated screen loader wrapper for a GameFlow-unreachable scene.",
                )
                if self.allow_patches and proven_unreachable
                else None
            )
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Generated screen loader has no proven references",
                    routine=routine.name,
                    line_start=module.lines[routine.start_index].lineno,
                    line_end=module.lines[routine.end_index - 1].lineno,
                    summary=(
                        f"`{routine.name}` is a generated screen loader ({line_count} lines, "
                        f"{source_bytes} source bytes) with no external label references. "
                        f"Category reason: {category_reason}. {' '.join(evidence_parts)} "
                        "Deletion is patchable only when GameFlow reachability proves the scene is unreachable."
                    ),
                    patch=routine_patch,
                )
            )
            if not (self.allow_patches and proven_unreachable and related_block):
                continue

            related_labels = set(related_block.labels)
            related_incoming = [
                reference
                for label in related_labels
                for reference in references_by_label.get(label, [])
                if reference.source_label not in related_labels and reference.source_label != routine.name
            ]
            if related_incoming:
                continue
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="Generated screen loader body is only used by an unreachable wrapper",
                    routine=related_block.id,
                    line_start=related_block.start_line,
                    line_end=related_block.end_line,
                    summary=(
                        f"Annotated loader block `{related_block.id}` only feeds `{routine.name}`, "
                        "and GameFlow reachability marks the owning scene unreachable."
                    ),
                    patch=make_patch_for_absolute_window(
                        related_block.start_index,
                        related_block.end_index,
                        "Remove generated screen loader body for a GameFlow-unreachable scene.",
                    ),
                )
            )

        return findings


STATE_MACHINE_DISPATCH_ENTRY_RE = re.compile(
    r"\bDW\s+([A-Za-z_.$?@][A-Za-z0-9_.$?@]*)\s*(?:;\s*(\d+))?",
    re.IGNORECASE,
)


def numeric_id_set(values: object) -> set[int] | None:
    if not isinstance(values, list):
        return None
    ids: set[int] = set()
    for value in values:
        try:
            ids.add(int(value))
        except (TypeError, ValueError):
            continue
    return ids


def first_state_machine_dispatch_id(references: list[LabelReference], label: str) -> int | None:
    for reference in references:
        match = STATE_MACHINE_DISPATCH_ENTRY_RE.search(reference.raw)
        if not match or match.group(1) != label or match.group(2) is None:
            continue
        return int(match.group(2))
    return None


def state_machine_dispatch_metadata_note(
    dispatch_kind: str,
    dispatch_id: int | None,
    action_ids: set[int] | None,
    condition_ids: set[int] | None,
) -> str:
    used_ids = action_ids if dispatch_kind == "action" else condition_ids
    usage_key = "usedActionIds" if dispatch_kind == "action" else "usedConditionIds"
    if used_ids is None:
        return "`project_usage.stateMachineRuntime` metadata is unavailable."
    if dispatch_id is None:
        return (
            "No dispatch id comment could be parsed from the table entry, so metadata "
            "cross-check is unavailable."
        )
    if dispatch_id in used_ids:
        return f"Dispatch id {dispatch_id} is listed in `project_usage.stateMachineRuntime.{usage_key}`."
    return (
        f"Dispatch id {dispatch_id} is not listed in `project_usage.stateMachineRuntime.{usage_key}`; "
        "this is only an unused-by-metadata signal."
    )


class StateMachineDispatchHandlersRule:
    id = "state-machine-dispatch-handlers"
    description = "Report state-machine action/condition handlers reached through dispatch tables."

    def __init__(self, allow_patches: bool = False) -> None:
        self.allow_patches = allow_patches

    def find(self, module: AsmModule) -> list[Finding]:
        references_by_label = collect_label_references(module)
        project_usage = (module.metadata or {}).get("project_usage")
        state_machine_runtime = (
            project_usage.get("stateMachineRuntime")
            if isinstance(project_usage, dict) and isinstance(project_usage.get("stateMachineRuntime"), dict)
            else None
        )
        action_ids = numeric_id_set(state_machine_runtime.get("usedActionIds")) if state_machine_runtime else None
        condition_ids = numeric_id_set(state_machine_runtime.get("usedConditionIds")) if state_machine_runtime else None
        findings: list[Finding] = []
        dispatch_specs = (
            ("Action_", "SM_ActionTable", "action"),
            ("Condition_", "SM_ConditionTable", "condition"),
        )

        for routine in module.routines.values():
            dispatch_kind = ""
            dispatch_table = ""
            for prefix, table_name, kind in dispatch_specs:
                if routine.name.startswith(prefix):
                    dispatch_table = table_name
                    dispatch_kind = kind
                    break
            if not dispatch_table:
                continue

            table_refs = [
                reference
                for reference in references_by_label.get(routine.name, [])
                if reference.source_label == dispatch_table
            ]
            if not table_refs:
                continue
            direct_refs = [
                reference
                for reference in references_by_label.get(routine.name, [])
                if reference.source_label not in {dispatch_table, routine.name}
            ]
            table_sample = ", ".join(
                f"{reference.source_label}@{reference.line}: `{reference.raw}`"
                for reference in table_refs[:3]
            )
            direct_note = "none"
            if direct_refs:
                direct_note = ", ".join(
                    f"{reference.source_label}@{reference.line}"
                    for reference in direct_refs[:5]
                )
                if len(direct_refs) > 5:
                    direct_note += f", ... (+{len(direct_refs) - 5} more)"
            dispatch_id = first_state_machine_dispatch_id(table_refs, routine.name)
            metadata_note = state_machine_dispatch_metadata_note(
                dispatch_kind,
                dispatch_id,
                action_ids,
                condition_ids,
            )
            used_ids = action_ids if dispatch_kind == "action" else condition_ids
            patch = None
            patch_note = (
                "Patch policy: report-only because state-machine reachability is data-driven "
                "through action/condition ids, not direct calls."
            )
            if self.allow_patches:
                table_dispatch_ids = [
                    first_state_machine_dispatch_id([reference], routine.name)
                    for reference in table_refs
                ]
                all_dispatch_ids_unused = (
                    used_ids is not None
                    and all(item is not None for item in table_dispatch_ids)
                    and all(item not in used_ids for item in table_dispatch_ids if item is not None)
                )
                if used_ids is None:
                    patch_note = "Patch disabled because `project_usage.stateMachineRuntime` metadata is unavailable."
                elif not all_dispatch_ids_unused:
                    patch_note = "Patch disabled because one or more table dispatch ids are used or unknown."
                elif direct_refs:
                    patch_note = "Patch disabled because direct external references still exist."
                else:
                    patch_end_index = routine_deletion_end_index(routine)
                    if patch_window_contains_bank_equ(module.lines, routine.start_index, patch_end_index):
                        patch_note = "Patch disabled because the handler window contains a bank EQU marker."
                    else:
                        line_index_by_lineno = {line.lineno: index for index, line in enumerate(module.lines)}
                        group_id = f"runtime.state_machine.dispatch.{routine.name}"
                        table_patch_count = 0
                        table_findings: list[Finding] = []
                        for reference in table_refs:
                            table_index = line_index_by_lineno.get(reference.line)
                            entry_id = first_state_machine_dispatch_id([reference], routine.name)
                            if table_index is None or entry_id is None:
                                continue
                            table_patch_count += 1
                            table_findings.append(
                                Finding(
                                    rule_id=self.id,
                                    title="Unused state-machine dispatch table entry is patchable",
                                    routine=f"{routine.name}:table:{entry_id}",
                                    line_start=module.lines[table_index].lineno,
                                    line_end=module.lines[table_index].lineno,
                                    summary=(
                                        f"`{routine.name}` dispatch id {entry_id} is unused by metadata, "
                                        "so the dispatch table entry is replaced with `DW 0` together "
                                        "with the handler body removal."
                                    ),
                                    patch=Patch(
                                        start_index=table_index,
                                        end_index=table_index + 1,
                                        replacement_lines=[f"    DW 0 ; {entry_id} unused {routine.name}"],
                                        reason=f"Disable unused state-machine dispatch entry for `{routine.name}`.",
                                        group_id=group_id,
                                    ),
                                )
                            )
                        if table_patch_count == len(table_refs):
                            findings.extend(table_findings)
                            patch = make_patch_for_absolute_window(
                                routine.start_index,
                                patch_end_index,
                                f"Remove unused state-machine {dispatch_kind} handler `{routine.name}`.",
                                group_id=group_id,
                            )
                            patch_note = (
                                "Patch enabled: all dispatch table ids for this handler are unused by "
                                "project_usage metadata and there are no direct external references."
                            )
                        else:
                            patch_note = "Patch disabled because not every table reference could be mapped to a line."
            findings.append(
                Finding(
                    rule_id=self.id,
                    title="State-machine handler is table-dispatched",
                    routine=routine.name,
                    line_start=module.lines[routine.start_index].lineno,
                    line_end=module.lines[routine.end_index - 1].lineno,
                    summary=(
                        f"`{routine.name}` is a state-machine {dispatch_kind} handler referenced by "
                        f"`{dispatch_table}` ({len(table_refs)} table reference(s): {table_sample}). "
                        f"Direct external references: {direct_note}. {metadata_note} "
                        f"{patch_note}"
                    ),
                    patch=patch,
                )
            )
        return findings


RULES: dict[str, Rule] = {
    "active-list-redundant-screen-check": ActiveListRedundantScreenCheckRule(),
    "active-list-redundant-active-check": ActiveListRedundantActiveCheckRule(),
    "hud-double-work": HudDoubleWorkRule(),
    "deadly-recompute-in-tile-interaction": DeadlyRecomputeRule(),
    "dead-blocks": DeadBlocksRule(allow_patches=False),
    "unused-runtime-labels": UnusedRuntimeLabelsRule(),
    "unused-boss-attack-runtime": UnusedBossAttackRuntimeRule(),
    "unused-component-runtime": UnusedComponentRuntimeRule(),
    "inactive-feature-runtime": InactiveFeatureRuntimeRule(),
    "state-machine-dispatch-handlers": StateMachineDispatchHandlersRule(),
    "unused-screen-loaders": UnusedScreenLoadersRule(),
}

DEFAULT_APPLY_RULE_IDS: tuple[str, ...] = (
    "dead-blocks",
    "unused-screen-loaders",
    "inactive-feature-runtime",
    "unused-boss-attack-runtime",
    "unused-component-runtime",
    "state-machine-dispatch-handlers",
)

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


def validate_transformed_module(
    original: AsmModule,
    transformed_lines: list[str],
    allowed_missing_global_labels: set[str] | None = None,
) -> list[str]:
    errors: list[str] = []
    transformed = build_module(original.path, transformed_lines)
    if transformed.duplicate_labels:
        errors.append(f"Duplicate labels after transform: {', '.join(sorted(set(transformed.duplicate_labels)))}")

    original_global = {name for name in original.label_to_line if not name.startswith(".")}
    transformed_global = {name for name in transformed.label_to_line if not name.startswith(".")}
    missing = sorted((original_global - transformed_global) - (allowed_missing_global_labels or set()))
    if missing:
        sample = ", ".join(missing[:12])
        suffix = "" if len(missing) <= 12 else f" ... (+{len(missing) - 12} more)"
        errors.append(f"Missing global labels after transform: {sample}{suffix}")
    return errors


def block_for_index(module: AsmModule, index: int) -> AsmBlock | None:
    for block in module.blocks:
        if block.start_index <= index < block.end_index:
            return block
    return None


def block_line_count(block: AsmBlock) -> int:
    return max(0, block.end_index - block.start_index)


def block_source_bytes(module: AsmModule, block: AsmBlock) -> int:
    return sum(len(line.raw) + 1 for line in module.lines[block.start_index:block.end_index])


def code_text_for_reference_scan(line: AsmLine) -> str:
    if line.kind not in {"instr", "directive"}:
        return ""
    if line.opcode is None:
        return ""
    parts: list[str] = []
    if line.operands:
        parts.append(line.operands)
    return " ".join(parts)


def collect_label_references(module: AsmModule) -> dict[str, list[LabelReference]]:
    global_labels = {label for label in module.label_to_line if not label.startswith(".")}
    references: dict[str, list[LabelReference]] = {label: [] for label in global_labels}
    if not global_labels:
        return references
    block_by_id = {block.id: block for block in module.blocks}

    for index, line in enumerate(module.lines):
        text = code_text_for_reference_scan(line)
        if not text:
            continue
        source_block = block_for_index(module, index)
        source_label = find_parent_label(module, index)
        for token in ASM_TOKEN_RE.findall(text):
            if token not in global_labels:
                continue
            references[token].append(
                LabelReference(
                    label=token,
                    line=line.lineno,
                    source_block_id=source_block.id if source_block else None,
                    source_label=source_label,
                    raw=line.raw.strip(),
                )
            )

    for block in module.blocks:
        for dep in block.deps:
            target_labels: list[str] = []
            if dep in global_labels:
                target_labels.append(dep)
            target_block = block_by_id.get(dep)
            if target_block:
                target_labels.extend(target_block.labels)
            for label in sorted(set(target_labels)):
                references[label].append(
                    LabelReference(
                        label=label,
                        line=block.start_line,
                        source_block_id=block.id,
                        source_label=block.labels[0] if block.labels else block.id,
                        raw=f"@mideas:block deps={dep}",
                    )
                )
    return references


def analyze_blocks(module: AsmModule) -> list[BlockAnalysis]:
    references_by_label = collect_label_references(module)
    analyses: list[BlockAnalysis] = []
    for block in module.blocks:
        block_labels = set(block.labels)
        incoming: list[LabelReference] = []
        for label in block.labels:
            for reference in references_by_label.get(label, []):
                if reference.source_block_id == block.id:
                    continue
                incoming.append(reference)

        incoming.sort(key=lambda reference: (reference.line, reference.label, reference.source_label))
        roots = block.roots
        if block.preserve:
            status = "preserved"
            candidate = False
            reason = "Block has preserve=true."
        elif roots:
            status = "rooted"
            candidate = False
            reason = f"Block declares root tags: {', '.join(roots)}."
        elif incoming:
            status = "referenced"
            candidate = False
            reason = f"Block has {len(incoming)} external label reference(s)."
        elif not block_labels:
            status = "empty"
            candidate = False
            reason = "Block has no global labels to prove reachability."
        else:
            status = "candidate_unreferenced"
            candidate = True
            reason = "No external references found for any global label in this block."

        analyses.append(
            BlockAnalysis(
                block_id=block.id,
                status=status,
                incoming_references=incoming,
                external_reference_count=len(incoming),
                line_count=block_line_count(block),
                source_bytes=block_source_bytes(module, block),
                candidate=candidate,
                reason=reason,
            )
        )
    return analyses


def serialize_label_reference(reference: LabelReference) -> dict:
    return {
        "label": reference.label,
        "line": reference.line,
        "source_block_id": reference.source_block_id,
        "source_label": reference.source_label,
        "raw": reference.raw,
    }


def serialize_block_analysis(analysis: BlockAnalysis) -> dict:
    return {
        "block_id": analysis.block_id,
        "status": analysis.status,
        "candidate": analysis.candidate,
        "reason": analysis.reason,
        "external_reference_count": analysis.external_reference_count,
        "line_count": analysis.line_count,
        "source_bytes": analysis.source_bytes,
        "incoming_references": [
            serialize_label_reference(reference)
            for reference in analysis.incoming_references[:50]
        ],
        "incoming_reference_truncated": max(0, len(analysis.incoming_references) - 50),
    }


def serialize_block(block: AsmBlock) -> dict:
    data = {
        "id": block.id,
        "kind": block.kind,
        "owner": block.owner,
        "preserve": block.preserve,
        "start_line": block.start_line,
        "end_line": block.end_line,
        "line_count": block_line_count(block),
        "labels": block.labels,
        "deps": block.deps,
        "roots": block.roots,
        "attrs": dict(block.attrs),
    }
    if block.bank is not None:
        data["bank"] = block.bank
    return data


def build_block_metrics(module: AsmModule, block_analysis: list[BlockAnalysis]) -> dict:
    by_kind: dict[str, int] = {}
    by_owner: dict[str, int] = {}
    by_status: dict[str, int] = {}
    analysis_by_block = {analysis.block_id: analysis for analysis in block_analysis}
    preserved = 0
    total_lines = 0
    total_source_bytes = 0
    for block in module.blocks:
        by_kind[block.kind] = by_kind.get(block.kind, 0) + 1
        by_owner[block.owner] = by_owner.get(block.owner, 0) + 1
        total_lines += block_line_count(block)
        total_source_bytes += block_source_bytes(module, block)
        if block.preserve:
            preserved += 1
    for analysis in block_analysis:
        by_status[analysis.status] = by_status.get(analysis.status, 0) + 1
    candidate_lines = sum(analysis.line_count for analysis in block_analysis if analysis.candidate)
    candidate_source_bytes = sum(analysis.source_bytes for analysis in block_analysis if analysis.candidate)
    largest_blocks = []
    for block in module.blocks:
        analysis = analysis_by_block.get(block.id)
        largest_blocks.append(
            {
                "id": block.id,
                "kind": block.kind,
                "owner": block.owner,
                "status": analysis.status if analysis else "unknown",
                "line_count": analysis.line_count if analysis else block_line_count(block),
                "source_bytes": analysis.source_bytes if analysis else block_source_bytes(module, block),
            }
        )
    largest_blocks.sort(key=lambda item: (item["source_bytes"], item["line_count"], item["id"]), reverse=True)
    return {
        "count": len(module.blocks),
        "preserved": preserved,
        "removable": len(module.blocks) - preserved,
        "dead_block_candidates": sum(1 for analysis in block_analysis if analysis.candidate),
        "total_lines": total_lines,
        "total_source_bytes": total_source_bytes,
        "dead_candidate_lines": candidate_lines,
        "dead_candidate_source_bytes": candidate_source_bytes,
        "by_kind": dict(sorted(by_kind.items())),
        "by_owner": dict(sorted(by_owner.items())),
        "by_status": dict(sorted(by_status.items())),
        "largest_blocks": largest_blocks[:20],
        "errors": list(module.block_errors),
    }


def routine_line_count(routine: Routine) -> int:
    return max(0, routine.end_index - routine.start_index)


def routine_source_bytes(routine: Routine) -> int:
    return sum(len(line.raw) + 1 for line in routine.lines)


def routine_instruction_count(routine: Routine) -> int:
    return sum(1 for line in routine.lines if line.kind == "instr")


def routine_directive_count(routine: Routine) -> int:
    return sum(1 for line in routine.lines if line.kind == "directive")


def classify_global_label(routine: Routine) -> tuple[str, str]:
    name = routine.name
    lower = name.lower()
    instr_count = routine_instruction_count(routine)
    directive_count = routine_directive_count(routine)

    if name.startswith("FAST_") or lower in {"vdploop"} or lower.startswith(("bios_", "bdos_")):
        return "bios_helper", "BIOS/direct hardware helper label"
    if re.match(r"^(BANK_\d+_|FAR_BANK_\d+_)", name):
        return "bank_marker", "MegaROM bank boundary or far-bank marker"
    if instr_count == 0 and directive_count > 0:
        return "data", "Directive-only label"
    if lower.startswith("presentation_screen_") or lower == "screen_runtime_summary_table":
        return "data", "Generated screen data table"
    if lower.startswith("sm_") and lower.endswith("table"):
        return "data", "State-machine runtime table"
    if lower in {"print_string_loop", "print_string_end"}:
        return "runtime_inner_label", "Internal print_string_screen2 loop label"
    if re.match(r"^check_transition_.*_(apply|skip)_(east|west|north|south)$", lower):
        return "runtime_inner_label", "Generated world-transition internal branch label"
    if re.match(r"^[A-Z0-9_]+_LAYER[0-9]+$", name):
        return "data", "Sprite frame layer data label"
    if any(token in lower for token in ("tilebank_", "tile_pattern", "tile_color", "sprite_pattern", "font_pattern")):
        return "data", "Asset/data table naming"
    if lower.startswith("sprite_") and any(lower.endswith(suffix) for suffix in ("_pattern", "_patterns", "_color", "_colors")):
        return "data", "Asset/data table naming"
    if lower.startswith("load_screen_"):
        return "screen_loader", "Generated screen loader routine"
    if lower.startswith(("boot", "restart_", "init_", "main")):
        return "boot_or_init", "Boot/init routine"
    if lower.endswith("_far") or (lower.startswith("call_") and lower.endswith("_resident")):
        return "far_trampoline", "MegaROM far-call or resident-call trampoline"
    if lower.startswith(("mapper_", "page0_", "resource_", "dzx0_", "interrupt_")) or lower in {
        "stop_interrupt_system",
        "enable_interrupt_system",
        "disable_interrupt_system",
        "get_frame_count",
        "disable_task",
        "enable_task",
    } or lower.startswith("task_"):
        return "shared_runtime", "Shared low-level runtime helper"
    if instr_count > 0:
        return "runtime_code", "Instruction-bearing runtime label"
    return "unknown", "No category heuristic matched"


def normalize_screen_loader_token(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return re.sub(r"_+", "_", normalized)


def screen_loader_base_name(label: str) -> str | None:
    lower = label.lower()
    if not lower.startswith("load_screen_"):
        return None
    if lower.endswith("_far"):
        lower = lower[:-4]
    return lower


def collect_screen_loader_metadata(module: AsmModule) -> dict[str, dict]:
    metadata = module.metadata or {}
    scenes = []
    project_usage = metadata.get("project_usage")
    reachability_by_id: dict[str, dict] = {}
    if isinstance(project_usage, dict) and isinstance(project_usage.get("scenes"), list):
        scenes.extend(scene for scene in project_usage["scenes"] if isinstance(scene, dict))
        reachability = project_usage.get("gameFlowReachability")
        if isinstance(reachability, dict) and isinstance(reachability.get("scenes"), list):
            for scene in reachability["scenes"]:
                if isinstance(scene, dict) and scene.get("id") is not None:
                    reachability_by_id[str(scene.get("id"))] = scene
    load_plan = metadata.get("load_plan")
    if isinstance(load_plan, dict) and isinstance(load_plan.get("scenes"), list):
        existing_by_id = {
            str(scene.get("id")): scene
            for scene in scenes
            if scene.get("id") is not None
        }
        for scene in load_plan["scenes"]:
            if not isinstance(scene, dict):
                continue
            scene_id = str(scene.get("id"))
            if scene_id in existing_by_id:
                existing = existing_by_id[scene_id]
                for key in ("resourceCount", "totalStoredBytes", "totalRawBytes"):
                    if existing.get(key) is None and scene.get(key) is not None:
                        existing[key] = scene.get(key)
                continue
            scenes.append(scene)

    by_loader: dict[str, dict] = {}
    for scene in scenes:
        raw_id = str(scene.get("id") or "")
        raw_name = str(scene.get("name") or "")
        index = scene.get("index")
        reachability = reachability_by_id.get(raw_id, {})
        candidates: set[str] = set()
        if raw_id.startswith("screenmap_"):
            raw_screen_id = raw_id[len("screenmap_"):]
            candidates.add(f"load_screen_{raw_screen_id}")
            if len(raw_screen_id) > 1 and raw_screen_id.isdigit():
                candidates.add(f"load_screen_{raw_screen_id[1:]}")
                if raw_name:
                    candidates.add(f"load_screen_{normalize_screen_loader_token(raw_name)}_{raw_screen_id[1:]}")
        if raw_name and index is not None:
            candidates.add(f"load_screen_{normalize_screen_loader_token(raw_name)}_{index}")
        if raw_name:
            candidates.add(f"load_screen_{normalize_screen_loader_token(raw_name)}")

        record = {
            "id": raw_id,
            "name": raw_name,
            "index": index,
            "resourceCount": scene.get("resourceCount"),
            "totalStoredBytes": scene.get("totalStoredBytes"),
            "totalRawBytes": scene.get("totalRawBytes"),
            "reachable": reachability.get("reachable"),
            "reachabilityReason": reachability.get("reason"),
            "reachabilitySources": reachability.get("sources"),
        }
        for candidate in candidates:
            by_loader[candidate] = record
    return by_loader


def build_routine_metrics(module: AsmModule) -> dict:
    block_by_label = {
        label: block.id
        for block in module.blocks
        for label in block.labels
    }
    largest_routines = []
    by_category: dict[str, dict[str, int]] = {}
    for routine in module.routines.values():
        category, category_reason = classify_global_label(routine)
        line_count = routine_line_count(routine)
        source_bytes = routine_source_bytes(routine)
        block_id = block_by_label.get(routine.name)
        bucket = by_category.setdefault(
            category,
            {
                "count": 0,
                "line_count": 0,
                "source_bytes": 0,
                "unannotated_count": 0,
                "unannotated_line_count": 0,
                "unannotated_source_bytes": 0,
            },
        )
        bucket["count"] += 1
        bucket["line_count"] += line_count
        bucket["source_bytes"] += source_bytes
        if block_id is None:
            bucket["unannotated_count"] += 1
            bucket["unannotated_line_count"] += line_count
            bucket["unannotated_source_bytes"] += source_bytes
        largest_routines.append(
            {
                "name": routine.name,
                "line_count": line_count,
                "source_bytes": source_bytes,
                "block_id": block_id,
                "category": category,
                "category_reason": category_reason,
            }
        )
    largest_routines.sort(key=lambda item: (item["source_bytes"], item["line_count"], item["name"]), reverse=True)
    largest_unannotated = [item for item in largest_routines if item.get("block_id") is None]
    largest_unannotated_by_category: dict[str, list[dict]] = {}
    for item in largest_unannotated:
        largest_unannotated_by_category.setdefault(str(item["category"]), []).append(item)
    return {
        "count": len(module.routines),
        "unannotated_count": len(largest_unannotated),
        "by_category": dict(sorted(by_category.items())),
        "largest_routines": largest_routines[:30],
        "largest_unannotated_labels": largest_unannotated[:30],
        "largest_unannotated_by_category": {
            category: items[:10]
            for category, items in sorted(largest_unannotated_by_category.items())
        },
    }


def build_metrics(
    module: AsmModule,
    output_line_count: int,
    findings: list[Finding],
    applied_count: int,
    block_analysis: list[BlockAnalysis],
    optimization_passes: list[dict] | None = None,
    removed_labels: set[str] | None = None,
    selected_rule_ids: list[str] | None = None,
) -> dict:
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
            bucket["removed_lines"] += patch_removed_line_count(finding.patch)
            bucket.setdefault("removed_source_bytes", 0)
            bucket["removed_source_bytes"] += patch_removed_source_bytes(module.lines, finding.patch)

    normalized = {}
    for rule_id, bucket in by_rule.items():
        normalized[rule_id] = {
            "findings": bucket["findings"],
            "patchable": bucket["patchable"],
            "routines": sorted(bucket["routines"]),
            "removed_lines": bucket["removed_lines"],
            "removed_source_bytes": bucket.get("removed_source_bytes", 0),
        }

    pass_metrics = optimization_passes or []
    optimization_summary = {
        "passes_run": len(pass_metrics),
        "removed_lines": sum(pass_info.get("removed_lines", 0) for pass_info in pass_metrics),
        "removed_source_bytes": sum(pass_info.get("removed_source_bytes", 0) for pass_info in pass_metrics),
        "removed_labels": sorted(removed_labels or set()),
    }

    return {
        "original_line_count": len(module.lines),
        "output_line_count": output_line_count,
        "net_line_delta": output_line_count - len(module.lines),
        "applied_patches": applied_count,
        "selected_rules": list(selected_rule_ids or []),
        "by_rule": normalized,
        "inactive_feature_runtime": build_inactive_feature_metrics(module, findings),
        "block_inventory": build_block_metrics(module, block_analysis),
        "routine_inventory": build_routine_metrics(module),
        "optimization_passes": pass_metrics,
        "optimization_summary": optimization_summary,
        "removed_labels": sorted(removed_labels or set()),
    }


def build_inactive_feature_metrics(module: AsmModule, findings: list[Finding]) -> dict:
    block_by_label = {
        label: block
        for block in module.blocks
        for label in block.labels
    }
    by_feature: dict[str, dict] = {}

    for finding in findings:
        if finding.rule_id != "inactive-feature-runtime":
            continue
        if finding.title != "Runtime label belongs to an inactive project feature":
            continue

        feature_name = ""
        for family in FEATURE_RUNTIME_FAMILIES:
            if matches_feature_family(finding.routine, family):
                feature_name = str(family["feature"])
                break
        if not feature_name:
            continue

        bucket = by_feature.setdefault(
            feature_name,
            {
                "findings": 0,
                "patchable": 0,
                "report_only": 0,
                "annotated": 0,
                "unannotated": 0,
                "preserved": 0,
                "owners": {},
                "routines": set(),
            },
        )
        bucket["findings"] += 1
        bucket["routines"].add(finding.routine)
        if finding.patchable:
            bucket["patchable"] += 1
        else:
            bucket["report_only"] += 1

        block = block_by_label.get(finding.routine)
        if block is None:
            bucket["unannotated"] += 1
            continue
        bucket["annotated"] += 1
        if block.preserve:
            bucket["preserved"] += 1
        bucket["owners"][block.owner] = bucket["owners"].get(block.owner, 0) + 1

    normalized = {}
    for feature_name, bucket in sorted(by_feature.items()):
        normalized[feature_name] = {
            "findings": bucket["findings"],
            "patchable": bucket["patchable"],
            "report_only": bucket["report_only"],
            "annotated": bucket["annotated"],
            "unannotated": bucket["unannotated"],
            "preserved": bucket["preserved"],
            "owners": dict(sorted(bucket["owners"].items())),
            "routines": sorted(bucket["routines"]),
        }

    return {
        "total_findings": sum(bucket["findings"] for bucket in normalized.values()),
        "by_feature": normalized,
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


def build_markdown_report(
    path: Path,
    module: AsmModule,
    findings: list[Finding],
    applied_count: int,
    metrics: dict,
    block_analysis: list[BlockAnalysis],
) -> str:
    lines = [
        f"# Post-ASM Report",
        "",
        f"- Input: `{path}`",
        f"- Selected rules: {', '.join(metrics.get('selected_rules', [])) or 'none'}",
        f"- Findings: {len(findings)}",
        f"- Applied patches: {applied_count}",
        f"- Original lines: {metrics['original_line_count']}",
        f"- Output lines: {metrics['output_line_count']}",
        f"- Net line delta: {metrics['net_line_delta']}",
        "",
    ]
    optimization_summary = metrics.get("optimization_summary", {})
    if optimization_summary.get("passes_run", 0):
        lines.extend(
            [
                f"- Optimization passes run: {optimization_summary.get('passes_run', 0)}",
                (
                    "- Optimization source removed: "
                    f"{optimization_summary.get('removed_lines', 0)} lines / "
                    f"{optimization_summary.get('removed_source_bytes', 0)} bytes"
                ),
                "",
            ]
        )
    block_inventory = metrics.get("block_inventory", {})
    lines.extend(
        [
            "## Mideas Block Inventory",
            "",
            f"- Blocks: {block_inventory.get('count', 0)}",
            f"- Preserved blocks: {block_inventory.get('preserved', 0)}",
            f"- Removable-by-policy blocks: {block_inventory.get('removable', 0)}",
            f"- Dead-block candidates: {block_inventory.get('dead_block_candidates', 0)}",
            f"- Annotated block source: {block_inventory.get('total_lines', 0)} lines / {block_inventory.get('total_source_bytes', 0)} bytes",
            f"- Dead-candidate source: {block_inventory.get('dead_candidate_lines', 0)} lines / {block_inventory.get('dead_candidate_source_bytes', 0)} bytes",
            f"- Marker errors: {len(block_inventory.get('errors', []))}",
            "",
        ]
    )
    if block_inventory.get("by_kind"):
        by_kind = ", ".join(f"{kind}={count}" for kind, count in block_inventory["by_kind"].items())
        lines.append(f"- By kind: {by_kind}")
    if block_inventory.get("by_owner"):
        by_owner = ", ".join(f"{owner}={count}" for owner, count in block_inventory["by_owner"].items())
        lines.append(f"- By owner: {by_owner}")
    if block_inventory.get("by_status"):
        by_status = ", ".join(f"{status}={count}" for status, count in block_inventory["by_status"].items())
        lines.append(f"- By status: {by_status}")
    if block_inventory.get("by_kind") or block_inventory.get("by_owner") or block_inventory.get("by_status"):
        lines.append("")
    if block_inventory.get("largest_blocks"):
        lines.append("### Largest Annotated Blocks")
        lines.append("")
        lines.append("| ID | Status | Source | Kind | Owner |")
        lines.append("| --- | --- | --- | --- | --- |")
        for item in block_inventory["largest_blocks"][:20]:
            lines.append(
                f"| `{item.get('id', '')}` | `{item.get('status', 'unknown')}` | "
                f"{item.get('line_count', 0)}l/{item.get('source_bytes', 0)}b | "
                f"`{item.get('kind', 'unknown')}` | `{item.get('owner', 'unknown')}` |"
            )
        lines.append("")
    for error in block_inventory.get("errors", []):
        lines.append(f"- Marker error: {error}")
    if block_inventory.get("errors"):
        lines.append("")
    inactive_metrics = metrics.get("inactive_feature_runtime", {})
    inactive_by_feature = inactive_metrics.get("by_feature", {})
    if inactive_by_feature:
        lines.append("## Inactive Feature Runtime Inventory")
        lines.append("")
        lines.append("| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |")
        lines.append("| --- | ---: | ---: | ---: | ---: | ---: | --- |")
        for feature_name, item in inactive_by_feature.items():
            owners = ", ".join(
                f"{owner}={count}"
                for owner, count in item.get("owners", {}).items()
            ) or "-"
            lines.append(
                f"| `{feature_name}` | {item.get('findings', 0)} | {item.get('patchable', 0)} | "
                f"{item.get('annotated', 0)} | {item.get('unannotated', 0)} | "
                f"{item.get('preserved', 0)} | {owners} |"
            )
        lines.append("")
    routine_inventory = metrics.get("routine_inventory", {})
    if routine_inventory.get("largest_routines"):
        lines.append("## Global Label Inventory")
        lines.append("")
        lines.append(f"- Global labels: {routine_inventory.get('count', 0)}")
        lines.append("")
        lines.append("| Label | Category | Source |")
        lines.append("| --- | --- | --- |")
        for item in routine_inventory["largest_routines"][:30]:
            lines.append(
                f"| `{item.get('name', '')}` | `{item.get('category', 'unknown')}` | "
                f"{item.get('line_count', 0)}l/{item.get('source_bytes', 0)}b |"
            )
        lines.append("")
    if routine_inventory.get("largest_unannotated_labels"):
        lines.append("### Largest Unannotated Global Labels")
        lines.append("")
        lines.append(f"- Unannotated labels: {routine_inventory.get('unannotated_count', 0)}")
        lines.append("")
        if routine_inventory.get("by_category"):
            lines.append("| Category | Labels | Source |")
            lines.append("| --- | ---: | ---: |")
            for category, bucket in sorted(routine_inventory["by_category"].items()):
                if bucket.get("unannotated_count", 0) <= 0:
                    continue
                lines.append(
                    f"| `{category}` | {bucket.get('unannotated_count', 0)} | "
                    f"{bucket.get('unannotated_line_count', 0)}l/{bucket.get('unannotated_source_bytes', 0)}b |"
                )
            lines.append("")
        lines.append("| Label | Category | Source |")
        lines.append("| --- | --- | --- |")
        for item in routine_inventory["largest_unannotated_labels"][:30]:
            lines.append(
                f"| `{item.get('name', '')}` | `{item.get('category', 'unknown')}` | "
                f"{item.get('line_count', 0)}l/{item.get('source_bytes', 0)}b |"
            )
        lines.append("")
    if module.blocks:
        analysis_by_block = {analysis.block_id: analysis for analysis in block_analysis}
        lines.append("| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
        for block in module.blocks[:100]:
            labels = ", ".join(block.labels[:5])
            if len(block.labels) > 5:
                labels += f", ... (+{len(block.labels) - 5})"
            analysis = analysis_by_block.get(block.id)
            status = analysis.status if analysis else "unknown"
            incoming = analysis.external_reference_count if analysis else 0
            source = f"{analysis.line_count}l/{analysis.source_bytes}b" if analysis else "0l/0b"
            lines.append(
                f"| `{block.id}` | `{block.kind}` | `{block.owner}` | `{status}` | {incoming} | {source} | "
                f"{block.start_line}-{block.end_line} | {labels} |"
            )
        if len(module.blocks) > 100:
            lines.append(f"| ... | ... | ... | ... | ... | ... | ... | +{len(module.blocks) - 100} more blocks |")
        lines.append("")

    candidates = [analysis for analysis in block_analysis if analysis.candidate]
    if candidates:
        lines.append("## Dead-Block Candidates")
        lines.append("")
        for analysis in sorted(candidates, key=lambda item: (item.source_bytes, item.line_count, item.block_id), reverse=True)[:50]:
            lines.append(
                f"- `{analysis.block_id}`: {analysis.line_count} lines / {analysis.source_bytes} bytes. {analysis.reason}"
            )
        if len(candidates) > 50:
            lines.append(f"- ... +{len(candidates) - 50} more candidates")
        lines.append("")

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
        lines.append("No rule findings.")
        if metrics.get("optimization_passes"):
            lines.extend(["", "## Optimization Passes", ""])
            for pass_info in metrics["optimization_passes"]:
                lines.append(
                    f"- Pass {pass_info['pass']}: findings={pass_info['findings']}, "
                    f"patchable={pass_info['patchable']}, "
                    f"removed={pass_info.get('removed_lines', 0)} lines / "
                    f"{pass_info.get('removed_source_bytes', 0)} bytes, "
                    f"lines={pass_info.get('input_line_count', pass_info['output_line_count'])}->{pass_info['output_line_count']}"
                )
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
            lines.append(
                f"- Metrics: findings={rule_metrics['findings']}, "
                f"patchable={rule_metrics['patchable']}, "
                f"removed_lines={rule_metrics['removed_lines']}, "
                f"removed_source_bytes={rule_metrics.get('removed_source_bytes', 0)}"
            )
            lines.append(f"- Routines: {routines}")
            lines.append("")
        for finding in bucket:
            patch_note = "patchable" if finding.patchable else "report-only"
            lines.append(
                f"- [{patch_note}] `{finding.routine}` lines {finding.line_start}-{finding.line_end}: {finding.summary}"
            )
        lines.append("")
    if metrics.get("optimization_passes"):
        lines.append("## Optimization Passes")
        lines.append("")
        for pass_info in metrics["optimization_passes"]:
            lines.append(
                f"- Pass {pass_info['pass']}: findings={pass_info['findings']}, "
                f"patchable={pass_info['patchable']}, "
                f"removed={pass_info.get('removed_lines', 0)} lines / "
                f"{pass_info.get('removed_source_bytes', 0)} bytes, "
                f"lines={pass_info.get('input_line_count', pass_info['output_line_count'])}->{pass_info['output_line_count']}"
            )
        lines.append("")
    return "\n".join(lines) + "\n"


def build_json_report(
    path: Path,
    module: AsmModule,
    findings: list[Finding],
    applied_count: int,
    metrics: dict,
    block_analysis: list[BlockAnalysis],
) -> dict:
    return {
        "input": str(path),
        "metrics": metrics,
        "blocks": [serialize_block(block) for block in module.blocks],
        "block_analysis": [serialize_block_analysis(analysis) for analysis in block_analysis],
        "block_errors": list(module.block_errors),
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
                    "group_id": finding.patch.group_id,
                },
            }
            for finding in findings
        ],
        "applied_patches": applied_count,
    }


def apply_patches(lines: list[AsmLine], findings: list[Finding]) -> list[str]:
    patches = select_non_overlapping_patches([finding.patch for finding in findings if finding.patch is not None])
    if not patches:
        return [line.raw for line in lines]
    output = [line.raw for line in lines]
    for patch in patches:
        output[patch.start_index:patch.end_index] = patch.replacement_lines
    return output


def select_non_overlapping_patches(patches: list[Patch]) -> list[Patch]:
    if not patches:
        return []
    grouped: dict[str, list[Patch]] = {}
    ungrouped: list[Patch] = []
    for patch in patches:
        if patch.group_id:
            grouped.setdefault(patch.group_id, []).append(patch)
        else:
            ungrouped.append(patch)

    patch_groups: list[list[Patch]] = [[patch] for patch in ungrouped]
    patch_groups.extend(group for _group_id, group in sorted(grouped.items()))

    def group_sort_key(group: list[Patch]) -> tuple[int, int, str]:
        start = min(patch.start_index for patch in group)
        width = sum(patch.end_index - patch.start_index for patch in group)
        group_id = next((patch.group_id for patch in group if patch.group_id), "")
        return (start, -width, group_id or "")

    selected: list[Patch] = []
    for group in sorted(patch_groups, key=group_sort_key):
        group = sorted(group, key=lambda item: (item.start_index, item.end_index))
        if any(
            patch.start_index < other.end_index and patch.end_index > other.start_index
            for index, patch in enumerate(group)
            for other in group[index + 1:]
        ):
            raise RuntimeError("Overlapping patches detected inside atomic patch group; aborting apply.")

        contained_by_selected = [
            patch
            for patch in group
            if any(patch.start_index >= kept.start_index and patch.end_index <= kept.end_index for kept in selected)
        ]
        if contained_by_selected:
            # Atomic groups cannot be partially applied. If a broader selected patch
            # already covers every window, skip the group; otherwise keep the earlier
            # selection and skip the whole group.
            continue

        covered_selected = [
            kept
            for kept in selected
            if any(kept.start_index >= patch.start_index and kept.end_index <= patch.end_index for patch in group)
        ]
        remaining = [kept for kept in selected if kept not in covered_selected]
        if any(
            patch.start_index < kept.end_index and patch.end_index > kept.start_index
            for patch in group
            for kept in remaining
        ):
            raise RuntimeError("Overlapping patches detected; aborting apply.")
        selected = remaining + group
    return sorted(selected, key=lambda patch: patch.start_index, reverse=True)


def patch_removed_line_count(patch: Patch) -> int:
    return max(0, patch.end_index - patch.start_index - len(patch.replacement_lines))


def patch_removed_source_bytes(lines: list[AsmLine], patch: Patch) -> int:
    removed = sum(len(line.raw) + 1 for line in lines[patch.start_index:patch.end_index])
    replacement = sum(len(line) + 1 for line in patch.replacement_lines)
    return max(0, removed - replacement)


def collect_patch_metrics(lines: list[AsmLine], findings: list[Finding]) -> dict:
    patches = select_non_overlapping_patches([finding.patch for finding in findings if finding.patch is not None])
    return {
        "patchable": len(patches),
        "removed_lines": sum(patch_removed_line_count(patch) for patch in patches),
        "removed_source_bytes": sum(patch_removed_source_bytes(lines, patch) for patch in patches),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Post-process generated MSX ASM with conservative pattern rules.")
    parser.add_argument("--input", required=True, help="Input ASM path")
    parser.add_argument("--apply", action="store_true", help="Apply patchable rules and emit optimized ASM")
    parser.add_argument("--output", help="Output ASM path when --apply is set")
    parser.add_argument(
        "--rules",
        help=(
            "Comma-separated rule ids to enable (default: all in analysis mode; "
            "validated patchable rules in --apply mode)"
        ),
    )
    parser.add_argument("--report-json", help="Optional JSON report path")
    parser.add_argument("--report-md", help="Optional Markdown report path")
    parser.add_argument("--passes", type=int, default=1, help="Maximum optimization passes when --apply is set (default: 1)")
    parser.add_argument("--validate-glass", help="Optional glass.jar path to validate the optimized ASM")
    parser.add_argument("--validate-rom-output", help="Optional ROM output path used during Glass validation")
    return parser.parse_args()


def parse_rule_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def resolve_rules(
    raw: str | None,
    allow_dead_block_patches: bool = False,
    allow_screen_loader_patches: bool = False,
    allow_inactive_feature_patches: bool = False,
    allow_boss_attack_patches: bool = False,
    allow_component_runtime_patches: bool = False,
    allow_state_machine_dispatch_patches: bool = False,
) -> list[Rule]:
    if not raw:
        return list(RULES.values())
    selected: list[Rule] = []
    for item in parse_rule_ids(raw):
        rule = RULES.get(item)
        if rule is None:
            raise KeyError(f"Unknown rule: {item}")
        if item == "dead-blocks" and allow_dead_block_patches:
            selected.append(DeadBlocksRule(allow_patches=True))
            continue
        if item == "unused-screen-loaders" and allow_screen_loader_patches:
            selected.append(UnusedScreenLoadersRule(allow_patches=True))
            continue
        if item == "inactive-feature-runtime" and allow_inactive_feature_patches:
            selected.append(InactiveFeatureRuntimeRule(allow_patches=True, patch_features={"sounds"}))
            continue
        if item == "unused-boss-attack-runtime" and allow_boss_attack_patches:
            selected.append(UnusedBossAttackRuntimeRule(allow_patches=True))
            continue
        if item == "unused-component-runtime" and allow_component_runtime_patches:
            selected.append(UnusedComponentRuntimeRule(allow_patches=True))
            continue
        if item == "state-machine-dispatch-handlers" and allow_state_machine_dispatch_patches:
            selected.append(StateMachineDispatchHandlersRule(allow_patches=True))
            continue
        selected.append(rule)
    return selected


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def run_glass_validation(glass_jar: Path, asm_path: Path, rom_output: Path) -> tuple[bool, str]:
    ensure_parent(rom_output)
    command = ["java", "-jar", str(glass_jar), "-I", str(glass_jar.parent), str(asm_path), str(rom_output)]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = "\n".join(part for part in [result.stdout.strip(), result.stderr.strip()] if part).strip()
    return result.returncode == 0, output


def collect_rule_findings(module: AsmModule, rules: list[Rule]) -> list[Finding]:
    findings: list[Finding] = []
    for rule in rules:
        findings.extend(rule.find(module))
    findings = enforce_patch_whitelist(findings)
    findings.sort(key=lambda finding: (finding.line_start, finding.rule_id))
    return findings


def collect_allowed_removed_labels(module: AsmModule, findings: list[Finding]) -> set[str]:
    allowed_removed_labels: set[str] = set()
    block_by_id = {block.id: block for block in module.blocks}
    for finding in findings:
        if finding.patch is None:
            continue
        if finding.rule_id == "dead-blocks":
            block = block_by_id.get(finding.routine)
            if block:
                allowed_removed_labels.update(block.labels)
                continue
        for line in module.lines[finding.patch.start_index:finding.patch.end_index]:
            if line.label and not line.label.startswith("."):
                allowed_removed_labels.add(line.label)
        block = block_by_id.get(finding.routine)
        if block and block.start_index >= finding.patch.start_index and block.end_index <= finding.patch.end_index:
            allowed_removed_labels.update(block.labels)
    return allowed_removed_labels


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    if not input_path.exists():
        print(f"Input ASM not found: {input_path}", file=sys.stderr)
        return 2
    if args.validate_glass and not args.apply:
        print("--validate-glass requires --apply.", file=sys.stderr)
        return 2
    if args.passes < 1:
        print("--passes must be >= 1.", file=sys.stderr)
        return 2

    requested_rule_ids = parse_rule_ids(args.rules)
    effective_rules_raw = args.rules
    if args.apply and not requested_rule_ids:
        requested_rule_ids = list(DEFAULT_APPLY_RULE_IDS)
        effective_rules_raw = ",".join(DEFAULT_APPLY_RULE_IDS)
    allow_dead_block_patches = args.apply and "dead-blocks" in requested_rule_ids
    allow_screen_loader_patches = args.apply and "unused-screen-loaders" in requested_rule_ids
    allow_inactive_feature_patches = args.apply and "inactive-feature-runtime" in requested_rule_ids
    allow_boss_attack_patches = args.apply and "unused-boss-attack-runtime" in requested_rule_ids
    allow_component_runtime_patches = args.apply and "unused-component-runtime" in requested_rule_ids
    allow_state_machine_dispatch_patches = args.apply and "state-machine-dispatch-handlers" in requested_rule_ids
    try:
        rules = resolve_rules(
            effective_rules_raw,
            allow_dead_block_patches=allow_dead_block_patches,
            allow_screen_loader_patches=allow_screen_loader_patches,
            allow_inactive_feature_patches=allow_inactive_feature_patches,
            allow_boss_attack_patches=allow_boss_attack_patches,
            allow_component_runtime_patches=allow_component_runtime_patches,
            allow_state_machine_dispatch_patches=allow_state_machine_dispatch_patches,
        )
    except KeyError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    module = parse_module(input_path)
    findings = collect_rule_findings(module, rules)
    block_analysis = analyze_blocks(module)

    applied_count = 0
    output_line_count = len(module.lines)
    output_path: Path | None = None
    original_rom_metrics: dict | None = None
    optimized_rom_metrics: dict | None = None
    optimization_passes: list[dict] = []
    removed_labels: set[str] = set()
    if args.apply:
        output_path = (
            Path(args.output).expanduser().resolve()
            if args.output
            else input_path.with_suffix(".optimized.asm")
        )
        ensure_parent(output_path)
        optimized_lines = [line.raw for line in module.lines]
        for pass_index in range(args.passes):
            pass_module = build_module(input_path, optimized_lines, metadata=module.metadata)
            pass_findings = collect_rule_findings(pass_module, rules)
            patch_metrics = collect_patch_metrics(pass_module.lines, pass_findings)
            patchable_count = patch_metrics["patchable"]
            if patchable_count == 0:
                optimization_passes.append(
                    {
                        "pass": pass_index + 1,
                        "findings": len(pass_findings),
                        "patchable": 0,
                        "removed_lines": 0,
                        "removed_source_bytes": 0,
                        "removed_labels": [],
                        "input_line_count": len(optimized_lines),
                        "output_line_count": len(optimized_lines),
                    }
                )
                break

            next_lines = apply_patches(pass_module.lines, pass_findings)
            pass_removed_labels = collect_allowed_removed_labels(pass_module, pass_findings)
            validation_errors = validate_transformed_module(
                pass_module,
                next_lines,
                allowed_missing_global_labels=pass_removed_labels,
            )
            if validation_errors:
                for error in validation_errors:
                    print(f"Validation error: {error}", file=sys.stderr)
                return 1

            optimized_lines = next_lines
            applied_count += patchable_count
            removed_labels.update(pass_removed_labels)
            optimization_passes.append(
                {
                    "pass": pass_index + 1,
                    "findings": len(pass_findings),
                    "patchable": patchable_count,
                    "removed_lines": patch_metrics["removed_lines"],
                    "removed_source_bytes": patch_metrics["removed_source_bytes"],
                    "removed_labels": sorted(pass_removed_labels),
                    "input_line_count": len(pass_module.lines),
                    "output_line_count": len(optimized_lines),
                }
            )
        output_path.write_text("\n".join(optimized_lines) + "\n", encoding="utf-8")
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

    metrics = build_metrics(
        module,
        output_line_count,
        findings,
        applied_count,
        block_analysis,
        optimization_passes,
        removed_labels=removed_labels,
        selected_rule_ids=[rule.id for rule in rules],
    )
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

    report_md_path.write_text(
        build_markdown_report(input_path, module, findings, applied_count, metrics, block_analysis),
        encoding="utf-8",
    )
    report_json_path.write_text(
        json.dumps(build_json_report(input_path, module, findings, applied_count, metrics, block_analysis), indent=2),
        encoding="utf-8",
    )

    print(f"Findings: {len(findings)}")
    print(f"Mideas blocks: {len(module.blocks)}")
    block_inventory = metrics.get("block_inventory", {})
    print(
        "Dead-block candidates: "
        f"{block_inventory.get('dead_block_candidates', 0)} "
        f"({block_inventory.get('dead_candidate_lines', 0)} lines, "
        f"{block_inventory.get('dead_candidate_source_bytes', 0)} source bytes)"
    )
    if module.block_errors:
        print(f"Mideas block marker errors: {len(module.block_errors)}")
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
