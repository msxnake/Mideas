#!/usr/bin/env python3
import argparse
from contextlib import contextmanager
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


ZX0_VRAM_TRANSFER_BUFFER_SIZE = 1488
ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES = 256
VRAM_RESOURCE_TYPE_MARKERS = (
    "PATTERN",
    "COLOR",
    "NAMETBL",
    "NAME_TABLE",
    "SCREEN_LAYOUT",
)


def _bank_metadata_checksum(parts: list[object]) -> str:
    """Return the stable FNV-1a checksum used to detect generated artifact drift."""
    checksum = 0x811C9DC5
    text = "|".join("" if part is None else str(part) for part in parts)
    for char in text:
        checksum ^= ord(char)
        checksum = (checksum * 0x01000193) & 0xFFFFFFFF
    return f"fnv1a32:{checksum:08X}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate unifiedFiles.asm from a Mideas JSON project, compile with glass.jar, "
            "and pad ROM size to a multiple of 8KB."
        )
    )
    parser.add_argument("--json", required=True, help="Path to Mideas project JSON")
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument("--project-name", help="Override project name")
    parser.add_argument("--asm-output", help="Output .asm path (default: server/temp/<name>.asm)")
    parser.add_argument("--rom-output", help="Output .rom path (default: server/temp/<name>.rom)")
    parser.add_argument("--sym-output", help="Optional Glass symbols output path")
    parser.add_argument("--glass", help="Explicit path to glass.jar")
    parser.add_argument(
        "--ts-build-dir",
        help="Directory for temporary compiled generator JS (default: unique OS temp dir; with --skip-ts-build default is server/temp/tsbuild_skill)",
    )
    parser.add_argument(
        "--skip-ts-build",
        action="store_true",
        help="Skip TypeScript compilation and reuse existing generated JS",
    )
    parser.add_argument(
        "--allow-tsc-errors",
        action="store_true",
        help="Continue even if tsc reports diagnostics. By default, generator TypeScript must compile cleanly.",
    )
    parser.add_argument(
        "--rom-mode",
        choices=["auto", "simple32k", "plain48k", "megarom"],
        default="simple32k",
        help="ROM mode passed to utils/msxGenerator (default: simple32k; plain48k is experimental)",
    )
    parser.add_argument(
        "--target-format",
        choices=["konami", "ascii8", "ascii16"],
        default="konami",
        help="Mapper target passed to utils/msxGenerator (default: konami)",
    )
    parser.add_argument(
        "--execution-mode",
        choices=["gameLoopHalt", "interruptTaskManager"],
        default="interruptTaskManager",
        help="Engine execution mode passed to utils/msxGenerator (default: interruptTaskManager)",
    )
    parser.add_argument(
        "--auto-megarom",
        action="store_true",
        help="Enable autoMegaROM in generator config",
    )
    parser.add_argument(
        "--enable-hard-player-tick",
        action="store_true",
        help=(
            "Enable interruptConfig.enableHardPlayerTick for generated ASM. "
            "Useful for opt-in VBlank Player realtime pipeline smoke tests "
            "without editing the source project JSON."
        ),
    )
    parser.add_argument(
        "--run-openmsx",
        action="store_true",
        help="Launch OpenMSX with generated ROM",
    )
    parser.add_argument(
        "--openmsx-smoke",
        action="store_true",
        help="Run a deterministic OpenMSX debug smoke with register probes and screenshots",
    )
    parser.add_argument(
        "--openmsx-smoke-require-movement",
        action="store_true",
        help="Make --openmsx-smoke fail if cursor input does not move the probed player sprite",
    )
    parser.add_argument(
        "--openmsx-smoke-no-forced-romtype",
        action="store_true",
        help="Run --openmsx-smoke without passing -romtype, so OpenMSX auto-detects the ROM mapper",
    )
    parser.add_argument("--openmsx-path", help="Explicit openmsx executable path")
    parser.add_argument(
        "--openmsx-timeout",
        type=float,
        default=35.0,
        help="Seconds to wait for --openmsx-smoke before killing OpenMSX (default: 35)",
    )
    parser.add_argument(
        "--post-asm-opt",
        action="store_true",
        help="Run scripts/post_asm_optimize.py after generating ASM and before Glass compilation",
    )
    parser.add_argument(
        "--post-asm-check-only",
        action="store_true",
        help="Run the post-ASM optimizer in analysis mode only; compile the original ASM",
    )
    parser.add_argument(
        "--post-asm-rules",
        help=(
            "Optional comma-separated rule ids for post_asm_optimize.py "
            "(default: all in check-only mode, validated patchable rules in --post-asm-opt mode)"
        ),
    )
    parser.add_argument(
        "--post-asm-output",
        help="Explicit optimized ASM output path (default: <asm>.optimized.asm)",
    )
    parser.add_argument(
        "--post-asm-passes",
        type=int,
        default=1,
        help="Maximum post-ASM optimization passes when --post-asm-opt applies changes (default: 1)",
    )
    parser.add_argument(
        "--strict-post-asm-no-dead-blocks",
        action="store_true",
        help=(
            "Fail after post-ASM analysis if the ASM selected for compilation still "
            "contains annotated dead-block candidates."
        ),
    )
    parser.add_argument(
        "--skip-zx0-preprocess",
        action="store_true",
        help="Skip server-side ZX0 preprocessing and compile the raw unified ASM",
    )
    parser.add_argument(
        "--strict-p3-data-window",
        action="store_true",
        help=(
            "Fail Konami MegaROM validation if resident code still occupies "
            "#A000-#BFFF; use this to enforce the paper's P3 data-only target."
        ),
    )
    parser.add_argument(
        "--strict-vram-staging",
        action="store_true",
        help=(
            "Fail Konami MegaROM validation if compressed VRAM resources exceed "
            "the RAM staging buffer and would use the slow direct-to-VRAM ZX0 path."
        ),
    )
    parser.add_argument(
        "--strict-tilebank-integrity",
        action="store_true",
        help=(
            "Fail MegaROM artifact validation if tilebank_integrity.json reports "
            "missing or out-of-range Screen 2 tile assignments."
        ),
    )
    parser.add_argument(
        "--strict-ascii16-runtime-layout",
        action="store_true",
        help=(
            "Fail ASCII16 MegaROM builds while segment_budget.json runtimeLayout "
            "reports lower-page code hazards or assembled resident overflow."
        ),
    )
    parser.add_argument(
        "--strict-ascii16-resident-free-bytes",
        type=int,
        default=0,
        help=(
            "Fail ASCII16 MegaROM builds when assembled resident code has fewer "
            "than this many free bytes in any resident window; 0 disables the gate."
        ),
    )
    parser.add_argument(
        "--strict-msx2-megarom-preflight-warnings",
        action="store_true",
        help=(
            "Fail MSX2 SCREEN 4 MegaROM builds before Glass when the generated "
            "ROM/RAM preflight contains warning or plan_b recommendations."
        ),
    )
    parser.add_argument(
        "--auto-resolve-msx2-budget",
        action="store_true",
        help=(
            "After an MSX2 SCREEN 4 MegaROM preflight failure, try safe automatic "
            "recovery passes before Glass, such as enabling ZX0 preprocessing when "
            "it was skipped or relaxing a strict warning-only gate. Enabled by "
            "default for MSX2 SCREEN 4 Konami MegaROM builds."
        ),
    )
    parser.add_argument(
        "--no-auto-resolve-msx2-budget",
        action="store_true",
        help="Disable the default safe MSX2 SCREEN 4 MegaROM budget resolver.",
    )
    parser.add_argument(
        "--msx2-budget-resolve-attempts",
        type=int,
        default=2,
        help="Maximum safe auto-resolve attempts for --auto-resolve-msx2-budget (default: 2).",
    )
    return parser.parse_args()


def run_command(cmd: list[str], cwd: Path, allow_failure: bool = False) -> subprocess.CompletedProcess:
    print("Running:", " ".join(str(c) for c in cmd))
    completed = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
    )

    def decode_stream(raw: bytes) -> str:
        if not raw:
            return ""
        try:
            return raw.decode("utf-8")
        except UnicodeDecodeError:
            return raw.decode("cp1252", errors="replace")

    stdout_text = decode_stream(completed.stdout)
    stderr_text = decode_stream(completed.stderr)

    def safe_write(text: str, is_err: bool = False) -> None:
        stream = sys.stderr if is_err else sys.stdout
        encoding = stream.encoding or "utf-8"
        stream.buffer.write((text + "\n").encode(encoding, errors="replace"))
        stream.flush()

    if stdout_text.strip():
        safe_write(stdout_text.strip())
    if stderr_text.strip():
        safe_write(stderr_text.strip(), is_err=True)

    if completed.returncode != 0 and not allow_failure:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(cmd)}")
    return completed


def resolve_existing(path_str: str, base: Path) -> Path:
    raw = Path(path_str).expanduser()
    candidates = [raw] if raw.is_absolute() else [base / raw, Path.cwd() / raw]
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved
    raise FileNotFoundError(f"File not found: {path_str}")


def resolve_glass(explicit: str | None, project_root: Path) -> Path:
    if explicit:
        glass = Path(explicit).expanduser().resolve()
        if not glass.exists():
            raise FileNotFoundError(f"glass.jar not found: {glass}")
        return glass

    candidates = [
        project_root / "server" / "glass.jar",
        project_root / "test" / "glass.jar",
        project_root / "server" / "glass-0.6.jar",
        project_root / "server" / "glass2.jar",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    raise FileNotFoundError("glass.jar not found in server/ or test/. Use --glass.")


def resolve_openmsx(explicit: str | None) -> str:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate.exists():
            return str(candidate)
        raise FileNotFoundError(f"OpenMSX not found: {candidate}")

    env_path = os.getenv("OPENMSX_PATH")
    if env_path:
        env_candidate = Path(env_path).expanduser().resolve()
        if env_candidate.exists():
            return str(env_candidate)

    default_candidates = [
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
    ]
    for candidate in default_candidates:
        if candidate.exists():
            return str(candidate.resolve())

    which = shutil.which("openmsx")
    if which:
        return which

    raise FileNotFoundError("OpenMSX executable not found. Use --openmsx-path.")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def extract_comment_artifacts(asm_text: str) -> dict[str, str]:
    artifacts: dict[str, list[str]] = {}
    current_name: str | None = None

    for raw_line in asm_text.splitlines():
        begin_match = re.match(r"^\s*;\s*\[\[\[MIDEAS_ARTIFACT:(.+?):BEGIN\]\]\]\s*$", raw_line)
        if begin_match:
            current_name = begin_match.group(1)
            artifacts[current_name] = []
            continue

        end_match = re.match(r"^\s*;\s*\[\[\[MIDEAS_ARTIFACT:(.+?):END\]\]\]\s*$", raw_line)
        if end_match:
            current_name = None
            continue

        if current_name is None:
            continue

        content_match = re.match(r"^\s*;(?:\s?(.*))?$", raw_line)
        if content_match:
            artifacts[current_name].append(content_match.group(1) or "")
        else:
            artifacts[current_name].append(raw_line)

    return {name: "\n".join(lines).rstrip() + "\n" for name, lines in artifacts.items()}


def write_generated_artifacts(asm_path: Path) -> Path | None:
    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    artifacts = extract_comment_artifacts(asm_text)
    if not artifacts:
        return None

    artifact_dir = asm_path.parent / f"{asm_path.stem}_generated"
    artifact_dir.mkdir(parents=True, exist_ok=True)

    for file_name, content in artifacts.items():
        output_path = artifact_dir / file_name
        ensure_parent(output_path)
        output_path.write_text(content, encoding="utf-8")

    return artifact_dir


def read_preflight_json_artifact(path: Path, artifact_name: str) -> object:
    if not path.exists():
        raise RuntimeError(f"MSX2 MegaROM preflight failed: missing {path}")
    raw_text = path.read_text(encoding="utf-8")
    if not raw_text.strip():
        raise RuntimeError(f"MSX2 MegaROM preflight failed: {artifact_name} is empty")
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"{artifact_name} is not valid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc


def build_preflight_artifact_summaries(paths: list[tuple[str, Path]]) -> list[dict[str, object]]:
    summaries: list[dict[str, object]] = []
    for artifact_name, path in paths:
        raw_text = path.read_text(encoding="utf-8")
        summaries.append({
            "name": artifact_name,
            "bytes": len(raw_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum([artifact_name, raw_text]),
        })
    return summaries


def build_msx2_preflight_failure_gate_summary(reason: str) -> list[dict[str, object]]:
    failed_gate_by_reason = {
        "logical_package_over_budget": "bank_allocation_dry_run",
        "estimated_packed_bank_over_budget": "bank_allocation_dry_run",
        "ram_budget_failed": "ram_budget_report",
        "strict_warning_gate_rejected": "overflow_recovery_plan",
    }
    failed_gate_id = failed_gate_by_reason.get(reason, "bank_allocation_dry_run")
    gates: list[dict[str, object]] = []
    has_failed = False
    for gate in build_msx2_preflight_gate_summary(reason == "strict_warning_gate_rejected"):
        updated_gate = dict(gate)
        gate_id = updated_gate.get("id")
        if gate_id == failed_gate_id:
            updated_gate["status"] = "failed"
            evidence = list(updated_gate.get("evidence") or [])
            evidence.append(f"msx2_preflight_failure.json:{reason}")
            updated_gate["evidence"] = evidence
            has_failed = True
        elif has_failed:
            updated_gate["status"] = "not_run"
            updated_gate["evidence"] = []
        gates.append(updated_gate)
    return gates


def build_msx2_preflight_resolver_candidates(reason: str, details: dict[str, object] | None = None) -> list[dict[str, object]]:
    details = details or {}
    candidates: list[dict[str, object]] = []
    if reason == "strict_warning_gate_rejected":
        candidates.append({
            "id": "relax_strict_warning_gate",
            "eligible": True,
            "stage": "preflight",
            "retryKind": "same_artifacts",
            "reason": "Only the strict warning gate failed; the current packed banks still fit.",
            "regenerate": {
                "argsRemove": ["--strict-msx2-megarom-preflight-warnings"],
                "argsAdd": [],
            },
        })
    if reason in {"logical_package_over_budget", "estimated_packed_bank_over_budget"}:
        candidates.append({
            "id": "enable_zx0_preprocess",
            "eligible": True,
            "stage": "preflight",
            "retryKind": "regenerate_asm",
            "reason": "A logical or estimated bank overflow can often be resolved by re-emitting ASM after ZX0 preprocessing.",
            "requires": ["source build used --skip-zx0-preprocess"],
            "regenerate": {
                "argsRemove": ["--skip-zx0-preprocess"],
                "argsAdd": [],
            },
        })
        candidates.append({
            "id": "split_over_budget_world_packages",
            "eligible": False,
            "stage": "precompile",
            "retryKind": "repack_world_banks",
            "reason": "The precompiler can budget-split oversized world packages, but chunk-to-label physical SCREEN 4 loading is still pending.",
            "blockedBy": "chunk-to-label SCREEN 4 physical loader is not implemented yet",
            "implementedPart": "logical budget emits auto_world_package_chunk entries for splittable world packages",
            "missingPart": "chunk section sizes and SCREEN 4 loader coverage must be validated before chunked packages can compile",
            "targets": details.get("overBudgetPackages") or details.get("overBudgetBanks") or [],
        })
    if reason == "ram_budget_failed":
        candidates.append({
            "id": "reduce_runtime_ram",
            "eligible": False,
            "stage": "precompile",
            "retryKind": "authoring_or_runtime_layout_change",
            "reason": "RAM overflow needs smaller live pools, smaller hot caches, or fewer active runtime systems.",
            "blockedBy": "automatic RAM layout reducer is not implemented yet",
        })
    if not candidates:
        candidates.append({
            "id": "manual_budget_review",
            "eligible": False,
            "stage": "diagnostic",
            "retryKind": "manual",
            "reason": f"No automatic resolver is registered for preflight reason '{reason}'.",
        })
    return candidates


def build_msx2_compile_resolver_candidates(
    reason: str,
    resident_regeneration_readiness: dict[str, object] | None = None,
) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    if "resident bank overflow" in reason.lower() or "negative initial size" in reason.lower():
        readiness_status = (
            str(resident_regeneration_readiness.get("status"))
            if isinstance(resident_regeneration_readiness, dict) and resident_regeneration_readiness.get("status")
            else ""
        )
        cold_data_candidate: dict[str, object] = {
            "id": "move_cold_readonly_data_to_world_bank",
            "eligible": False,
            "stage": "post_compile",
            "retryKind": "regenerate_from_project_json",
            "priority": 20,
            "reason": "Glass reported resident ROM pressure after assembly; cold read-only tables must move out of fixed/resident code.",
            "blockedBy": "resident cold-data classifier/regenerator is not implemented yet",
            "regenerate": {
                "preferredPlacement": "world_data_bank",
                "avoidPlacement": "ram",
            },
        }
        if isinstance(resident_regeneration_readiness, dict):
            cold_data_candidate["readinessStatus"] = readiness_status or "unknown"
            cold_data_candidate["readinessReason"] = resident_regeneration_readiness.get("reason")
            cold_data_candidate["nextAutomaticAction"] = resident_regeneration_readiness.get("nextAutomaticAction")
            cold_data_candidate["topTargets"] = resident_regeneration_readiness.get("topTargets") or []
            if readiness_status == "generator_rule_available":
                cold_data_candidate["eligible"] = True
                cold_data_candidate["priority"] = 5
                cold_data_candidate["stage"] = "precompile"
                cold_data_candidate.pop("blockedBy", None)
                cold_data_candidate["reason"] = "Resident SCREEN 4 runtime layer data can be regenerated into world data banks with the current generator policy."
            elif readiness_status == "needs_classifier_rule":
                cold_data_candidate["blockedBy"] = "cold read-only data exists, but no generator classifier owns those labels yet"
            elif readiness_status == "no_cold_readonly_targets":
                cold_data_candidate["blockedBy"] = "no cold read-only resident contributors remain to move automatically"
        candidates.append({
            "id": "run_post_asm_dead_block_optimizer",
            "eligible": True,
            "stage": "post_compile",
            "retryKind": "regenerate_asm",
            "priority": 10,
            "reason": "A resident bank overflow can sometimes be recovered by removing annotated dead ASM blocks and recompiling the optimized ASM.",
            "regenerate": {
                "postAsmRules": "dead-blocks",
                "postAsmPasses": 1,
                "fallback": "keep_last_known_failure_report_if_optimized_asm_still_fails",
            },
        })
        candidates.append(cold_data_candidate)
    if not candidates:
        candidates.append({
            "id": "manual_compile_review",
            "eligible": False,
            "stage": "diagnostic",
            "retryKind": "manual",
            "reason": "No automatic compile resolver is registered for this Glass failure.",
        })
    return candidates


def build_msx2_automatic_resolution_plan(
    scope: str,
    resolver_candidates: list[dict[str, object]] | None,
    resolver_attempts: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    candidates = [
        item for item in (resolver_candidates or [])
        if isinstance(item, dict)
    ]
    attempts = [
        item for item in (resolver_attempts or [])
        if isinstance(item, dict)
    ]
    eligible = [
        item for item in candidates
        if item.get("id") and item.get("eligible") is not False
    ]
    eligible = sorted(
        eligible,
        key=lambda item: int(item.get("priority") or 100),
    )
    blocked = [
        item for item in candidates
        if item.get("id") and item.get("eligible") is False
    ]
    resolved_attempt = next(
        (item for item in reversed(attempts) if item.get("status") == "resolved"),
        None,
    )
    next_candidate = eligible[0] if eligible else None
    if resolved_attempt:
        status = "resolved"
    elif next_candidate:
        status = "ready"
    elif blocked:
        status = "blocked"
    else:
        status = "manual"
    return {
        "scope": scope,
        "status": status,
        "nextCandidateId": next_candidate.get("id") if isinstance(next_candidate, dict) else None,
        "nextAutomaticAction": (
            next_candidate.get("nextAutomaticAction")
            or (next_candidate.get("regenerate") or {}).get("postAsmRules")
            or next_candidate.get("retryKind")
            if isinstance(next_candidate, dict)
            else None
        ),
        "eligibleCandidateIds": [str(item.get("id")) for item in eligible],
        "blockedCandidateIds": [str(item.get("id")) for item in blocked],
        "blockedReasons": [
            {
                "id": item.get("id"),
                "reason": item.get("reason"),
                "blockedBy": item.get("blockedBy"),
                "readinessStatus": item.get("readinessStatus"),
                "implementedPart": item.get("implementedPart"),
                "missingPart": item.get("missingPart"),
                "unsupportedReason": item.get("unsupportedReason"),
                "splitPackageCount": item.get("splitPackageCount"),
            }
            for item in blocked
            if (
                item.get("blockedBy")
                or item.get("readinessStatus")
                or item.get("missingPart")
                or item.get("unsupportedReason")
            )
        ],
        "attemptCount": len(attempts),
        "resolvedCandidateId": resolved_attempt.get("candidateId") if isinstance(resolved_attempt, dict) else None,
    }


def build_msx2_resident_regeneration_readiness(resident_bank_analysis: dict[str, object]) -> dict[str, object]:
    contributors = [
        item
        for item in (resident_bank_analysis.get("topContributors") or [])
        if isinstance(item, dict)
    ]
    movable = [
        item
        for item in contributors
        if item.get("moveCandidate") is True
    ]
    screen_layers = [
        item
        for item in movable
        if item.get("category") == "screen_runtime_layer"
    ]
    raw_data = [
        item
        for item in movable
        if item.get("category") == "data"
    ]
    top_targets = [
        {
            "label": item.get("label"),
            "category": item.get("category"),
            "estimatedBytes": int(item.get("estimatedBytes") or 0),
            "sourceBytes": int(item.get("sourceBytes") or 0),
            "startLine": item.get("startLine"),
            "endLine": item.get("endLine"),
        }
        for item in movable[:5]
    ]
    if screen_layers:
        return {
            "scope": "msx2_screen4_resident_regeneration_readiness",
            "status": "generator_rule_available",
            "candidateId": "move_cold_readonly_data_to_world_bank",
            "reason": "Resident SCREEN 4 layer tables are still present; current generator policy can place collision/behavior/effects in world data banks and cache hot layers in RAM.",
            "nextAutomaticAction": "regenerate_from_project_json_with_current_screen4_runtime_layer_policy",
            "movableContributorCount": len(movable),
            "screenRuntimeLayerContributorCount": len(screen_layers),
            "rawDataContributorCount": len(raw_data),
            "topTargets": top_targets,
        }
    if raw_data:
        return {
            "scope": "msx2_screen4_resident_regeneration_readiness",
            "status": "needs_classifier_rule",
            "candidateId": "move_cold_readonly_data_to_world_bank",
            "reason": "Resident read-only data remains, but it is not one of the SCREEN 4 runtime layer classes already handled by the generator.",
            "nextAutomaticAction": "add_or_extend_cold_data_classifier_before_retry",
            "movableContributorCount": len(movable),
            "screenRuntimeLayerContributorCount": len(screen_layers),
            "rawDataContributorCount": len(raw_data),
            "topTargets": top_targets,
        }
    return {
        "scope": "msx2_screen4_resident_regeneration_readiness",
        "status": "no_cold_readonly_targets",
        "candidateId": "move_cold_readonly_data_to_world_bank",
        "reason": "No resident screen-layer or obvious read-only data contributors remain in the fixed section; further recovery should focus on dead runtime code, far code, or feature slicing.",
        "nextAutomaticAction": "run_post_asm_dead_block_optimizer_or_reduce_resident_runtime",
        "movableContributorCount": 0,
        "screenRuntimeLayerContributorCount": 0,
        "rawDataContributorCount": 0,
        "topTargets": [],
    }


def write_msx2_preflight_failure_summary(
    artifact_dir: Path,
    reason: str,
    project_slice: dict,
    logical_budget: dict,
    ram_budget: dict,
    details: dict[str, object] | None = None,
) -> Path:
    world_bank_manifest = project_slice.get("worldBankManifest") or {}
    manifest_worlds = world_bank_manifest.get("worlds") or []
    manifest_physical_banks = world_bank_manifest.get("estimatedPhysicalBanks") or []
    manifest_package_count = sum(
        len(world.get("packages") or [])
        for world in manifest_worlds
        if isinstance(world, dict)
    )
    failure_details = details or {}
    artifact_checks = build_preflight_artifact_summaries([
        (artifact_name, artifact_path)
        for artifact_name, artifact_path in [
            ("project_slice.json", artifact_dir / "project_slice.json"),
            ("asset_storage_policy.json", artifact_dir / "asset_storage_policy.json"),
            ("logical_bank_budget.json", artifact_dir / "logical_bank_budget.json"),
            ("msx2_world_bank_manifest.json", artifact_dir / "msx2_world_bank_manifest.json"),
            ("ram_budget.json", artifact_dir / "ram_budget.json"),
        ]
        if artifact_path.exists()
    ])
    resolver_candidates = build_msx2_preflight_resolver_candidates(reason, failure_details)
    failure_summary = {
        "scope": "msx2_screen4_megarom_preflight_failure",
        "status": "error",
        "reason": reason,
        "artifactDir": str(artifact_dir),
        "artifactChecks": artifact_checks,
        "pipelineGates": build_msx2_preflight_failure_gate_summary(reason),
        "project": {
            "name": project_slice.get("projectName"),
            "backend": project_slice.get("backend"),
            "screenMode": project_slice.get("screenMode"),
            "romMode": project_slice.get("romMode"),
            "mapper": project_slice.get("mapper"),
        },
        "rom": {
            "bankSizeBytes": int(logical_budget.get("bankSizeBytes") or 0),
            "payloadBytes": int(logical_budget.get("totalPayloadBytes") or 0),
            "estimatedPackedBankCount": int(logical_budget.get("estimatedPackedBankCount") or 0),
            "overBudgetPackages": logical_budget.get("overBudgetPackages") or [],
            "overBudgetBanks": [
                bank for bank in (logical_budget.get("estimatedPackedBanks") or [])
                if isinstance(bank, dict) and int(bank.get("overBudgetBytes") or 0) > 0
            ],
        },
        "worldBankManifest": {
            "worldCount": len(manifest_worlds) if isinstance(manifest_worlds, list) else 0,
            "estimatedPhysicalBankCount": len(manifest_physical_banks) if isinstance(manifest_physical_banks, list) else 0,
            "dataWindowAddress": world_bank_manifest.get("dataWindowAddress") if isinstance(world_bank_manifest, dict) else None,
            "packageCount": manifest_package_count,
            "warningBankCount": sum(
                1
                for bank in manifest_physical_banks
                if isinstance(bank, dict) and (bank.get("status") == "warning" or bank.get("warning") is True)
            ),
            "overBudgetBankCount": sum(
                1
                for bank in manifest_physical_banks
                if isinstance(bank, dict) and (bank.get("status") == "error" or int(bank.get("overBudgetBytes") or 0) > 0)
            ),
            "estimatedPhysicalBanks": [
                {
                    "bankIndex": bank.get("bankIndex"),
                    "windowAddress": bank.get("windowAddress"),
                    "usedBytes": int(bank.get("usedBytes") or 0),
                    "freeBytes": int(bank.get("freeBytes") or 0),
                    "overBudgetBytes": int(bank.get("overBudgetBytes") or 0),
                    "status": bank.get("status"),
                    "packageCount": len(bank.get("packages") or []),
                }
                for bank in manifest_physical_banks
                if isinstance(bank, dict)
            ],
        },
        "ram": {
            "start": ram_budget.get("start"),
            "limit": ram_budget.get("limit"),
            "usedBytes": int(ram_budget.get("usedBytes") or 0),
            "freeBytes": int(ram_budget.get("freeBytes") or 0),
            "status": ram_budget.get("status", "unknown"),
        },
        "planB": {
            "romRecommendations": logical_budget.get("recoveryRecommendations") or [],
            "recoveryPlan": logical_budget.get("recoveryPlan") or [],
            "ramRecommendations": ram_budget.get("recommendations") or [],
        },
        "resolverCandidates": resolver_candidates,
        "automaticResolutionPlan": build_msx2_automatic_resolution_plan(
            "msx2_screen4_megarom_preflight_resolution_plan",
            resolver_candidates,
        ),
        "details": failure_details,
    }
    failure_path = artifact_dir / "msx2_preflight_failure.json"
    failure_path.write_text(
        json.dumps(failure_summary, indent=2) + "\n",
        encoding="utf-8",
    )
    return failure_path


def write_msx2_loader_capability_failure_summary(
    artifact_dir: Path,
    project_slice: dict,
    logical_budget: dict,
    ram_budget: dict,
    details: dict[str, object],
) -> Path:
    screen4_data_bank_plan = project_slice.get("screen4DataBankPlan") if isinstance(project_slice, dict) else {}
    unsupported_reason = (
        str(screen4_data_bank_plan.get("unsupportedReason"))
        if isinstance(screen4_data_bank_plan, dict) and screen4_data_bank_plan.get("unsupportedReason")
        else ""
    )
    split_packages = logical_budget.get("splitPackages") if isinstance(logical_budget.get("splitPackages"), list) else []
    split_chunk_manifest = (
        screen4_data_bank_plan.get("splitChunkManifest")
        if isinstance(screen4_data_bank_plan, dict) and isinstance(screen4_data_bank_plan.get("splitChunkManifest"), list)
        else logical_budget.get("splitChunkManifest") if isinstance(logical_budget.get("splitChunkManifest"), list)
        else []
    )
    split_chunk_labels = [
        {
            "chunkId": chunk.get("chunkId"),
            "dataLabel": chunk.get("dataLabel"),
            "dataEndLabel": chunk.get("dataEndLabel"),
            "dataBankSymbol": chunk.get("dataBankSymbol"),
            "loaderSymbol": chunk.get("loaderSymbol"),
            "payloadLabels": chunk.get("payloadLabels") or [],
            "payloadBytes": int(chunk.get("payloadBytes") or 0),
            "payloadLabelCount": int(chunk.get("payloadLabelCount") or len(chunk.get("payloadLabels") or [])),
            "loaderCoverageStatus": chunk.get("loaderCoverageStatus"),
            "loaderCoveredPayloadLabels": chunk.get("loaderCoveredPayloadLabels") or [],
            "loaderUncoveredPayloadLabels": chunk.get("loaderUncoveredPayloadLabels") or [],
            "bankIndex": chunk.get("bankIndex"),
            "physicalBank": chunk.get("physicalBank"),
        }
        for chunk in split_chunk_manifest
        if isinstance(chunk, dict)
    ]
    split_chunk_blocked = unsupported_reason == "split_packages_require_physical_chunk_labels" or bool(split_packages)
    resolver_candidates = [
        {
            "id": "emit_multi_bank_world_data_loader",
            "eligible": False,
            "stage": "asm_generation",
            "retryKind": "regenerate_asm",
            "reason": (
                "The logical allocator already split oversized world packages into chunks, but the ASM loader cannot yet bind chunks to physical labels."
                if split_chunk_blocked
                else "The logical allocator produced multiple data banks, but this plan is not marked supported by the current SCREEN 4 loader."
            ),
            "blockedBy": (
                "chunk-to-label SCREEN 4 physical loader is not implemented yet"
                if split_chunk_blocked
                else "multi-bank SCREEN 4 data loader is not implemented for this plan"
            ),
            "unsupportedReason": unsupported_reason or None,
            "splitPackageCount": len(split_packages),
            "splitChunkCount": len(split_chunk_labels),
            "chunkLabels": split_chunk_labels,
            "implementedPart": "normal per-screen multi-bank loader is available; chunk diagnostics, data-bank symbols, and chunk data sections are emitted",
            "missingPart": (
                "chunk loader coverage is reported; chunked compile smoke must pass before supported=true"
                if split_chunk_blocked
                else "screen4DataBankPlan must describe a supported per-screen physical bank layout"
            ),
        },
        {
            "id": "enable_zx0_preprocess",
            "eligible": True,
            "stage": "preflight",
            "retryKind": "regenerate_asm",
            "reason": "Selective ZX0 may reduce data to one physical data bank.",
            "requires": ["source build used --skip-zx0-preprocess"],
            "regenerate": {
                "argsRemove": ["--skip-zx0-preprocess"],
                "argsAdd": [],
            },
        },
    ]
    failure_summary = {
        "scope": "msx2_screen4_megarom_preflight_failure",
        "status": "error",
        "reason": "loader_multi_bank_data_window_not_implemented",
        "artifactDir": str(artifact_dir),
        "artifactChecks": build_preflight_artifact_summaries([
            (artifact_name, artifact_path)
            for artifact_name, artifact_path in [
                ("project_slice.json", artifact_dir / "project_slice.json"),
                ("logical_bank_budget.json", artifact_dir / "logical_bank_budget.json"),
                ("msx2_world_bank_manifest.json", artifact_dir / "msx2_world_bank_manifest.json"),
                ("ram_budget.json", artifact_dir / "ram_budget.json"),
            ]
            if artifact_path.exists()
        ]),
        "pipelineGates": build_msx2_preflight_failure_gate_summary("estimated_packed_bank_over_budget"),
        "project": {
            "name": project_slice.get("projectName"),
            "backend": project_slice.get("backend"),
            "screenMode": project_slice.get("screenMode"),
            "romMode": project_slice.get("romMode"),
            "mapper": project_slice.get("mapper"),
        },
        "rom": {
            "bankSizeBytes": int(logical_budget.get("bankSizeBytes") or 0),
            "payloadBytes": int(logical_budget.get("totalPayloadBytes") or 0),
            "estimatedPackedBankCount": int(logical_budget.get("estimatedPackedBankCount") or 0),
            "overBudgetPackages": [],
            "overBudgetBanks": [],
        },
        "ram": {
            "start": ram_budget.get("start"),
            "limit": ram_budget.get("limit"),
            "usedBytes": int(ram_budget.get("usedBytes") or 0),
            "freeBytes": int(ram_budget.get("freeBytes") or 0),
            "status": ram_budget.get("status", "unknown"),
        },
        "planB": {
            "romRecommendations": logical_budget.get("recoveryRecommendations") or [],
            "recoveryPlan": logical_budget.get("recoveryPlan") or [],
            "ramRecommendations": ram_budget.get("recommendations") or [],
        },
        "resolverCandidates": resolver_candidates,
        "automaticResolutionPlan": build_msx2_automatic_resolution_plan(
            "msx2_screen4_megarom_preflight_resolution_plan",
            resolver_candidates,
        ),
        "details": details,
    }
    failure_path = artifact_dir / "msx2_preflight_failure.json"
    failure_path.write_text(
        json.dumps(failure_summary, indent=2) + "\n",
        encoding="utf-8",
    )
    return failure_path


def read_msx2_preflight_failure_summary(artifact_dir: Path | None) -> dict[str, Any] | None:
    if artifact_dir is None:
        return None
    failure_path = artifact_dir / "msx2_preflight_failure.json"
    if not failure_path.exists():
        return None
    failure = read_preflight_json_artifact(failure_path, "msx2_preflight_failure.json")
    if isinstance(failure, dict) and failure.get("scope") == "msx2_screen4_megarom_preflight_failure":
        return failure
    return None


def summarize_msx2_preflight_failure_for_resolution(failure: dict[str, Any] | None) -> dict[str, object]:
    if not isinstance(failure, dict):
        return {}
    failed_gate = next(
        (
            gate
            for gate in failure.get("pipelineGates") or []
            if isinstance(gate, dict) and gate.get("status") == "failed"
        ),
        None,
    )
    artifact_checks = [
        item for item in failure.get("artifactChecks") or []
        if isinstance(item, dict)
    ]
    world_bank_manifest = failure.get("worldBankManifest") if isinstance(failure.get("worldBankManifest"), dict) else {}
    rom = failure.get("rom") if isinstance(failure.get("rom"), dict) else {}
    automatic_resolution_plan = failure.get("automaticResolutionPlan") if isinstance(failure.get("automaticResolutionPlan"), dict) else {}
    resolver_candidates = [
        item for item in failure.get("resolverCandidates") or []
        if isinstance(item, dict)
    ]
    resolver_candidate_ids = [
        str(item.get("id"))
        for item in resolver_candidates
        if item.get("id")
    ]
    eligible_resolver_candidate_ids = [
        str(item.get("id"))
        for item in resolver_candidates
        if item.get("id") and item.get("eligible") is not False
    ]
    blocked_chunk_label_candidates = [
        {
            "id": item.get("id"),
            "splitChunkCount": item.get("splitChunkCount"),
            "chunkLabels": item.get("chunkLabels") or [],
        }
        for item in resolver_candidates
        if item.get("id") and item.get("chunkLabels")
    ]
    return {
        "reason": failure.get("reason"),
        "failedGateId": failed_gate.get("id") if isinstance(failed_gate, dict) else None,
        "artifactCheckCount": len(artifact_checks),
        "artifactCheckNames": [item.get("name") for item in artifact_checks if item.get("name")],
        "resolverCandidateIds": resolver_candidate_ids,
        "eligibleResolverCandidateIds": eligible_resolver_candidate_ids,
        "blockedChunkLabelCandidates": blocked_chunk_label_candidates,
        "automaticResolutionPlan": {
            "status": automatic_resolution_plan.get("status"),
            "nextCandidateId": automatic_resolution_plan.get("nextCandidateId"),
            "eligibleCandidateIds": automatic_resolution_plan.get("eligibleCandidateIds") or eligible_resolver_candidate_ids,
            "blockedCandidateIds": automatic_resolution_plan.get("blockedCandidateIds") or [],
            "blockedReasons": automatic_resolution_plan.get("blockedReasons") or [],
        },
        "worldBankManifest": {
            "worldCount": world_bank_manifest.get("worldCount"),
            "estimatedPhysicalBankCount": world_bank_manifest.get("estimatedPhysicalBankCount"),
            "warningBankCount": world_bank_manifest.get("warningBankCount"),
            "overBudgetBankCount": world_bank_manifest.get("overBudgetBankCount"),
        },
        "rom": {
            "overBudgetPackageCount": len(rom.get("overBudgetPackages") or []),
            "overBudgetBankCount": len(rom.get("overBudgetBanks") or []),
        },
    }


def write_msx2_budget_resolution_summary(
    artifact_dir: Path | None,
    status: str,
    attempts: list[dict[str, object]],
    final_artifact_dir: Path | None = None,
) -> None:
    if artifact_dir is None:
        return
    summary = {
        "scope": "msx2_screen4_budget_resolution",
        "status": status,
        "artifactDir": str(final_artifact_dir or artifact_dir),
        "attempts": attempts,
    }
    (artifact_dir / "msx2_budget_resolution.json").write_text(
        json.dumps(summary, indent=2) + "\n",
        encoding="utf-8",
    )


def append_msx2_blocked_resolution_attempts(
    attempts: list[dict[str, object]],
    failure: dict[str, Any] | None,
) -> None:
    if not isinstance(failure, dict):
        return
    attempted_candidate_ids = {
        str(item.get("candidateId") or item.get("action"))
        for item in attempts
        if isinstance(item, dict) and (item.get("candidateId") or item.get("action"))
    }
    resolver_candidates = [
        item for item in (failure.get("resolverCandidates") or [])
        if isinstance(item, dict) and item.get("id") and item.get("eligible") is False
    ]
    blocked_by_id = {
        str(item.get("id")): item
        for item in ((failure.get("automaticResolutionPlan") or {}).get("blockedReasons") or [])
        if isinstance(item, dict) and item.get("id")
    }
    for candidate in resolver_candidates:
        candidate_id = str(candidate.get("id"))
        if candidate_id in attempted_candidate_ids:
            continue
        detail = blocked_by_id.get(candidate_id, {})
        attempts.append({
            "attempt": len(attempts),
            "action": candidate_id,
            "candidateId": candidate_id,
            "status": "blocked",
            "reason": detail.get("blockedBy") or candidate.get("blockedBy") or candidate.get("reason"),
            "blockedBy": detail.get("blockedBy") or candidate.get("blockedBy"),
            "implementedPart": detail.get("implementedPart") or candidate.get("implementedPart"),
            "missingPart": detail.get("missingPart") or candidate.get("missingPart"),
            "unsupportedReason": detail.get("unsupportedReason") or candidate.get("unsupportedReason"),
            "splitPackageCount": detail.get("splitPackageCount") or candidate.get("splitPackageCount"),
            "splitChunkCount": detail.get("splitChunkCount") or candidate.get("splitChunkCount"),
            "chunkLabels": detail.get("chunkLabels") or candidate.get("chunkLabels") or [],
        })


def validate_msx2_preflight_with_safe_resolution(
    artifact_dir: Path | None,
    asm_output: Path,
    project_root: Path,
    strict_warnings: bool,
    auto_resolve: bool,
    skip_zx0_preprocess: bool,
    max_attempts: int,
) -> tuple[Path | None, Path]:
    asm_text = asm_output.read_text(encoding="utf-8", errors="ignore")
    if "MSX2_GAMEFLOW_SCREEN5_TO_SCREEN4_MIXED: yes" in asm_text:
        return artifact_dir, asm_output
    try:
        validate_msx2_screen4_megarom_preflight_budget(
            artifact_dir,
            strict_warnings=strict_warnings,
        )
        return artifact_dir, asm_output
    except RuntimeError as first_error:
        if not auto_resolve or artifact_dir is None:
            raise

        attempts: list[dict[str, object]] = []
        failure = read_msx2_preflight_failure_summary(artifact_dir) or {}
        reason = str(failure.get("reason") or "")
        attempts.append({
            "attempt": 0,
            "action": "initial_preflight",
            "status": "failed",
            "reason": reason or str(first_error),
            "failure": summarize_msx2_preflight_failure_for_resolution(failure),
            "artifactDir": str(artifact_dir),
        })

        attempt_limit = max(0, int(max_attempts or 0))
        eligible_candidate_ids = {
            str(item.get("id"))
            for item in (failure.get("resolverCandidates") or [])
            if isinstance(item, dict) and item.get("id") and item.get("eligible") is not False
        }
        if (
            ("relax_strict_warning_gate" in eligible_candidate_ids or reason == "strict_warning_gate_rejected")
            and strict_warnings
            and attempt_limit >= 1
        ):
            try:
                validate_msx2_screen4_megarom_preflight_budget(
                    artifact_dir,
                    strict_warnings=False,
                )
                attempts.append({
                    "attempt": 1,
                    "action": "relax_strict_warning_gate",
                    "candidateId": "relax_strict_warning_gate",
                    "status": "resolved",
                    "artifactDir": str(artifact_dir),
                })
                write_msx2_budget_resolution_summary(
                    artifact_dir,
                    "resolved",
                    attempts,
                    artifact_dir,
                )
                return artifact_dir, asm_output
            except RuntimeError as retry_error:
                retry_failure = read_msx2_preflight_failure_summary(artifact_dir) or {}
                attempts.append({
                    "attempt": 1,
                    "action": "relax_strict_warning_gate",
                    "candidateId": "relax_strict_warning_gate",
                    "status": "failed",
                    "reason": str(retry_error),
                    "failure": summarize_msx2_preflight_failure_for_resolution(retry_failure),
                    "artifactDir": str(artifact_dir),
                })

        if (
            (
                "enable_zx0_preprocess" in eligible_candidate_ids
                or reason in {"logical_package_over_budget", "estimated_packed_bank_over_budget"}
            )
            and skip_zx0_preprocess
            and attempt_limit >= 1
        ):
            retry_artifact_dir = artifact_dir
            try:
                zx0_retry_asm, zx0_retry_info = maybe_run_zx0_preprocess(
                    project_root=project_root,
                    asm_output=asm_output,
                    enabled=True,
                )
                retry_artifact_dir = write_generated_artifacts(zx0_retry_asm)
                validate_msx2_screen4_megarom_preflight_budget(
                    retry_artifact_dir,
                    strict_warnings=strict_warnings,
                )
                attempts.append({
                    "attempt": 1,
                    "action": "enable_zx0_preprocess",
                    "candidateId": "enable_zx0_preprocess",
                    "status": "resolved",
                    "artifactDir": str(retry_artifact_dir),
                    "zx0": zx0_retry_info,
                })
                write_msx2_budget_resolution_summary(
                    retry_artifact_dir,
                    "resolved",
                    attempts,
                    retry_artifact_dir,
                )
                return retry_artifact_dir, zx0_retry_asm
            except RuntimeError as retry_error:
                retry_failure = read_msx2_preflight_failure_summary(retry_artifact_dir) or {}
                attempts.append({
                    "attempt": 1,
                    "action": "enable_zx0_preprocess",
                    "candidateId": "enable_zx0_preprocess",
                    "status": "failed",
                    "reason": str(retry_error),
                    "failure": summarize_msx2_preflight_failure_for_resolution(retry_failure),
                    "artifactDir": str(retry_artifact_dir),
                })

        final_failure = read_msx2_preflight_failure_summary(artifact_dir) or failure
        append_msx2_blocked_resolution_attempts(attempts, final_failure)
        write_msx2_budget_resolution_summary(
            artifact_dir,
            "unresolved",
            attempts,
            artifact_dir,
        )
        raise first_error


def build_msx2_preflight_gate_summary(strict_warnings: bool) -> list[dict[str, object]]:
    return [
        {
            "order": 1,
            "id": "project_analysis_and_world_package_extraction",
            "status": "passed",
            "evidence": ["project_slice.json", "worldPackageSummary"],
        },
        {
            "order": 2,
            "id": "project_precompilation_slice",
            "status": "passed",
            "evidence": ["includedAssets", "excludedAssets", "includedRuntimeModules", "excludedRuntimeModules"],
        },
        {
            "order": 3,
            "id": "asset_storage_policy",
            "status": "passed",
            "evidence": ["asset_storage_policy.json"],
        },
        {
            "order": 4,
            "id": "ram_budget_report",
            "status": "passed",
            "evidence": ["ram_budget.json"],
        },
        {
            "order": 5,
            "id": "bank_allocation_dry_run",
            "status": "passed",
            "evidence": ["logical_bank_budget.json"],
        },
        {
            "order": 6,
            "id": "overflow_recovery_plan",
            "status": "passed",
            "evidence": ["recoveryRecommendations", "recoveryPlan"],
            "strictWarnings": strict_warnings,
        },
        {
            "order": 7,
            "id": "asm_generation",
            "status": "already_done",
            "evidence": ["unified ASM with embedded preflight artifacts"],
        },
        {
            "order": 8,
            "id": "glass_compile",
            "status": "pending",
            "evidence": [],
        },
        {
            "order": 9,
            "id": "artifact_validation_against_symbols",
            "status": "pending",
            "evidence": [],
        },
        {
            "order": 10,
            "id": "post_compilation_optimization",
            "status": "pending",
            "evidence": [],
        },
        {
            "order": 11,
            "id": "openmsx_smoke",
            "status": "pending_when_requested",
            "evidence": [],
        },
    ]


def write_msx2_build_summary(
    artifact_dir: Path | None,
    rom_output: Path,
    asm_to_compile: Path,
    sym_output: Path | None,
    original_size: int,
    padded_size: int,
    validation_kind: str,
    post_asm_requested: bool = False,
    post_asm_check_only: bool = False,
    post_asm_applied: bool = False,
    post_asm_report_paths: list[Path] | None = None,
    post_asm_rejected_report_paths: list[Path] | None = None,
    post_asm_rejected_reason: str | None = None,
    compile_resolver_attempts: list[dict[str, object]] | None = None,
    openmsx_requested: bool = False,
    openmsx_passed: bool = False,
) -> None:
    if artifact_dir is None:
        return
    preflight_summary_path = artifact_dir / "preflight_summary.json"
    if not preflight_summary_path.exists():
        return
    preflight_summary = read_preflight_json_artifact(preflight_summary_path, "preflight_summary.json")
    if not isinstance(preflight_summary, dict) or preflight_summary.get("scope") != "msx2_screen4_megarom_preflight_summary":
        return
    pipeline_gates = []
    for gate in preflight_summary.get("pipelineGates") or []:
        if not isinstance(gate, dict):
            continue
        updated_gate = dict(gate)
        gate_id = updated_gate.get("id")
        if gate_id in {"glass_compile", "artifact_validation_against_symbols"}:
            updated_gate["status"] = "passed"
            updated_gate["evidence"] = [str(rom_output), str(sym_output)] if sym_output else [str(rom_output)]
        elif gate_id == "post_compilation_optimization":
            if post_asm_applied:
                updated_gate["status"] = "passed"
                updated_gate["evidence"] = [str(asm_to_compile)]
            elif post_asm_requested and post_asm_check_only:
                updated_gate["status"] = "check_only_passed"
                updated_gate["evidence"] = [str(asm_to_compile)]
            elif post_asm_requested and post_asm_rejected_report_paths:
                updated_gate["status"] = "fallback_to_baseline"
                updated_gate["evidence"] = [str(asm_to_compile)]
                if post_asm_rejected_reason:
                    updated_gate["reason"] = post_asm_rejected_reason
            elif post_asm_requested:
                updated_gate["status"] = "requested_no_change"
                updated_gate["evidence"] = [str(asm_to_compile)]
            elif updated_gate.get("status") == "pending":
                updated_gate["status"] = "not_requested"
        elif gate_id == "openmsx_smoke":
            if openmsx_passed:
                updated_gate["status"] = "passed"
                updated_gate["evidence"] = ["OpenMSX smoke completed"]
            elif openmsx_requested:
                updated_gate["status"] = "requested_pending"
                updated_gate["evidence"] = []
        pipeline_gates.append(updated_gate)

    rom_bytes = rom_output.read_bytes()
    asm_text = asm_to_compile.read_text(encoding="utf-8", errors="ignore")
    sym_text = sym_output.read_text(encoding="utf-8", errors="ignore") if sym_output and sym_output.exists() else ""
    ide_budget_feedback_path = artifact_dir / "msx2_ide_budget_feedback.json"
    ide_budget_feedback_summary = None
    if ide_budget_feedback_path.exists():
        ide_budget_feedback_text = ide_budget_feedback_path.read_text(encoding="utf-8")
        ide_budget_feedback = read_preflight_json_artifact(ide_budget_feedback_path, "msx2_ide_budget_feedback.json")
        ide_budget_feedback_summary = {
            "path": str(ide_budget_feedback_path),
            "bytes": len(ide_budget_feedback_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum(["msx2_ide_budget_feedback.json", ide_budget_feedback_text]),
            "scope": ide_budget_feedback.get("scope") if isinstance(ide_budget_feedback, dict) else None,
            "status": ide_budget_feedback.get("status") if isinstance(ide_budget_feedback, dict) else None,
        }
    budget_resolution_path = artifact_dir / "msx2_budget_resolution.json"
    budget_resolution_summary = None
    if budget_resolution_path.exists():
        budget_resolution_text = budget_resolution_path.read_text(encoding="utf-8")
        budget_resolution = read_preflight_json_artifact(budget_resolution_path, "msx2_budget_resolution.json")
        attempts = budget_resolution.get("attempts") if isinstance(budget_resolution, dict) else []
        budget_resolution_summary = {
            "path": str(budget_resolution_path),
            "bytes": len(budget_resolution_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum(["msx2_budget_resolution.json", budget_resolution_text]),
            "scope": budget_resolution.get("scope") if isinstance(budget_resolution, dict) else None,
            "status": budget_resolution.get("status") if isinstance(budget_resolution, dict) else None,
            "attempts": len(attempts) if isinstance(attempts, list) else 0,
            "finalAction": next(
                (
                    str(item.get("action"))
                    for item in reversed(attempts)
                    if isinstance(item, dict) and item.get("status") == "resolved" and item.get("action")
                ),
                None,
            ) if isinstance(attempts, list) else None,
        }
    post_asm_reports = []
    post_asm_attempts = []
    for report_path in post_asm_report_paths or []:
        is_selected_asm_report = report_path == post_asm_report_json_path(asm_to_compile)
        if not report_path.exists():
            post_asm_reports.append({
                "path": str(report_path),
                "exists": False,
            })
            post_asm_attempts.append({
                "path": str(report_path),
                "status": "missing_report",
                "reason": "Post-ASM report file was not produced",
            })
            continue
        report_text = report_path.read_text(encoding="utf-8")
        report = read_preflight_json_artifact(report_path, report_path.name)
        if not isinstance(report, dict):
            post_asm_reports.append({
                "path": str(report_path),
                "exists": True,
                "valid": False,
            })
            post_asm_attempts.append({
                "path": str(report_path),
                "status": "invalid_report",
                "reason": "Post-ASM report root was not an object",
                "checksum": _bank_metadata_checksum([report_path.name, report_text]),
            })
            continue
        metrics = report.get("metrics") if isinstance(report.get("metrics"), dict) else {}
        block_inventory = metrics.get("block_inventory") if isinstance(metrics.get("block_inventory"), dict) else {}
        optimization_summary = metrics.get("optimization_summary") if isinstance(metrics.get("optimization_summary"), dict) else {}
        findings = report.get("findings") if isinstance(report.get("findings"), list) else []
        removed_source_bytes = int(optimization_summary.get("removed_source_bytes") or 0)
        applied_patches = int(report.get("applied_patches") or 0)
        rule_classes = sorted({
            str(item.get("rule_id") or item.get("rule") or "unknown")
            for item in findings
            if isinstance(item, dict)
        })
        post_asm_reports.append({
            "path": str(report_path),
            "exists": True,
            "valid": True,
            "checksum": _bank_metadata_checksum([report_path.name, report_text]),
            "input": report.get("input"),
            "findings": len(findings),
            "appliedPatches": applied_patches,
            "deadBlockCandidates": int(block_inventory.get("dead_block_candidates") or 0),
            "deadCandidateLines": int(block_inventory.get("dead_candidate_lines") or 0),
            "deadCandidateSourceBytes": int(block_inventory.get("dead_candidate_source_bytes") or 0),
            "passesRun": int(optimization_summary.get("passes_run") or 0),
            "removedLines": int(optimization_summary.get("removed_lines") or 0),
            "removedSourceBytes": removed_source_bytes,
        })
        attempt_status = "accepted" if post_asm_applied and is_selected_asm_report else "check_only_passed" if post_asm_check_only else "baseline_observed"
        attempt_reason = "Compiled ROM and validation completed with this ASM" if post_asm_applied and is_selected_asm_report else "Report generated without applying optimized ASM" if post_asm_check_only else "Baseline report retained for comparison"
        if post_asm_rejected_report_paths and report_path in post_asm_rejected_report_paths:
            attempt_status = "rejected_validation_failed"
            attempt_reason = post_asm_rejected_reason or "Optimized ASM failed compile or artifact validation; final build fell back to baseline ASM"
        post_asm_attempts.append({
            "path": str(report_path),
            "status": attempt_status,
            "reason": attempt_reason,
            "ruleClasses": rule_classes,
            "appliedPatches": applied_patches,
            "removedSourceBytes": removed_source_bytes,
            "checksum": _bank_metadata_checksum([report_path.name, report_text]),
        })
    build_summary = {
        "scope": "msx2_screen4_megarom_build_summary",
        "status": "ok",
        "artifactDir": str(artifact_dir),
        "preflightArtifactChecks": preflight_summary.get("artifactChecks") or [],
        "preflightOutputArtifactChecks": preflight_summary.get("outputArtifactChecks") or [],
        "pipelineGates": pipeline_gates,
        "rom": {
            "path": str(rom_output),
            "originalBytes": original_size,
            "paddedBytes": padded_size,
            "checksum": _bank_metadata_checksum(["rom", rom_bytes.hex()]),
        },
        "asm": {
            "path": str(asm_to_compile),
            "bytes": len(asm_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum(["asm", asm_text]),
        },
        "sym": {
            "path": str(sym_output) if sym_output else None,
            "bytes": len(sym_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum(["sym", sym_text]) if sym_text else None,
        },
        "validation": {
            "kind": validation_kind,
            "glass": "passed",
            "symbols": "passed" if sym_output and sym_output.exists() else "not_available",
            "postAsm": "applied" if post_asm_applied else "check_only_passed" if post_asm_requested and post_asm_check_only else "fallback_to_baseline" if post_asm_requested and post_asm_rejected_report_paths else "requested_no_change" if post_asm_requested else "not_requested",
            "openmsx": "passed" if openmsx_passed else "requested_pending" if openmsx_requested else "not_requested",
        },
        "ideBudgetFeedback": ide_budget_feedback_summary,
        "budgetResolution": budget_resolution_summary,
        "compileResolution": {
            "attempts": compile_resolver_attempts or [],
            "status": (
                "resolved"
                if any(isinstance(item, dict) and item.get("status") == "resolved" for item in (compile_resolver_attempts or []))
                else "not_needed"
                if not compile_resolver_attempts
                else "unresolved"
            ),
            "finalAction": next(
                (
                    str(item.get("action"))
                    for item in reversed(compile_resolver_attempts or [])
                    if isinstance(item, dict) and item.get("status") == "resolved" and item.get("action")
                ),
                None,
            ),
        },
        "postAsmReports": post_asm_reports,
        "postAsmAttempts": post_asm_attempts,
    }
    (artifact_dir / "msx2_build_summary.json").write_text(
        json.dumps(build_summary, indent=2) + "\n",
        encoding="utf-8",
    )


def write_msx2_compile_failure_summary(
    artifact_dir: Path | None,
    asm_to_compile: Path,
    rom_output: Path,
    sym_output: Path | None,
    reason: str,
    resolver_attempts: list[dict[str, object]] | None = None,
) -> Path | None:
    if artifact_dir is None:
        return None
    preflight_summary_path = artifact_dir / "preflight_summary.json"
    preflight_summary = None
    if preflight_summary_path.exists():
        maybe_summary = read_preflight_json_artifact(preflight_summary_path, "preflight_summary.json")
        if isinstance(maybe_summary, dict):
            preflight_summary = maybe_summary

    pipeline_gates = []
    for gate in (preflight_summary or {}).get("pipelineGates") or default_msx2_pipeline_gates():
        if not isinstance(gate, dict):
            continue
        updated_gate = dict(gate)
        gate_id = updated_gate.get("id")
        if gate_id == "glass_compile":
            updated_gate["status"] = "failed"
            updated_gate["evidence"] = [str(asm_to_compile)]
        pipeline_gates.append(updated_gate)

    asm_text = asm_to_compile.read_text(encoding="utf-8", errors="ignore") if asm_to_compile.exists() else ""
    resident_bank_analysis = analyze_msx2_resident_asm_contributors(asm_text, overflow_bytes=_extract_overflow_bytes_from_reason(reason))
    resident_regeneration_readiness = build_msx2_resident_regeneration_readiness(resident_bank_analysis)
    resolver_candidates = build_msx2_compile_resolver_candidates(reason, resident_regeneration_readiness)
    largest_resident_contributors = [
        f"{item.get('label')}: {int(item.get('estimatedBytes') or item.get('sourceBytes') or 0)} bytes"
        for item in resident_bank_analysis.get("topContributors", [])[:5]
        if isinstance(item, dict)
    ]
    failure_summary = {
        "scope": "msx2_screen4_megarom_compile_failure",
        "status": "error",
        "reason": reason,
        "artifactDir": str(artifact_dir),
        "pipelineGates": pipeline_gates,
        "asm": {
            "path": str(asm_to_compile),
            "bytes": len(asm_text.encode("utf-8")),
            "checksum": _bank_metadata_checksum(["asm", asm_text]) if asm_text else None,
        },
        "rom": {
            "path": str(rom_output),
            "exists": rom_output.exists(),
        },
        "sym": {
            "path": str(sym_output) if sym_output else None,
            "exists": bool(sym_output and sym_output.exists()),
        },
        "planB": {
            "primary": "Move cold read-only tables to world/data banks or special-code banks.",
            "secondary": "Remove unused resident fallback data and replace repeated resident tables with VRAM fill/streaming.",
            "avoid": "Do not solve resident ROM pressure by copying whole worlds into RAM.",
            "largestContributors": largest_resident_contributors,
        },
        "residentBankAnalysis": resident_bank_analysis,
        "residentRegenerationReadiness": resident_regeneration_readiness,
        "residentContributors": resident_bank_analysis.get("topContributors", []),
        "resolverCandidates": resolver_candidates,
        "resolverAttempts": resolver_attempts or [],
        "automaticResolutionPlan": build_msx2_automatic_resolution_plan(
            "msx2_screen4_megarom_compile_resolution_plan",
            resolver_candidates,
            resolver_attempts,
        ),
    }
    failure_path = artifact_dir / "msx2_compile_failure.json"
    failure_path.write_text(
        json.dumps(failure_summary, indent=2) + "\n",
        encoding="utf-8",
    )
    return failure_path


def _strip_asm_comment(line: str) -> str:
    in_string = False
    quote_char = ""
    for index, char in enumerate(line):
        if char in {"'", '"'}:
            if in_string and char == quote_char:
                in_string = False
                quote_char = ""
            elif not in_string:
                in_string = True
                quote_char = char
        elif char == ";" and not in_string:
            return line[:index]
    return line


def _split_asm_args(arg_text: str) -> list[str]:
    args: list[str] = []
    current: list[str] = []
    in_string = False
    quote_char = ""
    for char in arg_text:
        if char in {"'", '"'}:
            current.append(char)
            if in_string and char == quote_char:
                in_string = False
                quote_char = ""
            elif not in_string:
                in_string = True
                quote_char = char
            continue
        if char == "," and not in_string:
            value = "".join(current).strip()
            if value:
                args.append(value)
            current = []
            continue
        current.append(char)
    value = "".join(current).strip()
    if value:
        args.append(value)
    return args


def _parse_asm_int(value: str) -> int | None:
    text = value.strip()
    if not text:
        return None
    negative = text.startswith("-")
    if negative:
        text = text[1:].strip()
    try:
        if text.startswith("#"):
            parsed = int(text[1:], 16)
        elif text.lower().endswith("h") and re.fullmatch(r"[0-9a-fA-F]+h", text):
            parsed = int(text[:-1], 16)
        elif text.startswith("$") and re.fullmatch(r"\$[0-9a-fA-F]+", text):
            parsed = int(text[1:], 16)
        elif re.fullmatch(r"\d+", text):
            parsed = int(text, 10)
        else:
            return None
    except ValueError:
        return None
    return -parsed if negative else parsed


def _estimate_asm_data_bytes(line: str) -> int:
    code = _strip_asm_comment(line).strip()
    if not code:
        return 0
    match = re.match(r"^(?:[A-Za-z0-9_.$]+:\s*)?(db|defb|byte|dw|defw|word|ds|defs)\b\s*(.*)$", code, flags=re.IGNORECASE)
    if not match:
        return 0
    directive = match.group(1).lower()
    args = _split_asm_args(match.group(2))
    if directive in {"db", "defb", "byte"}:
        total = 0
        for arg in args:
            string_match = re.fullmatch(r"""(?:"([^"]*)"|'([^']*)')""", arg.strip())
            if string_match:
                total += len((string_match.group(1) if string_match.group(1) is not None else string_match.group(2)).encode("latin1", errors="replace"))
            else:
                total += 1
        return total
    if directive in {"dw", "defw", "word"}:
        return len(args) * 2
    if directive in {"ds", "defs"} and args:
        parsed = _parse_asm_int(args[0])
        return max(0, parsed or 0)
    return 0


def _classify_resident_label(label: str) -> str:
    upper = label.upper()
    if upper.startswith("MSX2_SCREEN4_DATA_BANK") or upper.endswith("_PHYS_START") or upper.endswith("_ROM_START") or upper.endswith("_USED_END"):
        return "bank_marker"
    if upper.endswith("_COLLISION") or upper.endswith("_BEHAVIOR") or upper.endswith("_EFFECTS"):
        return "screen_runtime_layer"
    if upper.startswith("LOAD_") and upper.endswith("_SCREEN4"):
        return "screen_loader"
    if "MAPPER" in upper or upper.startswith("KONAMI"):
        return "mapper"
    if "SPRITE" in upper:
        return "sprite_runtime"
    if "PROJECTILE" in upper:
        return "projectile_runtime"
    if "HUD" in upper or "FONT" in upper:
        return "hud_runtime"
    if upper.startswith("INIT_") or upper.startswith("RESET_"):
        return "boot_or_init"
    if upper.endswith("_DATA") or upper.endswith("_TABLE") or upper.endswith("_PATTERNS") or upper.endswith("_COLORS") or upper.endswith("_NAMES"):
        return "data"
    return "runtime_code"


def _extract_overflow_bytes_from_reason(reason: str) -> int | None:
    match = re.search(r"negative\s+#C000\s+padding\s+\((-?\d+)\s+bytes\)", reason, flags=re.IGNORECASE)
    if not match:
        match = re.search(r"negative\s+DS\s+padding\s+\((-?\d+)\s+bytes\)", reason, flags=re.IGNORECASE)
    if not match:
        return None
    try:
        return abs(int(match.group(1)))
    except ValueError:
        return None


def analyze_msx2_resident_asm_contributors(asm_text: str, limit: int = 12, overflow_bytes: int | None = None) -> dict[str, object]:
    if not asm_text:
        return {
            "scope": "msx2_screen4_resident_label_spans",
            "status": "unavailable",
            "reason": "ASM text is empty or unavailable.",
            "topContributors": [],
        }

    cold_marker = re.search(
        r"(?m)^(?:;.*MSX2 SCREEN 4 cold data bank.*|MSX2_SCREEN4_DATA_BANK(?:_0)?_(?:PHYS_START|ROM_START):)",
        asm_text,
        flags=re.IGNORECASE,
    )
    resident_text = asm_text[:cold_marker.start()] if cold_marker else asm_text
    label_matches = list(re.finditer(r"(?m)^([A-Za-z_.$][A-Za-z0-9_.$]*):\s*(?:;.*)?$", resident_text))
    contributors: list[dict[str, object]] = []
    ignore_categories = {"bank_marker"}
    for index, match in enumerate(label_matches):
        label = match.group(1)
        span_start = match.end()
        span_end = label_matches[index + 1].start() if index + 1 < len(label_matches) else len(resident_text)
        span = resident_text[span_start:span_end]
        start_line = resident_text.count("\n", 0, match.start()) + 1
        end_line = resident_text.count("\n", 0, span_end) + 1
        lines = [line for line in span.splitlines() if line.strip() and not line.lstrip().startswith(";")]
        data_bytes = sum(_estimate_asm_data_bytes(line) for line in lines)
        source_bytes = len(span.encode("utf-8", errors="replace"))
        category = _classify_resident_label(label)
        if category in ignore_categories:
            continue
        if source_bytes <= 0 and data_bytes <= 0:
            continue
        contributors.append({
            "label": label,
            "category": category,
            "estimatedBytes": data_bytes,
            "sourceBytes": source_bytes,
            "lineCount": len(lines),
            "startLine": start_line,
            "endLine": end_line,
            "moveCandidate": category in {"screen_runtime_layer", "data"},
        })

    contributors.sort(
        key=lambda item: (
            int(item.get("estimatedBytes") or 0),
            int(item.get("sourceBytes") or 0),
        ),
        reverse=True,
    )
    return {
        "scope": "msx2_screen4_resident_label_spans",
        "status": "ok" if contributors else "empty",
        "window": {
            "start": "#4000",
            "limit": "#C000",
            "limitBytes": 32768,
            "overflowBytes": overflow_bytes,
        },
        "coldBankMarkerFound": bool(cold_marker),
        "rankingBasis": "estimatedBytes from obvious data directives first, then sourceBytes; Z80 instruction sizes are not assembled in this pre-Glass diagnostic.",
        "topContributors": contributors[:limit],
    }


def write_msx2_ide_budget_feedback(
    artifact_dir: Path,
    project_slice: dict,
    logical_budget: dict,
    ram_budget: dict,
    world_package_summary: list,
    warnings: list,
    warning_banks: list,
    ram_warnings: list,
) -> Path:
    bank_size = int(logical_budget.get("bankSizeBytes") or 8192)
    total_payload = int(logical_budget.get("totalPayloadBytes") or 0)
    warning_threshold = int(logical_budget.get("warningThresholdBytes") or 0)
    packages = [
        package for package in (logical_budget.get("packages") or [])
        if isinstance(package, dict)
    ]
    largest_packages = sorted(
        packages,
        key=lambda item: int(item.get("usedBytes") or 0),
        reverse=True,
    )[:8]
    suggested_fixes = [
        {
            "severity": item.get("severity", "info"),
            "target": item.get("target"),
            "reason": item.get("reason"),
            "action": item.get("action"),
        }
        for item in (logical_budget.get("recoveryRecommendations") or [])
        if isinstance(item, dict)
    ]
    suggested_fixes.extend(
        {
            "severity": step.get("status", "info"),
            "target": ", ".join(str(target) for target in (step.get("appliesTo") or [])) or step.get("id"),
            "reason": step.get("trigger"),
            "action": step.get("action"),
        }
        for step in (logical_budget.get("recoveryPlan") or [])
        if isinstance(step, dict) and step.get("status") in {"recommended", "required", "enforced"}
    )
    suggested_fixes.extend(
        {
            "severity": item.get("severity", "info"),
            "target": item.get("target"),
            "reason": item.get("reason"),
            "action": item.get("action"),
        }
        for item in (ram_budget.get("recommendations") or [])
        if isinstance(item, dict) and item.get("severity") in {"warning", "plan_b"}
    )
    pressure_status = "ok"
    if warnings or warning_banks or ram_warnings:
        pressure_status = "warning"
    if logical_budget.get("overBudgetPackages") or ram_budget.get("status") not in {"ok", None}:
        pressure_status = "error"
    included_runtime_modules = project_slice.get("includedRuntimeModuleDetails")
    if not isinstance(included_runtime_modules, list):
        included_runtime_modules = [
            {"id": module_id, "placement": "unknown"}
            for module_id in (project_slice.get("includedRuntimeModules") or [])
        ]
    excluded_runtime_modules = project_slice.get("excludedRuntimeModules") or []
    runtime_module_details = project_slice.get("runtimeModuleDetails")
    if not isinstance(runtime_module_details, list):
        runtime_module_details = (
            [{**module, "included": True} for module in included_runtime_modules if isinstance(module, dict)]
            + [{**module, "included": False} for module in excluded_runtime_modules if isinstance(module, dict)]
        )
    feedback = {
        "scope": "msx2_screen4_ide_budget_feedback",
        "status": pressure_status,
        "project": {
            "name": project_slice.get("projectName"),
            "backend": project_slice.get("backend"),
            "screenMode": project_slice.get("screenMode"),
            "romMode": project_slice.get("romMode"),
            "mapper": project_slice.get("mapper"),
        },
        "rom": {
            "bankSizeBytes": bank_size,
            "payloadBytes": total_payload,
            "estimatedPackedBankCount": int(logical_budget.get("estimatedPackedBankCount") or 0),
            "warningThresholdBytes": warning_threshold,
            "usedPercentOfSingleBank": round((total_payload / bank_size) * 100, 2) if bank_size else 0,
            "warningBankCount": len(warning_banks),
            "warningRecommendationCount": len(warnings),
            "bankClassSummary": logical_budget.get("bankClassSummary") or [],
        },
        "ram": {
            "start": ram_budget.get("start"),
            "limit": ram_budget.get("limit"),
            "usedBytes": int(ram_budget.get("usedBytes") or 0),
            "freeBytes": int(ram_budget.get("freeBytes") or 0),
            "status": ram_budget.get("status", "unknown"),
            "warningCount": len(ram_warnings),
            "sections": ram_budget.get("sections") or [],
        },
        "runtimeModules": {
            "included": included_runtime_modules,
            "excluded": excluded_runtime_modules,
            "all": runtime_module_details,
            "includedCount": len(included_runtime_modules),
            "residentCount": sum(1 for item in included_runtime_modules if isinstance(item, dict) and item.get("placement") == "resident"),
            "farCodeCount": sum(1 for item in included_runtime_modules if isinstance(item, dict) and item.get("placement") == "far_code"),
            "worldSpecificCount": sum(1 for item in included_runtime_modules if isinstance(item, dict) and item.get("placement") == "world_specific"),
        },
        "worldBankManifest": {
            "worldCount": len((project_slice.get("worldBankManifest") or {}).get("worlds") or []),
            "estimatedPhysicalBankCount": len((project_slice.get("worldBankManifest") or {}).get("estimatedPhysicalBanks") or []),
            "dataWindowAddress": (project_slice.get("worldBankManifest") or {}).get("dataWindowAddress"),
            "packageCount": sum(
                len(world.get("packages") or [])
                for world in ((project_slice.get("worldBankManifest") or {}).get("worlds") or [])
                if isinstance(world, dict)
            ),
            "warningBankCount": sum(
                1
                for bank in ((project_slice.get("worldBankManifest") or {}).get("estimatedPhysicalBanks") or [])
                if isinstance(bank, dict) and (bank.get("status") == "warning" or bank.get("warning") is True)
            ),
            "overBudgetBankCount": sum(
                1
                for bank in ((project_slice.get("worldBankManifest") or {}).get("estimatedPhysicalBanks") or [])
                if isinstance(bank, dict) and (bank.get("status") == "error" or int(bank.get("overBudgetBytes") or 0) > 0)
            ),
            "worlds": (project_slice.get("worldBankManifest") or {}).get("worlds") or [],
            "estimatedPhysicalBanks": (project_slice.get("worldBankManifest") or {}).get("estimatedPhysicalBanks") or [],
        },
        "worldPackages": world_package_summary,
        "largestAssets": [
            {
                "id": item.get("id"),
                "usedBytes": int(item.get("usedBytes") or 0),
                "bankClass": item.get("recommendedBankClass"),
                "warning": bool(item.get("warning")),
                "overBudgetBytes": int(item.get("overBudgetBytes") or 0),
            }
            for item in largest_packages
        ],
        "warnings": {
            "romRecommendations": warnings,
            "warningPackedBanks": warning_banks,
            "ramRecommendations": ram_warnings,
        },
        "suggestedFixes": suggested_fixes,
    }
    feedback_path = artifact_dir / "msx2_ide_budget_feedback.json"
    feedback_path.write_text(
        json.dumps(feedback, indent=2) + "\n",
        encoding="utf-8",
    )
    return feedback_path


def validate_msx2_screen4_megarom_preflight_budget(
    artifact_dir: Path | None,
    strict_warnings: bool = False,
) -> None:
    if artifact_dir is None:
        return
    project_slice_path = artifact_dir / "project_slice.json"
    if not project_slice_path.exists():
        return

    project_slice = read_preflight_json_artifact(project_slice_path, "project_slice.json")
    if not isinstance(project_slice, dict):
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json root must be an object")
    if project_slice.get("scope") != "msx2_screen4_project_slice":
        return
    preflight_summary_path = artifact_dir / "preflight_summary.json"
    if preflight_summary_path.exists():
        preflight_summary_path.unlink()
    ide_budget_feedback_path = artifact_dir / "msx2_ide_budget_feedback.json"
    if ide_budget_feedback_path.exists():
        ide_budget_feedback_path.unlink()
    build_summary_path = artifact_dir / "msx2_build_summary.json"
    if build_summary_path.exists():
        build_summary_path.unlink()
    failure_summary_path = artifact_dir / "msx2_preflight_failure.json"
    if failure_summary_path.exists():
        failure_summary_path.unlink()

    included_runtime_modules = project_slice.get("includedRuntimeModules")
    included_runtime_module_details = project_slice.get("includedRuntimeModuleDetails")
    excluded_runtime_modules = project_slice.get("excludedRuntimeModules")
    allowed_runtime_placements = {"resident", "far_code", "world_specific", "metadata"}
    if not isinstance(included_runtime_modules, list) or not included_runtime_modules:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no includedRuntimeModules")
    if not isinstance(included_runtime_module_details, list) or not included_runtime_module_details:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no includedRuntimeModuleDetails")
    detail_ids = {item.get("id") for item in included_runtime_module_details if isinstance(item, dict)}
    if set(included_runtime_modules) != detail_ids:
        raise RuntimeError("MSX2 MegaROM preflight failed: includedRuntimeModuleDetails do not match includedRuntimeModules")
    for module in included_runtime_module_details:
        if not isinstance(module, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid runtime module detail: {module}")
        if not module.get("id") or not module.get("reason"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: runtime module detail lacks id/reason: {module}")
        if module.get("placement") not in allowed_runtime_placements:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: runtime module has invalid placement: {module}")
    if not isinstance(excluded_runtime_modules, list):
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no excludedRuntimeModules")
    for module in excluded_runtime_modules:
        if not isinstance(module, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid excluded runtime module: {module}")
        if not module.get("id") or not module.get("reason"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: excluded runtime module lacks id/reason: {module}")
        if module.get("placement") not in allowed_runtime_placements:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: excluded runtime module has invalid placement: {module}")
    screen4_runtime_layer_policy = project_slice.get("screen4RuntimeLayerPolicy")
    if not isinstance(screen4_runtime_layer_policy, dict):
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no screen4RuntimeLayerPolicy")
    for layer_id in ("collision", "behavior", "effects"):
        layer_policy = screen4_runtime_layer_policy.get(layer_id)
        if not isinstance(layer_policy, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: missing screen4RuntimeLayerPolicy.{layer_id}")
        if int(layer_policy.get("bytesPerScreen") or 0) != 192:
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"screen4RuntimeLayerPolicy.{layer_id} must match current 16x12 layer bytes: {layer_policy}"
            )
    for layer_id in ("collision", "behavior"):
        layer_policy = screen4_runtime_layer_policy.get(layer_id) or {}
        if layer_policy.get("definitionPlacement") == "world_data_bank" and (
            layer_policy.get("runtimePlacement") != "ram_cache"
            or layer_policy.get("cacheScope") != "current_screen"
        ):
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"screen4RuntimeLayerPolicy.{layer_id} must use current_screen RAM cache when stored in world data banks"
            )
    effects_policy = screen4_runtime_layer_policy.get("effects") or {}
    if effects_policy.get("definitionPlacement") == "world_data_bank" and (
        effects_policy.get("runtimePlacement") != "persistent_ram"
        or effects_policy.get("cacheScope") != "per_screen"
    ):
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            "screen4RuntimeLayerPolicy.effects must use per_screen persistent RAM when stored in world data banks"
        )

    storage_policy = project_slice.get("assetStoragePolicy")
    if not isinstance(storage_policy, list) or not storage_policy:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no assetStoragePolicy")
    storage_policy_path = artifact_dir / "asset_storage_policy.json"
    storage_policy_artifact = read_preflight_json_artifact(storage_policy_path, "asset_storage_policy.json")
    if storage_policy_artifact != storage_policy:
        raise RuntimeError("MSX2 MegaROM preflight failed: asset_storage_policy.json differs from project_slice.json")
    screen_policies = [
        policy for policy in storage_policy
        if isinstance(policy, dict) and policy.get("type") == "msx2screen"
    ]
    if not screen_policies:
        raise RuntimeError("MSX2 MegaROM preflight failed: assetStoragePolicy has no reachable msx2screen entries")
    for policy in screen_policies:
        parts = policy.get("parts")
        if not isinstance(parts, list) or not parts:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: msx2screen storage policy has no parts: {policy}")
        runtime_part = next(
            (
                part for part in parts
                if isinstance(part, dict) and part.get("name") == "runtimeLayersAndSpawns"
            ),
            None,
        )
        if not isinstance(runtime_part, dict):
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"msx2screen storage policy lacks runtimeLayersAndSpawns part: {policy.get('id')}"
            )
        if (
            runtime_part.get("decision") != "ROM_RAW"
            or runtime_part.get("placement") != "world_data_bank"
            or runtime_part.get("runtimePlacement") != "ram_cache_for_collision_behavior_and_persistent_ram_for_effects"
        ):
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                "SCREEN 4 runtime layers must remain raw in world data banks and use only the current-screen RAM cache: "
                f"{runtime_part}"
            )
    world_package_summary = project_slice.get("worldPackageSummary")
    if not isinstance(world_package_summary, list) or not world_package_summary:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no worldPackageSummary")
    world_bank_manifest = project_slice.get("worldBankManifest")
    if not isinstance(world_bank_manifest, dict) or world_bank_manifest.get("scope") != "msx2_screen4_world_bank_manifest":
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no worldBankManifest")
    world_bank_manifest_path = artifact_dir / "msx2_world_bank_manifest.json"
    world_bank_manifest_artifact = read_preflight_json_artifact(world_bank_manifest_path, "msx2_world_bank_manifest.json")
    if world_bank_manifest_artifact != world_bank_manifest:
        raise RuntimeError("MSX2 MegaROM preflight failed: msx2_world_bank_manifest.json differs from project_slice.json")
    manifest_worlds = world_bank_manifest.get("worlds")
    if not isinstance(manifest_worlds, list) or not manifest_worlds:
        raise RuntimeError("MSX2 MegaROM preflight failed: worldBankManifest has no worlds")
    manifest_physical_banks = world_bank_manifest.get("estimatedPhysicalBanks")
    if not isinstance(manifest_physical_banks, list) or not manifest_physical_banks:
        raise RuntimeError("MSX2 MegaROM preflight failed: worldBankManifest has no estimatedPhysicalBanks")
    for physical_bank in manifest_physical_banks:
        if not isinstance(physical_bank, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest physical bank: {physical_bank}")
        if int(physical_bank.get("bankSizeBytes") or 0) != 8192:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest bankSizeBytes: {physical_bank}")
        if int(physical_bank.get("warningThresholdBytes") or 0) <= 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest bank missing warningThresholdBytes: {physical_bank}")
        if int(physical_bank.get("usedBytes") or 0) <= 0 or int(physical_bank.get("freeBytes") or 0) < 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest bank usage: {physical_bank}")
        if int(physical_bank.get("overBudgetBytes") or 0) < 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest overBudgetBytes: {physical_bank}")
        if physical_bank.get("status") not in {"ok", "warning", "error"}:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest bank status: {physical_bank}")
        if not isinstance(physical_bank.get("packages"), list) or not physical_bank.get("packages"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest bank has no packages: {physical_bank}")
    manifest_world_ids = {item.get("worldId") for item in manifest_worlds if isinstance(item, dict)}
    entry_world_ids = set((project_slice.get("entryPoints") or {}).get("worldIds") or [])
    summary_world_ids = {item.get("worldId") for item in world_package_summary if isinstance(item, dict)}
    missing_world_summaries = sorted(entry_world_ids - summary_world_ids)
    if missing_world_summaries:
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"worldPackageSummary missing entry point worlds: {', '.join(missing_world_summaries)}"
        )
    for world_summary in world_package_summary:
        if not isinstance(world_summary, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldPackageSummary entry: {world_summary}")
        world_id = world_summary.get("worldId")
        estimated_bytes = int(world_summary.get("estimatedBytes") or 0)
        if not world_id or estimated_bytes <= 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldPackageSummary budget: {world_summary}")
        if world_id not in manifest_world_ids:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest missing world: {world_id}")
        manifest_world = next((item for item in manifest_worlds if isinstance(item, dict) and item.get("worldId") == world_id), None)
        if not isinstance(manifest_world, dict) or not isinstance(manifest_world.get("packages"), list) or not manifest_world.get("packages"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest world has no packages: {world_id}")
        for package in manifest_world.get("packages"):
            if not isinstance(package, dict):
                raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid worldBankManifest package: {package}")
            if not package.get("packageId") or not package.get("logicalSection") or not package.get("windowAddress"):
                raise RuntimeError(f"MSX2 MegaROM preflight failed: incomplete worldBankManifest package: {package}")
            if int(package.get("storedBytes") or 0) <= 0:
                raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest package has invalid storedBytes: {package}")
        if int(world_summary.get("screenCount") or 0) <= 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldPackageSummary has no reachable screens: {world_summary}")
        bank_class_bytes = world_summary.get("bankClassBytes")
        if not isinstance(bank_class_bytes, list) or not bank_class_bytes:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldPackageSummary has no bankClassBytes: {world_summary}")
        bank_class_total = sum(int(item.get("usedBytes") or 0) for item in bank_class_bytes if isinstance(item, dict))
        if bank_class_total != estimated_bytes:
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"worldPackageSummary class total {bank_class_total} differs from estimatedBytes {estimated_bytes}"
            )
        owner_policy_total = sum(
            int(policy.get("storedBytesEstimate") or 0)
            for policy in storage_policy
            if policy.get("decision") != "INHERIT_OWNER_SCREEN_POLICY"
            and world_id in (policy.get("ownerWorldIds") or ([policy.get("id")] if policy.get("type") == "worldmap" else []))
        )
        if owner_policy_total != estimated_bytes:
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"worldPackageSummary estimatedBytes for {world_id} differ from owner asset policies: "
                f"{estimated_bytes} != {owner_policy_total}"
            )

    logical_budget = project_slice.get("logicalBankBudget")
    if not isinstance(logical_budget, dict) or not logical_budget:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no logicalBankBudget")
    budget_path = artifact_dir / "logical_bank_budget.json"
    budget_artifact = read_preflight_json_artifact(budget_path, "logical_bank_budget.json")
    if budget_artifact != logical_budget:
        raise RuntimeError("MSX2 MegaROM preflight failed: logical_bank_budget.json differs from project_slice.json")
    split_packages = logical_budget.get("splitPackages") or []
    split_chunk_manifest = logical_budget.get("splitChunkManifest") or []
    logical_bank_size = int(logical_budget.get("bankSizeBytes") or 8192)
    if split_packages:
        if not isinstance(split_chunk_manifest, list) or len(split_chunk_manifest) != len(split_packages):
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                "logicalBankBudget splitPackages must include one splitChunkManifest entry per chunk"
            )
        chunk_ids = {str(item.get("id") or item.get("chunkId") or "") for item in split_packages if isinstance(item, dict)}
        manifest_chunk_ids = {
            str(item.get("chunkId") or "")
            for item in split_chunk_manifest
            if isinstance(item, dict)
        }
        if chunk_ids != manifest_chunk_ids:
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                "logicalBankBudget splitChunkManifest does not match splitPackages"
            )
        for chunk in split_chunk_manifest:
            if not isinstance(chunk, dict):
                raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid splitChunkManifest entry: {chunk}")
            required_chunk_fields = ("chunkId", "splitFrom", "labelStem", "dataLabel", "dataEndLabel", "dataBankSymbol", "loaderSymbol", "windowAddress", "payloadLabels")
            missing_chunk_fields = [field for field in required_chunk_fields if not chunk.get(field)]
            if missing_chunk_fields:
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest entry is missing {', '.join(missing_chunk_fields)}: {chunk}"
                )
            payload_labels = chunk.get("payloadLabels")
            if not isinstance(payload_labels, list) or not all(isinstance(label, str) and label for label in payload_labels):
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest payloadLabels must be a non-empty list of ASM labels: {chunk}"
                )
            if "payloadLabelCount" in chunk:
                try:
                    payload_label_count = int(chunk.get("payloadLabelCount") or 0)
                except (TypeError, ValueError):
                    payload_label_count = -1
                if payload_label_count != len(payload_labels):
                    raise RuntimeError(
                        "MSX2 MegaROM preflight failed: "
                        f"splitChunkManifest payloadLabelCount does not match payloadLabels: {chunk}"
                    )
            if "payloadBytes" in chunk:
                try:
                    payload_bytes = int(chunk.get("payloadBytes") or 0)
                except (TypeError, ValueError):
                    payload_bytes = -1
                if payload_bytes < 0:
                    raise RuntimeError(
                        "MSX2 MegaROM preflight failed: "
                        f"splitChunkManifest payloadBytes must be a non-negative integer: {chunk}"
                    )
                if payload_bytes > logical_bank_size:
                    raise RuntimeError(
                        "MSX2 MegaROM preflight failed: "
                        f"splitChunkManifest payloadBytes exceeds one 8KB bank: {payload_bytes} > {logical_bank_size}: {chunk}"
                    )
            if not chunk.get("loaderCoverageStatus"):
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest entry is missing loaderCoverageStatus: {chunk}"
                )
            if chunk.get("loaderCoverageStatus") != "covered":
                uncovered_labels = chunk.get("loaderUncoveredPayloadLabels") or []
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest loader coverage is incomplete for payload labels {uncovered_labels}: {chunk}"
                )
            covered_labels = chunk.get("loaderCoveredPayloadLabels") or []
            if not isinstance(covered_labels, list) or sorted(covered_labels) != sorted(payload_labels):
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest loaderCoveredPayloadLabels must match payloadLabels: {chunk}"
                )
            if chunk.get("windowAddress") != "#8000":
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"splitChunkManifest chunks must target the SCREEN 4 #8000 data window: {chunk}"
                )

    ram_budget = project_slice.get("ramBudget")
    if not isinstance(ram_budget, dict) or not ram_budget:
        raise RuntimeError("MSX2 MegaROM preflight failed: project_slice.json has no ramBudget")
    ram_budget_path = artifact_dir / "ram_budget.json"
    ram_budget_artifact = read_preflight_json_artifact(ram_budget_path, "ram_budget.json")
    if ram_budget_artifact != ram_budget:
        raise RuntimeError("MSX2 MegaROM preflight failed: ram_budget.json differs from project_slice.json")
    if ram_budget.get("scope") != "msx2_screen4_ram_budget":
        raise RuntimeError("MSX2 MegaROM preflight failed: ramBudget has invalid scope")
    if ram_budget.get("status") == "error":
        write_msx2_preflight_failure_summary(
            artifact_dir=artifact_dir,
            reason="ram_budget_failed",
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={"ramBudget": ram_budget},
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            f"runtime RAM exceeds limit: {ram_budget}"
        )
    if ram_budget.get("start") != "#C000":
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"runtime RAM start must be #C000, got {ram_budget.get('start')}"
        )
    if ram_budget.get("limit") != "#F300":
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"runtime RAM limit must be #F300, got {ram_budget.get('limit')}"
        )
    if int(ram_budget.get("usedBytes") or 0) <= 0:
        raise RuntimeError("MSX2 MegaROM preflight failed: runtime RAM usedBytes must be positive")
    if int(ram_budget.get("freeBytes") or -1) < 0:
        write_msx2_preflight_failure_summary(
            artifact_dir=artifact_dir,
            reason="ram_budget_failed",
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={"ramBudget": ram_budget},
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            f"runtime RAM freeBytes is negative: {ram_budget.get('freeBytes')}"
        )
    ram_sections = ram_budget.get("sections")
    if not isinstance(ram_sections, list) or not ram_sections:
        raise RuntimeError("MSX2 MegaROM preflight failed: ramBudget has no runtime sections")
    ram_section_ids = {section.get("id") for section in ram_sections if isinstance(section, dict)}
    required_ram_sections = {"runtime.persistent_effect_layers", "runtime.effects_scratch", "runtime.enemy_pool"}
    if (
        (screen4_runtime_layer_policy.get("collision") or {}).get("runtimePlacement") == "ram_cache"
        or (screen4_runtime_layer_policy.get("behavior") or {}).get("runtimePlacement") == "ram_cache"
    ):
        required_ram_sections.update({"runtime.collision_current_cache", "runtime.behavior_current_cache"})
    missing_ram_sections = sorted(required_ram_sections - ram_section_ids)
    if missing_ram_sections:
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"ramBudget is missing required sections: {', '.join(missing_ram_sections)}"
        )
    ram_sections_by_id = {
        section.get("id"): section
        for section in ram_sections
        if isinstance(section, dict) and section.get("id")
    }
    for cache_section_id in ("runtime.collision_current_cache", "runtime.behavior_current_cache"):
        if cache_section_id in required_ram_sections:
            cache_section = ram_sections_by_id.get(cache_section_id) or {}
            if int(cache_section.get("bytes") or 0) != 192:
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"{cache_section_id} must reserve exactly one current 16x12 screen layer: {cache_section}"
                )
    ram_recommendations = ram_budget.get("recommendations")
    if not isinstance(ram_recommendations, list) or not ram_recommendations:
        raise RuntimeError("MSX2 MegaROM preflight failed: ramBudget has no recommendations")
    error_ram_recommendations = [
        item for item in ram_recommendations
        if isinstance(item, dict) and item.get("severity") == "error"
    ]
    if error_ram_recommendations:
        write_msx2_preflight_failure_summary(
            artifact_dir=artifact_dir,
            reason="ram_budget_failed",
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={"errorRamRecommendations": error_ram_recommendations},
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            f"runtime RAM recommendations include errors: {error_ram_recommendations}"
        )

    bank_size = int(logical_budget.get("bankSizeBytes") or 0)
    if bank_size != 8192:
        raise RuntimeError(f"MSX2 MegaROM preflight failed: expected 8192-byte logical banks, got {bank_size}")
    over_budget_packages = logical_budget.get("overBudgetPackages")
    if not isinstance(over_budget_packages, list):
        raise RuntimeError("MSX2 MegaROM preflight failed: logicalBankBudget has no overBudgetPackages list")
    if over_budget_packages:
        details = ", ".join(
            str(item.get("id") or item.get("sourceId") or item)
            for item in over_budget_packages
            if isinstance(item, dict)
        )
        recovery_steps = [
            f"{step.get('id')}={step.get('status')}"
            for step in (logical_budget.get("recoveryPlan") or [])
            if isinstance(step, dict) and step.get("status") in {"required", "recommended"}
        ]
        recovery_hint = "; Plan B: " + ", ".join(recovery_steps) if recovery_steps else ""
        write_msx2_preflight_failure_summary(
            artifact_dir=artifact_dir,
            reason="logical_package_over_budget",
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={
                "overBudgetPackages": over_budget_packages,
                "recoveryHint": recovery_hint,
            },
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            f"logical packages exceed one 8KB bank: {details}{recovery_hint}"
        )
    bank_class_summary = logical_budget.get("bankClassSummary")
    if not isinstance(bank_class_summary, list) or not bank_class_summary:
        raise RuntimeError("MSX2 MegaROM preflight failed: logicalBankBudget has no bankClassSummary")
    bank_class_total = 0
    for class_entry in bank_class_summary:
        if not isinstance(class_entry, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid bankClassSummary entry: {class_entry}")
        class_id = class_entry.get("id")
        class_used = int(class_entry.get("usedBytes") or 0)
        bank_class_total += class_used
        largest_class_package = class_entry.get("largestPackage")
        if not class_id or class_used <= 0 or int(class_entry.get("packageCount") or 0) <= 0:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid bankClassSummary budget: {class_entry}")
        if (
            not isinstance(largest_class_package, dict)
            or not largest_class_package.get("id")
            or int(largest_class_package.get("usedBytes") or 0) <= 0
        ):
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"bankClassSummary entry has no largestPackage: {class_entry}"
            )
    if bank_class_total != int(logical_budget.get("totalPayloadBytes") or 0):
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            f"bankClassSummary total {bank_class_total} differs from payload {logical_budget.get('totalPayloadBytes')}"
        )
    recovery_plan = logical_budget.get("recoveryPlan")
    if not isinstance(recovery_plan, list) or len(recovery_plan) < 8:
        raise RuntimeError("MSX2 MegaROM preflight failed: logicalBankBudget has no complete recoveryPlan")
    expected_recovery_order = [
        "repack_final_sizes",
        "split_world_packages",
        "move_cold_readonly_data",
        "selective_zx0",
        "keep_hot_runtime_raw",
        "world_special_code_bank",
        "split_large_payload_chunks",
        "fail_actionable_report",
    ]
    actual_recovery_order = [item.get("id") for item in recovery_plan if isinstance(item, dict)]
    if actual_recovery_order[: len(expected_recovery_order)] != expected_recovery_order:
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: recoveryPlan order is invalid: "
            f"{actual_recovery_order}"
        )
    for index, step in enumerate(recovery_plan, start=1):
        if not isinstance(step, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid recoveryPlan step: {step}")
        if int(step.get("order") or 0) != index or not step.get("status") or not step.get("action"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: incomplete recoveryPlan step: {step}")

    for bank in logical_budget.get("estimatedPackedBanks") or []:
        if int(bank.get("overBudgetBytes") or 0) > 0:
            write_msx2_preflight_failure_summary(
                artifact_dir=artifact_dir,
                reason="estimated_packed_bank_over_budget",
                project_slice=project_slice,
                logical_budget=logical_budget,
                ram_budget=ram_budget,
                details={"bank": bank},
            )
            raise RuntimeError(
                "MSX2 MegaROM preflight failed before Glass: "
                f"estimated packed bank exceeds one 8KB bank: {bank}"
            )

    packages = logical_budget.get("packages") or []
    packed_banks = logical_budget.get("estimatedPackedBanks") or []
    total_payload = int(logical_budget.get("totalPayloadBytes") or 0)
    estimated_count = int(logical_budget.get("estimatedPackedBankCount") or 0)
    if not isinstance(packed_banks, list) or not packed_banks:
        raise RuntimeError("MSX2 MegaROM preflight failed: logicalBankBudget has no estimatedPackedBanks")
    if estimated_count != len(packed_banks):
        raise RuntimeError("MSX2 MegaROM preflight failed: estimatedPackedBankCount does not match estimatedPackedBanks length")
    screen4_data_bank_plan = project_slice.get("screen4DataBankPlan") if isinstance(project_slice, dict) else None
    split_packages = logical_budget.get("splitPackages") or []
    multi_bank_loader_supported = (
        isinstance(screen4_data_bank_plan, dict)
        and screen4_data_bank_plan.get("supported") is True
        and int(screen4_data_bank_plan.get("bankCount") or 0) >= estimated_count
        and not split_packages
    )
    if estimated_count > 1 and not multi_bank_loader_supported:
        write_msx2_loader_capability_failure_summary(
            artifact_dir=artifact_dir,
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={
                "estimatedPackedBankCount": estimated_count,
                "currentLoaderDataWindow": "#8000-#9FFF",
                "requiredFeature": "multi-bank SCREEN 4 world data loader",
                "splitPackages": split_packages,
                "screen4DataBankPlan": screen4_data_bank_plan,
                "estimatedPackedBanks": packed_banks,
            },
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            f"SCREEN 4 data requires {estimated_count} estimated 8KB data banks, "
            "but the current loader cannot safely map that bank plan."
        )
    if len(manifest_physical_banks) != len(packed_banks):
        raise RuntimeError(
            "MSX2 MegaROM preflight failed: "
            "worldBankManifest estimatedPhysicalBanks length differs from logicalBankBudget estimatedPackedBanks"
        )
    manifest_bank_by_index = {
        int(bank.get("bankIndex") or 0): bank
        for bank in manifest_physical_banks
        if isinstance(bank, dict)
    }
    for bank in packed_banks:
        if not isinstance(bank, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: invalid estimated packed bank: {bank}")
        bank_index = int(bank.get("bankIndex") or 0)
        used = int(bank.get("usedBytes") or 0)
        free = int(bank.get("freeBytes") or 0)
        if used <= 0 or used + free != bank_size:
            raise RuntimeError(f"MSX2 MegaROM preflight failed: estimated packed bank has invalid used/free bytes: {bank}")
        if not isinstance(bank.get("packages"), list) or not bank.get("packages"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: estimated packed bank has no package list: {bank}")
        manifest_bank = manifest_bank_by_index.get(bank_index)
        if not isinstance(manifest_bank, dict):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest missing physical bank {bank_index}")
        expected_status = "error" if int(bank.get("overBudgetBytes") or 0) > 0 else "warning" if bool(bank.get("warning")) else "ok"
        comparisons = {
            "usedBytes": used,
            "freeBytes": free,
            "warningThresholdBytes": int(logical_budget.get("warningThresholdBytes") or 0),
            "overBudgetBytes": int(bank.get("overBudgetBytes") or 0),
        }
        for field, expected_value in comparisons.items():
            if int(manifest_bank.get(field) or 0) != expected_value:
                raise RuntimeError(
                    "MSX2 MegaROM preflight failed: "
                    f"worldBankManifest bank {bank_index} {field} differs from logicalBankBudget: "
                    f"{manifest_bank.get(field)} != {expected_value}"
                )
        if bool(manifest_bank.get("warning")) != bool(bank.get("warning")):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest bank {bank_index} warning differs from logicalBankBudget")
        if manifest_bank.get("status") != expected_status:
            raise RuntimeError(
                "MSX2 MegaROM preflight failed: "
                f"worldBankManifest bank {bank_index} status differs from logicalBankBudget: "
                f"{manifest_bank.get('status')} != {expected_status}"
            )
        if manifest_bank.get("packages") != bank.get("packages"):
            raise RuntimeError(f"MSX2 MegaROM preflight failed: worldBankManifest bank {bank_index} packages differ from logicalBankBudget")
    largest_package = max(
        (item for item in packages if isinstance(item, dict)),
        key=lambda item: int(item.get("usedBytes") or 0),
        default=None,
    )
    largest_label = "none"
    if largest_package:
        largest_label = f"{largest_package.get('id', 'unknown')}={int(largest_package.get('usedBytes') or 0)} bytes"
    print(
        "MSX2 MegaROM preflight: "
        f"payload={total_payload} bytes, "
        f"estimatedBanks={estimated_count}, "
        f"packages={len(packages)}, "
        f"largest={largest_label}"
    )
    class_summaries = ", ".join(
        f"{item.get('id')}={int(item.get('usedBytes') or 0)} bytes/{int(item.get('packageCount') or 0)} pkg"
        for item in bank_class_summary
        if isinstance(item, dict)
    )
    if class_summaries:
        print(f"MSX2 MegaROM preflight classes: {class_summaries}")
    world_summaries = ", ".join(
        f"{item.get('worldId')}={int(item.get('estimatedBytes') or 0)} bytes/{int(item.get('screenCount') or 0)} screens"
        for item in world_package_summary
        if isinstance(item, dict)
    )
    if world_summaries:
        print(f"MSX2 MegaROM preflight worlds: {world_summaries}")

    warnings = [
        item for item in (logical_budget.get("recoveryRecommendations") or [])
        if isinstance(item, dict) and item.get("severity") in {"warning", "plan_b"}
    ]
    if warnings:
        print(f"MSX2 MegaROM preflight warning: {len(warnings)} budget recommendation(s) need allocator attention")
    warning_banks = [
        bank for bank in packed_banks
        if isinstance(bank, dict) and bool(bank.get("warning"))
    ]
    if warning_banks:
        bank_summaries = ", ".join(
            f"bank{int(bank.get('bankIndex') or 0)}={int(bank.get('usedBytes') or 0)}/{bank_size}"
            for bank in warning_banks
        )
        print(f"MSX2 MegaROM preflight warning banks: {bank_summaries}")

    print(
        "MSX2 RAM preflight: "
        f"used={int(ram_budget.get('usedBytes') or 0)} bytes, "
        f"free={int(ram_budget.get('freeBytes') or 0)} bytes, "
        f"limit={ram_budget.get('limit', 'unknown')}, "
        f"status={ram_budget.get('status', 'unknown')}"
    )
    ram_warnings = [
        item for item in ram_recommendations
        if isinstance(item, dict) and item.get("severity") in {"warning", "plan_b"}
    ]
    if ram_warnings:
        print(f"MSX2 RAM preflight warning: {len(ram_warnings)} recommendation(s) need attention")
    if strict_warnings and (warnings or warning_banks or ram_warnings):
        write_msx2_preflight_failure_summary(
            artifact_dir=artifact_dir,
            reason="strict_warning_gate_rejected",
            project_slice=project_slice,
            logical_budget=logical_budget,
            ram_budget=ram_budget,
            details={
                "romWarnings": len(warnings),
                "warningBanks": warning_banks,
                "ramWarnings": len(ram_warnings),
            },
        )
        raise RuntimeError(
            "MSX2 MegaROM preflight failed before Glass: "
            "strict warning gate rejected "
            f"romWarnings={len(warnings)}, warningBanks={len(warning_banks)}, ramWarnings={len(ram_warnings)}"
        )

    ide_feedback_path = write_msx2_ide_budget_feedback(
        artifact_dir=artifact_dir,
        project_slice=project_slice,
        logical_budget=logical_budget,
        ram_budget=ram_budget,
        world_package_summary=world_package_summary,
        warnings=warnings,
        warning_banks=warning_banks,
        ram_warnings=ram_warnings,
    )

    preflight_summary = {
        "scope": "msx2_screen4_megarom_preflight_summary",
        "status": "ok",
        "artifactDir": str(artifact_dir),
        "requiredArtifacts": [
            "project_slice.json",
            "asset_storage_policy.json",
            "logical_bank_budget.json",
            "msx2_world_bank_manifest.json",
            "ram_budget.json",
        ],
        "artifactChecks": build_preflight_artifact_summaries([
            ("project_slice.json", project_slice_path),
            ("asset_storage_policy.json", storage_policy_path),
            ("logical_bank_budget.json", budget_path),
            ("msx2_world_bank_manifest.json", world_bank_manifest_path),
            ("ram_budget.json", ram_budget_path),
        ]),
        "outputArtifactChecks": build_preflight_artifact_summaries([
            ("msx2_ide_budget_feedback.json", ide_feedback_path),
        ]),
        "pipelineGates": build_msx2_preflight_gate_summary(strict_warnings),
        "rom": {
            "bankSizeBytes": bank_size,
            "payloadBytes": total_payload,
            "estimatedPackedBankCount": estimated_count,
            "packageCount": len(packages),
            "largestPackage": largest_package,
            "bankClassSummary": bank_class_summary,
            "warningCount": len(warnings),
            "warningBankCount": len(warning_banks),
        },
        "worldPackages": world_package_summary,
        "worldBankManifest": {
            "worldCount": len(manifest_worlds),
            "estimatedPhysicalBankCount": len(manifest_physical_banks),
            "dataWindowAddress": world_bank_manifest.get("dataWindowAddress"),
            "warningBankCount": sum(1 for bank in manifest_physical_banks if isinstance(bank, dict) and bank.get("status") == "warning"),
            "overBudgetBankCount": sum(1 for bank in manifest_physical_banks if isinstance(bank, dict) and bank.get("status") == "error"),
        },
        "ram": {
            "start": ram_budget.get("start"),
            "limit": ram_budget.get("limit"),
            "usedBytes": int(ram_budget.get("usedBytes") or 0),
            "freeBytes": int(ram_budget.get("freeBytes") or 0),
            "status": ram_budget.get("status", "unknown"),
            "sectionCount": len(ram_sections),
            "warningCount": len(ram_warnings),
        },
        "planB": {
            "romRecommendations": logical_budget.get("recoveryRecommendations") or [],
            "recoveryPlan": recovery_plan,
            "ramRecommendations": ram_recommendations,
        },
    }
    preflight_summary_path.write_text(
        json.dumps(preflight_summary, indent=2) + "\n",
        encoding="utf-8",
    )


def _next_power_of_two(value: int) -> int:
    if value <= 1:
        return 1
    return 1 << (value - 1).bit_length()


def pad_rom_to_valid_size(rom_path: Path, rom_mode: str, target_format: str) -> tuple[int, int]:
    rom_data = rom_path.read_bytes()
    original_size = len(rom_data)
    if original_size == 0:
        raise RuntimeError(f"Generated ROM is empty: {rom_path}")

    if rom_mode == "megarom":
        segment_size = 16384 if target_format == "ascii16" else 8192
        segment_count = (original_size + segment_size - 1) // segment_size
        minimum_segments = 4 if target_format == "ascii16" else 8
        padded_segment_count = max(_next_power_of_two(segment_count), minimum_segments)
        padded_size = padded_segment_count * segment_size
    else:
        kb8 = 8192
        padded_size = ((original_size + kb8 - 1) // kb8) * kb8

    if padded_size != original_size:
        rom_data += bytes([0xFF]) * (padded_size - original_size)
        rom_path.write_bytes(rom_data)
    return original_size, padded_size


def _parse_konami8k_literal(raw_value: str, description: str) -> int:
    if re.match(r"^#[0-9A-Fa-f]+$", raw_value):
        return int(raw_value[1:], 16)
    if re.match(r"^\d+$", raw_value):
        return int(raw_value, 10)
    raise RuntimeError(
        f"Konami8K validation failed: invalid numeric literal in resource_table {description}: {raw_value}"
    )


def _strip_asm_comments(asm_text: str) -> str:
    return "\n".join(line.split(";", 1)[0] for line in asm_text.splitlines())


def _find_top_level_label_body(asm_text: str, label: str) -> str | None:
    lines = asm_text.splitlines()
    start_index: int | None = None
    label_pattern = re.compile(rf"^\s*{re.escape(label)}:\s*(?:;.*)?$", flags=re.IGNORECASE)
    top_level_label_pattern = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*:\s*(?:;.*)?$")
    for index, line in enumerate(lines):
        if label_pattern.match(line):
            start_index = index
            break
    if start_index is None:
        return None

    end_index = len(lines)
    for index in range(start_index + 1, len(lines)):
        if top_level_label_pattern.match(lines[index]):
            end_index = index
            break
    return "\n".join(lines[start_index:end_index])


def _require_labels_before_marker(asm_text: str, labels: list[str], marker_regex: str, marker_description: str) -> None:
    marker_match = re.search(marker_regex, asm_text, flags=re.IGNORECASE | re.MULTILINE)
    if not marker_match:
        raise RuntimeError(f"Konami8K validation failed: missing {marker_description} marker")
    marker_pos = marker_match.start()
    missing_or_late: list[str] = []
    for label in labels:
        label_match = re.search(rf"^\s*{re.escape(label)}:\s*(?:;.*)?$", asm_text, flags=re.IGNORECASE | re.MULTILINE)
        if not label_match or label_match.start() >= marker_pos:
            missing_or_late.append(label)
    if missing_or_late:
        preview = ", ".join(missing_or_late[:10])
        raise RuntimeError(
            "Konami8K validation failed: critical routines must be resident before "
            f"{marker_description}; found missing/late labels: {preview}"
        )


def _find_direct_banked_resource_references(asm_text: str, resource_labels: list[str]) -> list[str]:
    data_marker = re.search(r"^\s*;\s*DATA BANKS\b", asm_text, flags=re.IGNORECASE | re.MULTILINE)
    active_text = asm_text[: data_marker.start()] if data_marker else asm_text
    active_code = _strip_asm_comments(active_text)
    sorted_labels = sorted({label for label in resource_labels if label}, key=len, reverse=True)
    findings: list[str] = []

    for line_number, line in enumerate(active_code.splitlines(), start=1):
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*:\s*$", stripped):
            continue
        if re.search(r"\bEQU\b", stripped, flags=re.IGNORECASE):
            continue
        if re.search(r"\bRESOURCE_ID_[A-Za-z0-9_]+\b", stripped):
            continue

        for label in sorted_labels:
            if re.search(rf"(?<![A-Za-z0-9_]){re.escape(label)}(?![A-Za-z0-9_])", stripped, flags=re.IGNORECASE):
                findings.append(f"line {line_number}: {stripped}")
                break
        if len(findings) >= 12:
            break
    return findings


def _extract_far_code_sections(asm_text: str) -> dict[int, tuple[int, int, str]]:
    lines = asm_text.splitlines()
    sections: dict[int, tuple[int, int, str]] = {}
    section_start_pattern = re.compile(r"^\s*;\s*FAR BANK\s+(\d+)\b.*\bFAR CODE\b", flags=re.IGNORECASE)

    index = 0
    while index < len(lines):
        match = section_start_pattern.match(lines[index])
        if not match:
            index += 1
            continue
        bank_number = int(match.group(1))
        start_index = index
        end_pattern = re.compile(rf"^\s*BANK_{bank_number}_USED_END:\s*(?:;.*)?$", flags=re.IGNORECASE)
        end_index = len(lines)
        for scan_index in range(index + 1, len(lines)):
            if end_pattern.match(lines[scan_index]):
                end_index = scan_index + 1
                break
        sections[bank_number] = (
            start_index + 1,
            end_index,
            "\n".join(lines[start_index:end_index]),
        )
        index = end_index

    return sections


def _extract_primary_code_sections(asm_text: str) -> dict[int, tuple[int, int, str]]:
    lines = asm_text.splitlines()
    sections: dict[int, tuple[int, int, str]] = {}
    section_start_pattern = re.compile(r"^\s*;\s*BANK\s+(\d+)\b.*\bPRIMARY\b", flags=re.IGNORECASE)

    index = 0
    while index < len(lines):
        match = section_start_pattern.match(lines[index])
        if not match:
            index += 1
            continue
        bank_number = int(match.group(1))
        start_index = index
        end_pattern = re.compile(rf"^\s*BANK_{bank_number}_USED_END:\s*(?:;.*)?$", flags=re.IGNORECASE)
        end_index = len(lines)
        for scan_index in range(index + 1, len(lines)):
            if end_pattern.match(lines[scan_index]):
                end_index = scan_index + 1
                break
        sections[bank_number] = (
            start_index + 1,
            end_index,
            "\n".join(lines[start_index:end_index]),
        )
        index = end_index

    return sections


def _labels_by_section_bank(sections: dict[int, tuple[int, int, str]]) -> dict[str, int]:
    labels: dict[str, int] = {}
    label_pattern = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*):\s*(?:;.*)?$", flags=re.MULTILINE)
    for bank_number, (_start_line, _end_line, section_text) in sections.items():
        for match in label_pattern.finditer(section_text):
            label = match.group(1)
            if not label.startswith("BANK_") and not label.startswith("FAR_BANK_"):
                labels[label] = bank_number
    return labels


def _far_branch_pattern() -> re.Pattern[str]:
    return re.compile(
        r"\b(?P<op>call|jp)\s+(?:(?:nz|z|nc|c|po|pe|p|m),\s*)?(?P<label>[A-Za-z_][A-Za-z0-9_]*)\b",
        flags=re.IGNORECASE,
    )


def _find_far_to_far_direct_calls(asm_text: str) -> list[str]:
    far_sections = _extract_far_code_sections(asm_text)
    if not far_sections:
        return []

    label_to_bank = _labels_by_section_bank(far_sections)

    findings: list[str] = []
    branch_pattern = _far_branch_pattern()
    for caller_bank, (start_line, _end_line, section_text) in far_sections.items():
        clean_section = _strip_asm_comments(section_text)
        for offset, line in enumerate(clean_section.splitlines(), start=0):
            stripped = line.strip()
            if not stripped:
                continue
            for match in branch_pattern.finditer(stripped):
                op = match.group("op").lower()
                callee = match.group("label")
                callee_bank = label_to_bank.get(callee)
                if callee_bank is None or callee_bank == caller_bank:
                    continue
                findings.append(
                    f"line {start_line + offset}: bank{caller_bank} {op}s bank{callee_bank} label {callee} directly"
                )
                if len(findings) >= 12:
                    return findings

    return findings


def _find_far_to_unstable_primary_direct_calls(asm_text: str) -> list[str]:
    far_sections = _extract_far_code_sections(asm_text)
    primary_sections = _extract_primary_code_sections(asm_text)
    if not far_sections or not primary_sections:
        return []

    label_to_primary_bank = _labels_by_section_bank(primary_sections)
    findings: list[str] = []
    branch_pattern = _far_branch_pattern()
    unstable_primary_banks = {1, 3}

    for caller_bank, (start_line, _end_line, section_text) in far_sections.items():
        clean_section = _strip_asm_comments(section_text)
        for offset, line in enumerate(clean_section.splitlines(), start=0):
            stripped = line.strip()
            if not stripped:
                continue
            for match in branch_pattern.finditer(stripped):
                op = match.group("op").lower()
                callee = match.group("label")
                callee_bank = label_to_primary_bank.get(callee)
                if callee_bank not in unstable_primary_banks:
                    continue
                findings.append(
                    f"line {start_line + offset}: bank{caller_bank} {op}s primary bank{callee_bank} label {callee} directly"
                )
                if len(findings) >= 12:
                    return findings

    return findings


def _extract_far_trampoline_bodies(asm_text: str) -> dict[str, tuple[int, str]]:
    """Return bank-0 _far trampoline bodies with source line numbers."""
    lines = asm_text.splitlines()
    start_index: int | None = None
    end_index = len(lines)

    for index, line in enumerate(lines):
        if re.search(r"\bFAR-CALL TRAMPOLINES\b", line, flags=re.IGNORECASE):
            start_index = index
            break
    if start_index is None:
        return {}

    for index in range(start_index + 1, len(lines)):
        if re.search(r"\bRESIDENT CALL WRAPPERS\b", lines[index], flags=re.IGNORECASE):
            end_index = index
            break

    label_pattern = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*_far):\s*(?:;.*)?$")
    bodies: dict[str, tuple[int, str]] = {}
    index = start_index + 1
    while index < end_index:
        match = label_pattern.match(lines[index])
        if not match:
            index += 1
            continue

        label = match.group(1)
        body_start = index
        index += 1
        while index < end_index and not label_pattern.match(lines[index]):
            index += 1
        bodies[label] = (body_start + 1, "\n".join(lines[body_start:index]))

    return bodies


def _find_far_trampoline_contract_violations(asm_text: str) -> list[str]:
    """Validate that generated far-call trampolines preserve mapper/IRQ return contracts."""
    findings: list[str] = []
    for label, (line_number, body) in _extract_far_trampoline_bodies(asm_text).items():
        clean_body = _strip_asm_comments(body)
        target_label = label[:-4]

        ram_bridge_map = re.search(
            rf"ld\s+a,\s*FAR_BANK_(?P<bank>\d+)\s*\n"
            rf"\s*ld\s+hl,\s*{re.escape(target_label)}\s*\n"
            rf"\s*call\s+ASCII16_FAR_CALL_P1(?P<preserve>_PRESERVE_A)?_RAM\b",
            clean_body,
            flags=re.IGNORECASE,
        )
        if ram_bridge_map:
            pre_map = clean_body[: ram_bridge_map.start()]
            if not re.search(r"^\s*di\s*$", pre_map, flags=re.IGNORECASE | re.MULTILINE):
                findings.append(f"line {line_number}: {label} maps via RAM bridge without disabling IRQ first")
                if len(findings) >= 12:
                    return findings

            after_bridge = clean_body[ram_bridge_map.end() :]
            restore_pattern = (
                rf"(?:push\s+hl\s*\n\s*)?"
                rf"(?:(?:ld\s+hl,\s*far_call_irq_lock_depth\s*\n"
                rf"\s*dec\s+\(hl\)\s*\n)|(?:ld\s+a,\s*\(far_call_irq_lock_depth\)\s*\n"
                rf"\s*dec\s+a\s*\n"
                rf"\s*ld\s+\(far_call_irq_lock_depth\),\s*a\s*\n))?"
                rf"\s*ld\s+a,\s*\(interrupt_in_progress\)\s*\n"
                rf"\s*or\s+a\s*\n"
                rf"\s*jp\s+nz,\s*\.{re.escape(label)}_irq_done\s*\n"
                rf"(?:\s*ld\s+a,\s*\(far_call_irq_lock_depth\)\s*\n"
                rf"\s*or\s+a\s*\n"
                rf"\s*jp\s+nz,\s*\.{re.escape(label)}_irq_done\s*\n)?"
                rf"(?:\s*ld\s+a,\s*\(mapper_bank_p1_current\)\s*\n"
                rf"\s*or\s+a\s*\n"
                rf"\s*jp\s+nz,\s*\.{re.escape(label)}_irq_done\s*\n)?"
                rf"\s*ei\s*\n"
                rf"\.{re.escape(label)}_irq_done:\s*\n"
            )
            restore = re.search(restore_pattern, after_bridge, flags=re.IGNORECASE)
            if not restore:
                findings.append(f"line {line_number}: {label} does not conditionally restore IRQ after RAM bridge")
                if len(findings) >= 12:
                    return findings
                continue

            tail = after_bridge[restore.end() :]
            if ram_bridge_map.group("preserve"):
                ex_count = len(re.findall(r"\bex\s+af\s*,\s*af'", clean_body, flags=re.IGNORECASE))
                if ex_count != 2:
                    findings.append(f"line {line_number}: {label} has an unbalanced RAM-bridge alternate-AF preserve sequence")
                elif not re.search(r"^\s*ex\s+af\s*,\s*af'\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
                    findings.append(f"line {line_number}: {label} does not restore preserved A before ret")
            elif re.search(r"^\s*pop\s+hl\s*\n\s*pop\s+af\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
                pass
            elif not re.search(r"^\s*pop\s+af\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
                findings.append(f"line {line_number}: {label} does not restore caller AF before ret")

            if len(findings) >= 12:
                return findings
            continue

        bank_map = re.search(
            r"ld\s+a,\s*\(mapper_bank_p(?P<page>[1-4])_current\)\s*\n"
            r"\s*push\s+af\s*\n"
            r"\s*ld\s+a,\s*FAR_BANK_(?P<bank>\d+)\s*\n"
            r"\s*call\s+mapper_set_bank_p(?P=page)\b",
            clean_body,
            flags=re.IGNORECASE,
        )
        if not bank_map:
            findings.append(f"line {line_number}: {label} does not save/map through a tracked mapper page")
            if len(findings) >= 12:
                return findings
            continue

        pre_map = clean_body[: bank_map.start()]
        if not re.search(r"^\s*di\s*$", pre_map, flags=re.IGNORECASE | re.MULTILINE):
            findings.append(f"line {line_number}: {label} maps a bank without disabling IRQ first")
            if len(findings) >= 12:
                return findings

        page = bank_map.group("page")
        after_map = clean_body[bank_map.end() :]
        callee = re.search(rf"\bcall\s+{re.escape(target_label)}\b", after_map, flags=re.IGNORECASE)
        if not callee:
            findings.append(f"line {line_number}: {label} does not call its target label {target_label}")
            if len(findings) >= 12:
                return findings
            continue

        after_callee = after_map[callee.end() :]
        restore_pattern = (
            rf"pop\s+af\s*\n"
            rf"\s*call\s+mapper_set_bank_p{page}\b\s*\n"
            rf"(?:\s*push\s+hl\s*\n)?"
            rf"(?:(?:\s*ld\s+hl,\s*far_call_irq_lock_depth\s*\n"
            rf"\s*dec\s+\(hl\)\s*\n)|(?:\s*ld\s+a,\s*\(far_call_irq_lock_depth\)\s*\n"
            rf"\s*dec\s+a\s*\n"
            rf"\s*ld\s+\(far_call_irq_lock_depth\),\s*a\s*\n))?"
            rf"\s*ld\s+a,\s*\(interrupt_in_progress\)\s*\n"
            rf"\s*or\s+a\s*\n"
            rf"\s*jp\s+nz,\s*\.{re.escape(label)}_irq_done\s*\n"
            rf"(?:\s*ld\s+a,\s*\(far_call_irq_lock_depth\)\s*\n"
            rf"\s*or\s+a\s*\n"
            rf"\s*jp\s+nz,\s*\.{re.escape(label)}_irq_done\s*\n)?"
            rf"\s*ei\s*\n"
            rf"\.{re.escape(label)}_irq_done:\s*\n"
        )
        restore = re.search(restore_pattern, after_callee, flags=re.IGNORECASE)
        if not restore:
            findings.append(f"line {line_number}: {label} does not restore mapper before conditional EI")
            if len(findings) >= 12:
                return findings
            continue

        tail = after_callee[restore.end() :]
        if re.search(r"^\s*ex\s+af\s*,\s*af'\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
            ex_count = len(re.findall(r"\bex\s+af\s*,\s*af'", clean_body, flags=re.IGNORECASE))
            if ex_count != 4:
                findings.append(f"line {line_number}: {label} has an unbalanced alternate-AF preserve sequence")
        elif re.search(r"^\s*pop\s+hl\s*\n\s*pop\s+af\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
            pass
        elif not re.search(r"^\s*pop\s+af\s*\n\s*ret\b", tail, flags=re.IGNORECASE | re.MULTILINE):
            findings.append(f"line {line_number}: {label} does not restore caller AF before ret")

        if len(findings) >= 12:
            return findings

    return findings


def _find_scattered_mapper_register_writes(asm_text: str) -> list[str]:
    active_code = _strip_asm_comments(asm_text)
    label_pattern = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*):\s*$")
    mapper_write_pattern = re.compile(
        r"\bld\s+\(\s*(?:MAPPER_REG_P[1-4]|#(?:6000|8000|A000))\s*\)\s*,\s*a\b",
        flags=re.IGNORECASE,
    )
    allowed_labels = {
        "mapper_set_bank_p1",
        "mapper_set_bank_p2",
        "mapper_set_bank_p3",
        "mapper_set_bank_p4",
    }

    findings: list[str] = []
    current_label = ""
    for line_number, line in enumerate(active_code.splitlines(), start=1):
        label_match = label_pattern.match(line)
        if label_match:
            current_label = label_match.group(1)
            continue
        stripped = line.strip()
        if not stripped:
            continue
        if current_label in allowed_labels:
            continue
        if mapper_write_pattern.search(stripped):
            findings.append(f"line {line_number}: {stripped}")
            if len(findings) >= 12:
                break

    return findings


def validate_konami8k_megarom(rom_path: Path, asm_path: Path) -> dict[str, int | bool]:
    rom_data = rom_path.read_bytes()
    if len(rom_data) == 0:
        raise RuntimeError(f"Konami8K validation failed: ROM is empty: {rom_path}")
    if len(rom_data) % 8192 != 0:
        raise RuntimeError(
            f"Konami8K validation failed: ROM size must be a multiple of 8192 bytes, got {len(rom_data)}"
        )
    if rom_data[:2] != b"AB":
        raise RuntimeError("Konami8K validation failed: missing AB cartridge header at ROM offset 0000h")

    segment_count = len(rom_data) // 8192
    if segment_count < 4:
        raise RuntimeError(
            f"Konami8K validation failed: expected at least 4 x 8KB segments, got {segment_count}"
        )

    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    asm_code_only = _strip_asm_comments(asm_text)
    unsafe_irq_state_reads = re.findall(
        r"^\s*ld\s+a\s*,\s*[ir]\s*$",
        asm_code_only,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    if unsafe_irq_state_reads:
        raise RuntimeError(
            "Konami8K validation failed: generated ASM must not use Z80 errata-prone "
            "`ld a,i`/`ld a,r` interrupt-state reads"
        )

    required_boot_patterns = [
        (r"ld\s+a,\s*1\s*\n\s*call\s+mapper_set_bank_p1", "6000h window initialized to bank 1"),
        (r"ld\s+a,\s*2\s*\n\s*call\s+mapper_set_bank_p2", "8000h window initialized to bank 2"),
        (r"ld\s+a,\s*3\s*\n\s*call\s+mapper_set_bank_p3", "A000h window initialized to bank 3"),
    ]
    for pattern, description in required_boot_patterns:
        if not re.search(pattern, asm_text, flags=re.IGNORECASE):
            raise RuntimeError(f"Konami8K validation failed: missing boot mapper init for {description}")

    required_mapper_registers = [
        (r"MAPPER_REG_P1\s+EQU\s+#6000", "P1 mapper register must be #6000"),
        (r"MAPPER_REG_P2\s+EQU\s+#8000", "P2 mapper register must be #8000"),
        (r"MAPPER_REG_P3\s+EQU\s+#A000", "P3 mapper register must be #A000"),
    ]
    for pattern, description in required_mapper_registers:
        if not re.search(pattern, asm_text, flags=re.IGNORECASE):
            raise RuntimeError(f"Konami8K validation failed: {description}")

    scattered_mapper_writes = _find_scattered_mapper_register_writes(asm_text)
    if scattered_mapper_writes:
        preview = "; ".join(scattered_mapper_writes[:8])
        raise RuntimeError(
            "Konami8K validation failed: mapper register writes must stay inside mapper_set_bank_pX routines; "
            f"found {preview}"
        )

    fixed_core_labels = [
        "mapper_runtime_init",
        "mapper_set_bank_p1",
        "mapper_set_bank_p2",
        "mapper_set_bank_p3",
        "mapper_push_p3",
        "mapper_pop_p3",
        "mapper_call_hl_auto",
        "dzx0_standard",
        "resource_find_by_id",
        "resource_load_to_ram_by_id",
        "resource_load_to_vram_by_id",
        "resource_copy_from_bank_to_ram",
        "resource_decompress_from_bank_to_ram",
        "resource_dzx0_to_vram",
        "interrupt_dispatcher",
    ]
    _require_labels_before_marker(
        asm_text,
        fixed_core_labels,
        r"^\s*org\s+#6000\b",
        "bank 1 / #6000 resident-code",
    )

    interrupt_body = _find_top_level_label_body(asm_text, "interrupt_dispatcher")
    if interrupt_body is None:
        raise RuntimeError("Konami8K validation failed: missing interrupt_dispatcher")
    interrupt_code = _strip_asm_comments(interrupt_body)
    forbidden_isr_patterns = [
        (r"\bcall\s+mapper_set_bank_p3\b", "ISR must not switch the A000h data window"),
        (r"\bcall\s+resource_[A-Za-z0-9_]+\b", "ISR must not load banked resources"),
        (r"\bcall\s+dzx0_standard\b", "ISR must not run ZX0 decompression"),
        (r"\bMAPPER_REG_P3\b", "ISR must not write the P3 mapper register"),
    ]
    for pattern, description in forbidden_isr_patterns:
        if re.search(pattern, interrupt_code, flags=re.IGNORECASE):
            raise RuntimeError(f"Konami8K validation failed: {description}")

    far_to_far_calls = _find_far_to_far_direct_calls(asm_text)
    if far_to_far_calls:
        preview = "; ".join(far_to_far_calls[:8])
        raise RuntimeError(
            "Konami8K validation failed: far-code banks must call other far-code banks through bank-0 trampolines; "
            f"found {preview}"
        )

    far_to_unstable_primary_calls = _find_far_to_unstable_primary_direct_calls(asm_text)
    if far_to_unstable_primary_calls:
        preview = "; ".join(far_to_unstable_primary_calls[:8])
        raise RuntimeError(
            "Konami8K validation failed: far-code banks must call bank1/P1 and bank3/P3 routines through bank-0 wrappers; "
            f"found {preview}"
        )

    far_trampoline_contracts = _find_far_trampoline_contract_violations(asm_text)
    if far_trampoline_contracts:
        preview = "; ".join(far_trampoline_contracts[:8])
        raise RuntimeError(
            "Konami8K validation failed: far-call trampolines must preserve mapper, IRQ, and AF return contracts; "
            f"found {preview}"
        )

    if re.search(r"DATA BANKS.*Accessed through mapper P2", asm_text, flags=re.IGNORECASE | re.DOTALL):
        raise RuntimeError("Konami8K validation failed: banked data must use P3/A000h, not P2/8000h")

    if re.search(r"FAR BANK \d+.*\[#A000h-#C000h\]", asm_text, flags=re.IGNORECASE):
        raise RuntimeError("Konami8K validation failed: far code must not execute from the A000h data window")

    stale_mutable_map_p2 = re.search(
        r"ld\s+a,\s*\(current_(?:screen_layout|behavior_map)_bank\)\s*\n\s*call\s+mapper_set_bank_p2",
        asm_text,
        flags=re.IGNORECASE,
    )
    if stale_mutable_map_p2:
        raise RuntimeError(
            "Konami8K validation failed: mutable runtime maps must use P3/A000h data window, not P2/8000h"
        )

    resource_table_bodies: list[str] = []
    asm_lines = asm_text.splitlines()
    for index, line in enumerate(asm_lines):
        if not re.match(r"^\s*resource_table:\s*$", line, flags=re.IGNORECASE):
            continue
        body_lines: list[str] = []
        for body_line in asm_lines[index + 1:]:
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*:\s*$", body_line):
                break
            body_lines.append(body_line)
        resource_table_bodies.append("\n".join(body_lines))
    if len(resource_table_bodies) != 1:
        raise RuntimeError("Konami8K validation failed: expected exactly one resource_table")

    resource_table_count_match = re.search(
        r"^\s*RESOURCE_TABLE_COUNT\s+EQU\s+(#[0-9A-Fa-f]+|\d+)\s*$",
        asm_text,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    if not resource_table_count_match:
        raise RuntimeError("Konami8K validation failed: missing RESOURCE_TABLE_COUNT")
    resource_entry_size_match = re.search(
        r"^\s*RESOURCE_TABLE_ENTRY_SIZE\s+EQU\s+(#[0-9A-Fa-f]+|\d+)\s*$",
        asm_text,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    if not resource_entry_size_match:
        raise RuntimeError("Konami8K validation failed: missing RESOURCE_TABLE_ENTRY_SIZE")
    raw_entry_size = resource_entry_size_match.group(1)
    entry_size = int(raw_entry_size[1:], 16) if raw_entry_size.startswith("#") else int(raw_entry_size, 10)
    if entry_size != 8:
        raise RuntimeError("Konami8K validation failed: RESOURCE_TABLE_ENTRY_SIZE must be 8")
    declared_resource_count: int | None = None
    if resource_table_count_match:
        raw_count = resource_table_count_match.group(1)
        declared_resource_count = int(raw_count[1:], 16) if raw_count.startswith("#") else int(raw_count, 10)

    resource_entry_pattern = re.compile(
        r"^\s*db\s+([^\s;]+)\s*(?:;.*)?\n"
        r"\s*dw\s+([^\s;]+)\s*(?:;.*)?\n"
        r"\s*dw\s+([^\s;]+)\s*(?:;.*)?\n"
        r"\s*dw\s+([^\s;]+)\s*(?:;.*)?\n"
        r"\s*db\s+([^\s;]+)\s*(?:;.*)?$",
        flags=re.MULTILINE,
    )
    out_of_window_addresses: list[str] = []
    crossing_resources: list[str] = []
    out_of_rom_banks: list[str] = []
    invalid_resource_sizes: list[str] = []
    resource_addresses: list[int] = []
    for body in resource_table_bodies:
        entry_matches = list(resource_entry_pattern.finditer(body))
        residue = list(body)
        for match in entry_matches:
            for index in range(match.start(), match.end()):
                residue[index] = " "
        invalid_lines = [
            stripped
            for line in "".join(residue).splitlines()
            if (stripped := line.split(";", 1)[0].strip())
        ]
        if invalid_lines:
            preview = ", ".join(invalid_lines[:4])
            raise RuntimeError(
                f"Konami8K validation failed: malformed resource_table entry: {preview}"
            )

        for match in entry_matches:
            raw_bank = match.group(1)
            bank = _parse_konami8k_literal(raw_bank, "bank")
            raw_address = match.group(2)
            address = _parse_konami8k_literal(raw_address, "address")
            raw_size = match.group(3)
            size = _parse_konami8k_literal(raw_size, "size")
            raw_uncompressed_size = match.group(4)
            uncompressed_size = _parse_konami8k_literal(raw_uncompressed_size, "uncompressed size")
            raw_flags = match.group(5)
            flags_value = _parse_konami8k_literal(raw_flags, "flags")
            resource_addresses.append(address)
            if bank < 0 or bank >= segment_count:
                out_of_rom_banks.append(raw_bank)
            if size <= 0 or uncompressed_size <= 0:
                invalid_resource_sizes.append(raw_size)
            if flags_value & ~0x01:
                invalid_resource_sizes.append(raw_flags)
            if flags_value == 0 and size != uncompressed_size:
                invalid_resource_sizes.append(f"{raw_size}!={raw_uncompressed_size}")
            if flags_value & 0x01 and uncompressed_size < size:
                invalid_resource_sizes.append(f"{raw_size}>{raw_uncompressed_size}")
            if address < 0xA000 or address > 0xBFFF:
                out_of_window_addresses.append(raw_address)
            elif size > 0 and address + size - 1 > 0xBFFF:
                crossing_resources.append(f"{raw_address}+{raw_size}")

    if out_of_window_addresses:
        preview = ", ".join(out_of_window_addresses[:8])
        raise RuntimeError(
            "Konami8K validation failed: resource_table addresses must be in A000h-BFFFh; "
            f"found {preview}"
        )
    if crossing_resources:
        preview = ", ".join(crossing_resources[:8])
        raise RuntimeError(
            "Konami8K validation failed: resource_table entries must not cross the A000h-BFFFh data window; "
            f"found {preview}"
        )
    if out_of_rom_banks:
        preview = ", ".join(out_of_rom_banks[:8])
        raise RuntimeError(
            "Konami8K validation failed: resource_table references banks outside the ROM; "
            f"found {preview}"
        )
    if invalid_resource_sizes:
        preview = ", ".join(invalid_resource_sizes[:8])
        raise RuntimeError(
            "Konami8K validation failed: resource_table sizes must be greater than zero; "
            f"found {preview}"
        )
    if declared_resource_count is not None and declared_resource_count != len(resource_addresses):
        raise RuntimeError(
            "Konami8K validation failed: RESOURCE_TABLE_COUNT does not match resource_table entries"
        )

    return {
        "segment_count": segment_count,
        "size_bytes": len(rom_data),
        "resource_count": len(resource_addresses),
        "resource_min_address": min(resource_addresses) if resource_addresses else 0,
        "resource_max_address": max(resource_addresses) if resource_addresses else 0,
        "header_ok": True,
        "paper_invariants_ok": True,
    }


def validate_msx2_screen4_data_bank_symbols(
    sym_path: Path,
    data_bank_indexes: set[int],
    data_bank_labels: set[str],
) -> dict[str, int | bool]:
    if not sym_path.exists():
        raise RuntimeError(f"MSX2 Konami8K validation failed: missing symbols file {sym_path}")
    sym_text = sym_path.read_text(encoding="utf-8", errors="ignore")
    for bank_index in sorted(data_bank_indexes):
        phys_start = _sym_equ_value(sym_text, f"MSX2_SCREEN4_DATA_BANK_{bank_index}_PHYS_START")
        rom_start = _sym_equ_value(sym_text, f"MSX2_SCREEN4_DATA_BANK_{bank_index}_ROM_START")
        used_end = _sym_equ_value(sym_text, f"MSX2_SCREEN4_DATA_BANK_{bank_index}_USED_END")
        expected_phys_start = 0xC000 + (bank_index * 0x2000)
        if phys_start != expected_phys_start:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: SCREEN 4 data-bank physical anchor is not contiguous; "
                f"bank={bank_index} expected=#{expected_phys_start:04X} actual=#{phys_start:04X}"
            )
        if rom_start != 0x8000:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: SCREEN 4 data-bank runtime label must assemble in P2/#8000; "
                f"bank={bank_index} actual=#{rom_start:04X}"
            )
        if used_end < 0x8000 or used_end > 0xA000:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: SCREEN 4 data-bank data crosses the #8000-#9FFF runtime window; "
                f"bank={bank_index} usedEnd=#{used_end:04X}"
            )

    cold_suffixes = (
        "_BANK_0_PATTERNS",
        "_BANK_0_COLORS",
        "_NAMES",
        "_COLLISION",
        "_EFFECTS",
        "_BEHAVIOR",
    )
    for label in sorted(data_bank_labels):
        data_bank_value = _sym_equ_value(sym_text, f"{label}_DATA_BANK")
        expected_bank_indexes = [index for index in data_bank_indexes if data_bank_value == 4 + index]
        if not expected_bank_indexes:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: screen data-bank equate points outside emitted SCREEN 4 data banks; "
                f"label={label} dataBank={data_bank_value}"
            )
        for suffix in cold_suffixes:
            symbol = f"{label}{suffix}"
            try:
                value = _sym_equ_value(sym_text, symbol)
            except RuntimeError:
                continue
            if value < 0x8000 or value >= 0xA000:
                raise RuntimeError(
                    "MSX2 Konami8K validation failed: cold SCREEN 4 label is not addressable in the #8000 data window; "
                    f"label={symbol} value=#{value:04X}"
                )
    return {
        "data_bank_symbol_count": len(data_bank_indexes),
        "screen_data_bank_label_count": len(data_bank_labels),
        "data_bank_symbols_ok": True,
    }


def validate_msx2_screen4_konami_fixed_bank0_megarom(rom_path: Path, asm_path: Path, sym_path: Path | None = None) -> dict[str, int | bool]:
    rom_data = rom_path.read_bytes()
    if len(rom_data) == 0:
        raise RuntimeError(f"MSX2 Konami8K validation failed: ROM is empty: {rom_path}")
    if len(rom_data) % 8192 != 0:
        raise RuntimeError(
            f"MSX2 Konami8K validation failed: ROM size must be a multiple of 8192 bytes, got {len(rom_data)}"
        )
    if len(rom_data) <= 32768:
        raise RuntimeError(
            f"MSX2 Konami8K validation failed: MegaROM output should exceed 32KB, got {len(rom_data)}"
        )
    if rom_data[:2] != b"AB":
        raise RuntimeError("MSX2 Konami8K validation failed: missing AB cartridge header at ROM offset 0000h")

    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    required_markers = [
        "Mideas MSX2 SCREEN 4 tile backend",
        "; ROM Mode: megarom",
        "; Mapper Target: konami",
        "MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility",
        "init_konami8k_fixed_bank0_banks:",
        "mapper_set_bank_p1:",
        "mapper_set_bank_p2:",
        "mapper_set_bank_p3:",
        "MSX2_SCREEN4_DATA_BANK_ROM_START:",
    ]
    missing = [marker for marker in required_markers if marker not in asm_text]
    if missing:
        raise RuntimeError(
            "MSX2 Konami8K validation failed: missing fixed-bank0 markers: " + ", ".join(missing)
        )
    if "MSX2_SCREEN4_MULTI_BANK_LOADER_READY" not in asm_text:
        raise RuntimeError("MSX2 Konami8K validation failed: missing SCREEN 4 data-bank loader capability marker")
    if "msx2_screen4_data_bank_enter_selected:" not in asm_text:
        raise RuntimeError("MSX2 Konami8K validation failed: missing selectable SCREEN 4 data-bank enter helper")
    data_bank_sections = {
        int(match.group(1))
        for match in re.finditer(r"MSX2_SCREEN4_DATA_BANK_(\d+)_ROM_START:", asm_text)
    }
    data_bank_phys_starts = {
        int(match.group(1))
        for match in re.finditer(r"MSX2_SCREEN4_DATA_BANK_(\d+)_PHYS_START:", asm_text)
    }
    data_bank_used_ends = {
        int(match.group(1))
        for match in re.finditer(r"MSX2_SCREEN4_DATA_BANK_(\d+)_USED_END:", asm_text)
    }
    data_bank_equates = {
        int(match.group(1))
        for match in re.finditer(r"MSX2_SCREEN4_DATA_BANK_(\d+)\s+EQU\s+\d+", asm_text)
    }
    if not data_bank_sections or not data_bank_equates:
        raise RuntimeError("MSX2 Konami8K validation failed: missing SCREEN 4 data-bank sections/equates")
    missing_sections = sorted(data_bank_equates - data_bank_sections)
    if missing_sections:
        raise RuntimeError(
            "MSX2 Konami8K validation failed: missing SCREEN 4 data-bank section(s): "
            + ", ".join(str(index) for index in missing_sections)
        )
    missing_phys_starts = sorted(data_bank_equates - data_bank_phys_starts)
    missing_used_ends = sorted(data_bank_equates - data_bank_used_ends)
    if missing_phys_starts or missing_used_ends:
        raise RuntimeError(
            "MSX2 Konami8K validation failed: SCREEN 4 data-bank sections must expose physical anchors and used-end labels; "
            f"missing phys={missing_phys_starts}, usedEnd={missing_used_ends}"
        )
    for bank_index in sorted(data_bank_equates):
        expected_advance = f"org MSX2_SCREEN4_DATA_BANK_{bank_index}_PHYS_START + #2000"
        if expected_advance not in asm_text:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: SCREEN 4 data bank "
                f"{bank_index} does not advance the physical ROM stream after its #8000 window"
            )
    load_routines = re.findall(r"load_([A-Za-z0-9_]+)_screen4:\n(.*?)(?=\n[A-Za-z0-9_.$]+:|\Z)", asm_text, flags=re.DOTALL)
    data_bank_labels = {
        match.group(1)
        for match in re.finditer(r"^([A-Za-z0-9_]+)_DATA_BANK\s+EQU\s+MSX2_SCREEN4_DATA_BANK_\d+", asm_text, flags=re.MULTILINE)
    }
    symbol_validation = (
        validate_msx2_screen4_data_bank_symbols(sym_path, data_bank_equates, data_bank_labels)
        if sym_path is not None
        else {}
    )
    for label, body in load_routines:
        if f"{label}_DATA_BANK" in asm_text and (
            f"ld a, {label}_DATA_BANK" not in body
            or "call msx2_screen4_data_bank_enter_selected" not in body
            or "call msx2_screen4_data_bank_leave" not in body
        ):
            raise RuntimeError(f"MSX2 Konami8K validation failed: load_{label}_screen4 does not use selectable data-bank enter/leave")
        for layer_suffix, cache_symbol, pointer_symbol in (
            ("COLLISION", "msx2_collision_runtime_cache", "msx2_current_collision_ptr"),
            ("BEHAVIOR", "msx2_behavior_runtime_cache", "msx2_current_behavior_ptr"),
        ):
            layer_label = f"{label}_{layer_suffix}"
            if layer_label not in asm_text:
                continue
            expected_sequence = [
                f"ld a, {label}_DATA_BANK",
                "call msx2_screen4_data_bank_enter_selected",
                f"ld hl, {layer_label}",
                f"ld de, {cache_symbol}",
                "ld bc, msx2_layer_size",
                "ldir",
                "call msx2_screen4_data_bank_leave",
                f"ld hl, {cache_symbol}",
                f"ld ({pointer_symbol}), hl",
            ]
            missing_sequence = [needle for needle in expected_sequence if needle not in body]
            if missing_sequence:
                raise RuntimeError(
                    "MSX2 Konami8K validation failed: "
                    f"load_{label}_screen4 does not copy {layer_label} into {cache_symbol}; "
                    f"missing {', '.join(missing_sequence)}"
                )
    init_effects_match = re.search(
        r"init_msx2_effect_buffers:\n(.*?)(?=\n[A-Za-z0-9_.$]+:|\Z)",
        asm_text,
        flags=re.DOTALL,
    )
    if data_bank_labels and not init_effects_match:
        raise RuntimeError("MSX2 Konami8K validation failed: missing init_msx2_effect_buffers routine")
    init_effects_body = init_effects_match.group(1) if init_effects_match else ""
    for label in sorted(data_bank_labels):
        if f"{label}_EFFECTS" not in asm_text:
            continue
        expected_sequence = [
            f"ld a, {label}_DATA_BANK",
            "call msx2_screen4_data_bank_enter_selected",
            f"ld hl, {label}_EFFECTS",
            "ld de, #",
            "ld bc, msx2_layer_size",
            "ldir",
            "call msx2_screen4_data_bank_leave",
        ]
        missing_sequence = [needle for needle in expected_sequence if needle not in init_effects_body]
        if missing_sequence:
            raise RuntimeError(
                "MSX2 Konami8K validation failed: init_msx2_effect_buffers does not restore "
                f"{label}_EFFECTS through its selected data bank; missing {', '.join(missing_sequence)}"
            )

    required_boot_patterns = [
        (r"ld\s+a,\s*1\s*\n\s*call\s+mapper_set_bank_p1", "6000h window initialized to bank 1"),
        (r"ld\s+a,\s*2\s*\n\s*call\s+mapper_set_bank_p2", "8000h window initialized to bank 2"),
        (r"ld\s+a,\s*3\s*\n\s*call\s+mapper_set_bank_p3", "A000h window initialized to bank 3"),
    ]
    for pattern, description in required_boot_patterns:
        if not re.search(pattern, asm_text, flags=re.IGNORECASE):
            raise RuntimeError(f"MSX2 Konami8K validation failed: missing boot mapper init for {description}")

    scattered_mapper_writes = _find_scattered_mapper_register_writes(asm_text)
    if scattered_mapper_writes:
        preview = "; ".join(scattered_mapper_writes[:8])
        raise RuntimeError(
            "MSX2 Konami8K validation failed: mapper register writes must stay inside "
            f"mapper_set_bank_p1/p2/p3; found {preview}"
        )

    return {
        "segment_count": len(rom_data) // 8192,
        "size_bytes": len(rom_data),
        "header_ok": True,
        "scattered_mapper_writes": 0,
        **symbol_validation,
    }


def validate_msx2_screen5_konami_fixed_bank0_megarom(rom_path: Path, asm_path: Path) -> dict[str, int | bool]:
    rom_data = rom_path.read_bytes()
    if len(rom_data) == 0:
        raise RuntimeError(f"MSX2 SCREEN 5 Konami8K validation failed: ROM is empty: {rom_path}")
    if len(rom_data) % 8192 != 0:
        raise RuntimeError(
            f"MSX2 SCREEN 5 Konami8K validation failed: ROM size must be a multiple of 8192 bytes, got {len(rom_data)}"
        )
    if len(rom_data) <= 32768:
        raise RuntimeError(
            f"MSX2 SCREEN 5 Konami8K validation failed: MegaROM output should exceed 32KB, got {len(rom_data)}"
        )
    if rom_data[:2] != b"AB":
        raise RuntimeError("MSX2 SCREEN 5 Konami8K validation failed: missing AB cartridge header at ROM offset 0000h")

    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    is_chain_backend = "Mideas MSX2 SCREEN 5 presentation chain backend" in asm_text
    required_markers = [
        "Mideas MSX2 SCREEN 5 presentation chain backend" if is_chain_backend else "Mideas MSX2 SCREEN 5 presentation backend",
        "; Backend: msx2-screen5-presentation-chain" if is_chain_backend else "; Backend: msx2-screen5-presentation",
        "; ROM Mode: megarom",
        "; Mapper Target: konami",
        "init_konami8k_fixed_bank0_banks:",
        "mapper_set_bank_p1:",
        "mapper_set_bank_p2:",
        "mapper_set_bank_p3:",
        "SCREEN5_SCENE_0_BITMAP_CHUNK_0:" if is_chain_backend else "SCREEN5_PRESENTATION_BITMAP_CHUNK_0:",
    ]
    missing = [marker for marker in required_markers if marker not in asm_text]
    if missing:
        raise RuntimeError(
            "MSX2 SCREEN 5 Konami8K validation failed: missing fixed-bank0 markers: " + ", ".join(missing)
        )

    required_boot_patterns = [
        (r"ld\s+a,\s*1\s*\n\s*call\s+mapper_set_bank_p1", "6000h window initialized to bank 1"),
        (r"ld\s+a,\s*2\s*\n\s*call\s+mapper_set_bank_p2", "8000h window initialized to bank 2"),
        (r"ld\s+a,\s*3\s*\n\s*call\s+mapper_set_bank_p3", "A000h window initialized to bank 3"),
    ]
    for pattern, description in required_boot_patterns:
        if not re.search(pattern, asm_text, flags=re.IGNORECASE):
            raise RuntimeError(f"MSX2 SCREEN 5 Konami8K validation failed: missing boot mapper init for {description}")

    if is_chain_backend:
        if "Align SCREEN 5 chain chunk so ZX0 never crosses an 8KB MegaROM bank" not in asm_text:
            raise RuntimeError(
                "MSX2 SCREEN 5 Konami8K validation failed: SCREEN 5 chain chunks must be padded so "
                "ZX0 streams never cross an 8KB mapper window"
            )

    return {
        "segment_count": len(rom_data) // 8192,
        "size_bytes": len(rom_data),
        "header_ok": True,
    }


def _require_json_object(path: Path) -> dict:
    if not path.exists():
        raise RuntimeError(f"Konami8K validation failed: missing generated artifact {path.name}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Konami8K validation failed: invalid JSON artifact {path.name}: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError(f"Konami8K validation failed: JSON artifact {path.name} must be an object")
    return data


def _require_text_artifact(path: Path) -> str:
    if not path.exists():
        raise RuntimeError(f"Konami8K validation failed: missing generated artifact {path.name}")
    return path.read_text(encoding="utf-8", errors="ignore")


def _expected_megarom_mapper_window(target_format: str) -> dict[str, int | str]:
    if target_format == "ascii16":
        return {
            "format": "ascii16",
            "segment_size": 16384,
            "data_window_page": "p3",
            "window_base": "#8000",
            "window_base_int": 0x8000,
            "window_mask": "#3FFF",
            "bank_divisor": "#4000",
        }
    if target_format == "ascii8":
        return {
            "format": "ascii8",
            "segment_size": 8192,
            "data_window_page": "p3",
            "window_base": "#8000",
            "window_base_int": 0x8000,
            "window_mask": "#1FFF",
            "bank_divisor": "#2000",
        }
    return {
        "format": "konami",
        "segment_size": 8192,
        "data_window_page": "p3",
        "window_base": "#A000",
        "window_base_int": 0xA000,
        "window_mask": "#1FFF",
        "bank_divisor": "#2000",
    }


def _expected_manifest_v2_mapper_name(target_format: str) -> str:
    if target_format == "konami":
        return "KONAMI8K"
    if target_format == "ascii8":
        return "ASCII8"
    if target_format == "ascii16":
        return "ASCII16"
    return target_format.upper()


def _flatten_manifest_bank_resources(manifest: dict) -> list[dict[str, Any]]:
    banks = manifest.get("banks")
    if not isinstance(banks, list):
        raise RuntimeError("Manifest v2 validation failed: packing_manifest.json banks must be an array")
    resources: list[dict[str, Any]] = []
    for bank in banks:
        if not isinstance(bank, dict):
            raise RuntimeError("Manifest v2 validation failed: packing_manifest.json bank entries must be objects")
        bank_number = bank.get("bank")
        if not isinstance(bank_number, int):
            raise RuntimeError("Manifest v2 validation failed: packing_manifest.json banks need numeric bank")
        bank_resources = bank.get("resources")
        if not isinstance(bank_resources, list):
            raise RuntimeError("Manifest v2 validation failed: packing_manifest.json bank resources must be an array")
        for resource in bank_resources:
            if not isinstance(resource, dict):
                raise RuntimeError("Manifest v2 validation failed: packing_manifest.json resources must be objects")
            resources.append({**resource, "_manifest_bank": bank_number})
    return resources


def validate_manifest_v2_artifact(
    manifest_v2: dict,
    packing_manifest: dict,
    banks: dict,
    expected: dict[str, int | str],
    target_format: str,
) -> dict[str, int | str]:
    if manifest_v2.get("schema") != "mideas.manifest/2":
        raise RuntimeError("Manifest v2 validation failed: schema must be mideas.manifest/2")
    build_id = manifest_v2.get("build_id")
    if not isinstance(build_id, str) or not re.match(r"^mideas-v2:[0-9a-f]{8}$", build_id):
        raise RuntimeError("Manifest v2 validation failed: build_id must be stable mideas-v2:<fnv1a32>")

    cartridge = manifest_v2.get("cartridge")
    if not isinstance(cartridge, dict):
        raise RuntimeError("Manifest v2 validation failed: cartridge must be an object")
    if cartridge.get("mapper") != _expected_manifest_v2_mapper_name(target_format):
        raise RuntimeError("Manifest v2 validation failed: cartridge mapper mismatch")
    if cartridge.get("bank_size") != expected["segment_size"]:
        raise RuntimeError("Manifest v2 validation failed: cartridge bank_size mismatch")
    data_window = cartridge.get("data_window")
    if not isinstance(data_window, dict):
        raise RuntimeError("Manifest v2 validation failed: cartridge data_window must be an object")
    if data_window.get("page") != expected["data_window_page"]:
        raise RuntimeError("Manifest v2 validation failed: data_window page mismatch")
    if data_window.get("base") != expected["window_base"]:
        raise RuntimeError("Manifest v2 validation failed: data_window base mismatch")
    if data_window.get("mask") != expected["window_mask"]:
        raise RuntimeError("Manifest v2 validation failed: data_window mask mismatch")
    if data_window.get("bank_divisor") != expected["bank_divisor"]:
        raise RuntimeError("Manifest v2 validation failed: data_window bank_divisor mismatch")

    layout = manifest_v2.get("layout")
    if not isinstance(layout, dict):
        raise RuntimeError("Manifest v2 validation failed: layout must be an object")
    if layout.get("file_offset_rule") != "file_offset = rom_bank_index * bank_size + bank_offset":
        raise RuntimeError("Manifest v2 validation failed: file_offset_rule mismatch")
    if layout.get("data_start_address") != packing_manifest.get("summary", {}).get("dataStartAddress"):
        raise RuntimeError("Manifest v2 validation failed: data_start_address differs from packing_manifest.json")

    groups = manifest_v2.get("groups")
    if not isinstance(groups, list) or not any(
        isinstance(group, dict) and group.get("name") == "boot" and group.get("fixed_bank") == 0
        for group in groups
    ):
        raise RuntimeError("Manifest v2 validation failed: groups must include fixed boot bank 0")

    resources = manifest_v2.get("resources")
    if not isinstance(resources, list):
        raise RuntimeError("Manifest v2 validation failed: resources must be an array")
    source_resources = _flatten_manifest_bank_resources(packing_manifest)
    if len(resources) != len(source_resources):
        raise RuntimeError("Manifest v2 validation failed: resource count differs from packing_manifest.json")

    banks_resources = [
        resource
        for bank in banks.get("banks", [])
        if isinstance(bank, dict)
        for resource in bank.get("resources", [])
        if isinstance(resource, dict)
    ]
    if len(banks_resources) != len(resources):
        raise RuntimeError("Manifest v2 validation failed: resource count differs from banks.json")

    source_by_id = {
        resource.get("id"): resource
        for resource in source_resources
        if isinstance(resource.get("id"), int)
    }
    bank_by_id = {
        resource.get("id"): resource
        for resource in banks_resources
        if isinstance(resource.get("id"), int)
    }
    seen_ids: set[int] = set()
    segment_size = int(expected["segment_size"])
    window_base = int(expected["window_base_int"])
    for resource in resources:
        if not isinstance(resource, dict):
            raise RuntimeError("Manifest v2 validation failed: resource entries must be objects")
        resource_id = resource.get("id")
        symbol = resource.get("symbol")
        if not isinstance(resource_id, int) or not isinstance(symbol, str) or not symbol:
            raise RuntimeError("Manifest v2 validation failed: resources need numeric id and symbol")
        if resource_id in seen_ids:
            raise RuntimeError("Manifest v2 validation failed: duplicate resource id")
        seen_ids.add(resource_id)
        source = source_by_id.get(resource_id)
        bank_resource = bank_by_id.get(resource_id)
        if not isinstance(source, dict) or not isinstance(bank_resource, dict):
            raise RuntimeError("Manifest v2 validation failed: resource id missing from source artifacts")
        if symbol != source.get("label") or symbol != bank_resource.get("label"):
            raise RuntimeError("Manifest v2 validation failed: resource symbol differs from source artifacts")
        if resource.get("compress") not in ("none", "zx0"):
            raise RuntimeError("Manifest v2 validation failed: resource compress must be none or zx0")
        if resource.get("lifetime") not in ("persistent", "stream"):
            raise RuntimeError("Manifest v2 validation failed: resource lifetime must be persistent or stream")
        if resource.get("runtime_target") not in ("RAM", "VRAM"):
            raise RuntimeError("Manifest v2 validation failed: resource runtime_target must be RAM or VRAM")
        size = resource.get("size")
        if not isinstance(size, dict):
            raise RuntimeError("Manifest v2 validation failed: resource size must be an object")
        if size.get("stored") != source.get("storedSize") or size.get("uncompressed") != source.get("uncompressedSize"):
            raise RuntimeError("Manifest v2 validation failed: resource size differs from packing_manifest.json")
        if resource.get("flags") != source.get("flags"):
            raise RuntimeError("Manifest v2 validation failed: resource flags differ from packing_manifest.json")
        placement = resource.get("placement")
        if not isinstance(placement, dict):
            raise RuntimeError("Manifest v2 validation failed: resource placement must be an object")
        bank_offset = placement.get("bank_offset")
        rom_bank_index = placement.get("rom_bank_index")
        if not isinstance(bank_offset, int) or not isinstance(rom_bank_index, int):
            raise RuntimeError("Manifest v2 validation failed: placement needs numeric bank_offset and rom_bank_index")
        if bank_offset != source.get("zoneOffset"):
            raise RuntimeError("Manifest v2 validation failed: bank_offset differs from packing_manifest.json")
        if placement.get("window") != expected["window_base"]:
            raise RuntimeError("Manifest v2 validation failed: placement window mismatch")
        if placement.get("window_address") != window_base + bank_offset:
            raise RuntimeError("Manifest v2 validation failed: placement window_address mismatch")
        if placement.get("physical_address") != source.get("physicalAddress"):
            raise RuntimeError("Manifest v2 validation failed: placement physical_address differs from packing_manifest.json")
        if placement.get("file_offset") != (rom_bank_index * segment_size) + bank_offset:
            raise RuntimeError("Manifest v2 validation failed: placement file_offset does not follow strict rule")
        if target_format == "konami" and placement.get("bank_index") != source.get("_manifest_bank"):
            raise RuntimeError("Manifest v2 validation failed: Konami bank_index differs from packing_manifest.json")

    verification = manifest_v2.get("verification")
    if not isinstance(verification, dict) or verification.get("algorithm") != "fnv1a32-resource-metadata":
        raise RuntimeError("Manifest v2 validation failed: verification algorithm mismatch")
    if not isinstance(verification.get("banks"), list):
        raise RuntimeError("Manifest v2 validation failed: verification banks must be an array")
    if not isinstance(verification.get("expected_ram_dumps"), list):
        raise RuntimeError("Manifest v2 validation failed: expected_ram_dumps must be an array")

    return {
        "manifest_v2_resource_count": len(resources),
        "manifest_v2_build_id": build_id,
    }


def _require_mapper_field(container: dict, path: str, expected: int | str) -> None:
    value = container
    for part in path.split("."):
        if not isinstance(value, dict):
            raise RuntimeError(f"MegaROM mapper artifact validation failed: missing {path}")
        value = value.get(part)
    if value != expected:
        raise RuntimeError(
            f"MegaROM mapper artifact validation failed: {path} must be {expected}, got {value}"
        )


def _require_runtime_layout_sample_fields(
    samples: list,
    sample_name: str,
    numeric_fields: tuple[str, ...],
    text_fields: tuple[str, ...],
) -> None:
    """Keep ASCII16 runtime-layout diagnostics actionable for label/call placement work."""
    for sample in samples:
        if not isinstance(sample, dict):
            raise RuntimeError(
                f"MegaROM mapper artifact validation failed: runtimeLayout {sample_name} samples must be objects"
            )
        for field in numeric_fields:
            if not isinstance(sample.get(field), int):
                raise RuntimeError(
                    f"MegaROM mapper artifact validation failed: runtimeLayout {sample_name} samples need numeric {field}"
                )
        for field in text_fields:
            value = sample.get(field)
            if not isinstance(value, str) or not value.strip():
                raise RuntimeError(
                    f"MegaROM mapper artifact validation failed: runtimeLayout {sample_name} samples need {field}"
                )


def _validate_proposed_resource_placement(
    placement: object,
    resource_size_by_id: dict[int, int],
    segment_size: int,
    window_base_int: int,
    expected_bank: int | None = None,
) -> int:
    """Validate one dry-run allocator placement entry and return its resource id."""
    if not isinstance(placement, dict):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements entries must be objects")
    resource_id = placement.get("id")
    placement_bank = placement.get("bank")
    zone_offset = placement.get("zoneOffset")
    window_address = placement.get("windowAddress")
    stored_size = placement.get("storedSize")
    placement_reason = placement.get("placementReason")
    if not all(isinstance(value, int) for value in (resource_id, placement_bank, zone_offset, window_address, stored_size)):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements need numeric placement fields")
    if resource_id not in resource_size_by_id:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements reference unknown resource id")
    if expected_bank is not None and placement_bank != expected_bank:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements bank mismatch")
    if stored_size != resource_size_by_id[resource_id]:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements storedSize mismatch")
    if zone_offset < 0 or zone_offset + stored_size > segment_size:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements cross mapper data segment")
    if window_address != window_base_int + zone_offset:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements windowAddress mismatch")
    if not isinstance(placement_reason, str) or not placement_reason.strip():
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements need placementReason")
    return resource_id


def _proposed_resource_placement_signature(placement: dict) -> tuple[int, int, int, int, str]:
    """Return the fields that must match between aggregate and per-bank placement views."""
    return (
        int(placement["bank"]),
        int(placement["zoneOffset"]),
        int(placement["windowAddress"]),
        int(placement["storedSize"]),
        str(placement["placementReason"]).strip(),
    )


def _require_matching_proposed_resource_placements(
    per_bank_placements_by_id: dict[int, tuple[int, int, int, int, str]],
    top_level_placements_by_id: dict[int, tuple[int, int, int, int, str]],
) -> None:
    """Ensure proposedPlacement.resourcePlacements is not stale versus its per-bank source."""
    if top_level_placements_by_id != per_bank_placements_by_id:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement top-level resourcePlacements mismatch")


def _validate_segment_budget_boss_data_banks(
    segment_budget: dict,
    expected: dict[str, object],
    segment_size: int,
    error_prefix: str,
) -> set[int]:
    boss_data_banks = segment_budget.get("bossDataBanks", [])
    if not isinstance(boss_data_banks, list):
        raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks must be an array")

    bank_numbers: set[int] = set()
    for budget_bank in boss_data_banks:
        if not isinstance(budget_bank, dict):
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks entries must be objects")
        bank_number = budget_bank.get("bank")
        org_address = budget_bank.get("orgAddress")
        end_address = budget_bank.get("endAddress")
        used = budget_bank.get("usedBytes")
        free = budget_bank.get("freeBytes")
        bank_segment_size = budget_bank.get("segmentSize")
        if not all(isinstance(value, int) for value in (bank_number, org_address, end_address, used, free, bank_segment_size)):
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks accounting must be numeric")
        if bank_number in bank_numbers:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks bank numbers must be unique")
        bank_numbers.add(bank_number)
        if budget_bank.get("role") != "boss_data":
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks role must be boss_data")
        if bank_segment_size != segment_size:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks segmentSize mismatch")
        if org_address != 0x4000 + (bank_number * segment_size) or end_address != org_address + segment_size:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks range must match mapper segment")
        if used < 0 or free < 0 or used > segment_size or free > segment_size or used + free != segment_size:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks accounting must match mapper segment")
        if budget_bank.get("dataWindowPage") != expected["data_window_page"]:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks dataWindowPage mismatch")
        if budget_bank.get("windowBase") != expected["window_base"]:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks windowBase mismatch")
        if budget_bank.get("windowMask") != expected["window_mask"]:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks windowMask mismatch")
        if budget_bank.get("bankDivisor") != expected["bank_divisor"]:
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks bankDivisor mismatch")
        boss_id = budget_bank.get("bossId")
        boss_name = budget_bank.get("bossName")
        placement_reason = budget_bank.get("placementReason")
        if not isinstance(boss_id, str):
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks need string bossId")
        if not isinstance(boss_name, str) or not boss_name.strip():
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks need bossName")
        if not isinstance(placement_reason, str) or not placement_reason.strip():
            raise RuntimeError(f"{error_prefix}: segment_budget.json bossDataBanks need placementReason")

    return bank_numbers


def validate_megarom_mapper_artifact_metadata(
    artifact_dir: Path | None,
    target_format: str,
    strict_tilebank_integrity: bool = False,
) -> dict[str, int | str]:
    if artifact_dir is None:
        raise RuntimeError("MegaROM mapper artifact validation failed: missing generated artifact directory")

    expected = _expected_megarom_mapper_window(target_format)
    segment_size = int(expected["segment_size"])
    window_base_int = int(expected["window_base_int"])

    manifest = _require_json_object(artifact_dir / "packing_manifest.json")
    manifest_v2 = _require_json_object(artifact_dir / "manifest_v2.json")
    banks = _require_json_object(artifact_dir / "banks.json")
    project_usage = _require_json_object(artifact_dir / "project_usage.json")
    load_plan = _require_json_object(artifact_dir / "load_plan.json")
    bank_optimizer = _require_json_object(artifact_dir / "bank_optimizer.json")
    tilebank_integrity = _require_json_object(artifact_dir / "tilebank_integrity.json")
    segment_budget = _require_json_object(artifact_dir / "segment_budget.json")

    _require_mapper_field(manifest, "mapper.format", expected["format"])
    _require_mapper_field(manifest, "mapper.dataWindowPage", expected["data_window_page"])
    _require_mapper_field(manifest, "mapper.windowBase", expected["window_base"])
    _require_mapper_field(manifest, "mapper.windowMask", expected["window_mask"])
    _require_mapper_field(manifest, "mapper.bankDivisor", expected["bank_divisor"])
    _require_mapper_field(manifest, "mapper.zoneSize", segment_size)

    _require_mapper_field(banks, "mapperFormat", expected["format"])
    _require_mapper_field(banks, "segmentSize", segment_size)
    _require_mapper_field(banks, "dataWindow.page", expected["data_window_page"])
    _require_mapper_field(banks, "dataWindow.base", expected["window_base"])
    _require_mapper_field(banks, "dataWindow.mask", expected["window_mask"])
    _require_mapper_field(banks, "dataWindow.bankDivisor", expected["bank_divisor"])

    _require_mapper_field(project_usage, "mapper.format", expected["format"])
    _require_mapper_field(project_usage, "mapper.segmentSize", segment_size)
    _require_mapper_field(project_usage, "mapper.dataWindowPage", expected["data_window_page"])
    _require_mapper_field(project_usage, "mapper.windowBase", expected["window_base"])
    _require_mapper_field(project_usage, "mapper.windowMask", expected["window_mask"])
    _require_mapper_field(project_usage, "mapper.bankDivisor", expected["bank_divisor"])

    _require_mapper_field(load_plan, "mapper.format", expected["format"])
    _require_mapper_field(load_plan, "mapper.segmentSize", segment_size)
    _require_mapper_field(load_plan, "mapper.dataWindowPage", expected["data_window_page"])
    _require_mapper_field(load_plan, "mapper.windowBase", expected["window_base"])
    _require_mapper_field(load_plan, "mapper.windowMask", expected["window_mask"])
    _require_mapper_field(load_plan, "mapper.bankDivisor", expected["bank_divisor"])

    _require_mapper_field(bank_optimizer, "constraints.mapperFormat", expected["format"])
    _require_mapper_field(bank_optimizer, "constraints.segmentSize", segment_size)
    _require_mapper_field(bank_optimizer, "constraints.dataWindow.page", expected["data_window_page"])
    _require_mapper_field(bank_optimizer, "constraints.dataWindow.base", expected["window_base"])
    _require_mapper_field(bank_optimizer, "constraints.dataWindow.mask", expected["window_mask"])
    _require_mapper_field(bank_optimizer, "constraints.dataWindow.bankDivisor", expected["bank_divisor"])

    _require_mapper_field(segment_budget, "mapper.format", expected["format"])
    _require_mapper_field(segment_budget, "mapper.dataWindowPage", expected["data_window_page"])
    _require_mapper_field(segment_budget, "mapper.windowBase", expected["window_base"])
    _require_mapper_field(segment_budget, "mapper.windowMask", expected["window_mask"])
    _require_mapper_field(segment_budget, "mapper.bankDivisor", expected["bank_divisor"])
    _require_mapper_field(segment_budget, "mapper.dataSegmentSize", segment_size)
    manifest_v2_validation = validate_manifest_v2_artifact(
        manifest_v2,
        manifest,
        banks,
        expected,
        target_format,
    )
    if segment_budget.get("codeSegmentSize") != 8192:
        raise RuntimeError("MegaROM mapper artifact validation failed: segment_budget.json codeSegmentSize must be 8192")
    if segment_budget.get("dataSegmentSize") != segment_size:
        raise RuntimeError("MegaROM mapper artifact validation failed: segment_budget.json dataSegmentSize must match mapper segment size")
    runtime_layout = segment_budget.get("runtimeLayout")
    if not isinstance(runtime_layout, dict):
        raise RuntimeError("MegaROM mapper artifact validation failed: segment_budget.json runtimeLayout must be an object")
    if runtime_layout.get("mapperFormat") != expected["format"]:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout mapperFormat differs from requested mapper")
    if runtime_layout.get("codeWindowGranularity") != (0x4000 if target_format == "ascii16" else 8192):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout codeWindowGranularity mismatch")
    lower_page_resident_banks = runtime_layout.get("lowerPageResidentBanks")
    lower_page_far_banks = runtime_layout.get("lowerPageFarBanks")
    upper_page_resident_banks = runtime_layout.get("upperPageResidentBanks", [])
    if not isinstance(lower_page_resident_banks, list) or not all(isinstance(bank, int) for bank in lower_page_resident_banks):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout lowerPageResidentBanks must be numeric")
    if not isinstance(lower_page_far_banks, list) or not all(isinstance(bank, int) for bank in lower_page_far_banks):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout lowerPageFarBanks must be numeric")
    if not isinstance(upper_page_resident_banks, list) or not all(isinstance(bank, int) for bank in upper_page_resident_banks):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout upperPageResidentBanks must be numeric")
    expected_lower_page_hazards = len(lower_page_resident_banks) + len(lower_page_far_banks)
    if runtime_layout.get("lowerPageHazardBankCount") != expected_lower_page_hazards:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout lower-page hazard accounting mismatch")
    hidden_resident_calls = runtime_layout.get("lowerPageHiddenResidentCallCount", 0)
    if not isinstance(hidden_resident_calls, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout hidden resident call count must be numeric")
    data_window_resident_conflict = bool(runtime_layout.get("dataWindowResidentConflict"))
    ram_trampoline_required = bool(runtime_layout.get("ramTrampolineRequired"))
    ram_trampoline_installed = bool(runtime_layout.get("ramTrampolineInstalled"))
    resident_estimated_window_overflows = runtime_layout.get("residentEstimatedWindowOverflowCount", 0)
    if not isinstance(resident_estimated_window_overflows, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident window overflow count must be numeric")
    resident_estimated_window_overflow_samples = runtime_layout.get("residentEstimatedWindowOverflowSamples", [])
    if not isinstance(resident_estimated_window_overflow_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident window overflow samples must be an array")
    if resident_estimated_window_overflows > 0 and not resident_estimated_window_overflow_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident window overflow samples required")
    if len(resident_estimated_window_overflow_samples) > resident_estimated_window_overflows:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident window overflow sample accounting mismatch")
    _require_runtime_layout_sample_fields(
        resident_estimated_window_overflow_samples,
        "estimated resident window overflow",
        ("bank", "estimatedBytes", "windowBytes", "overflowBytes", "estimatedSegments"),
        ("module",),
    )
    resident_estimated_out_of_window_labels = runtime_layout.get("residentEstimatedOutOfWindowLabelCount", 0)
    if not isinstance(resident_estimated_out_of_window_labels, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window label count must be numeric")
    resident_estimated_out_of_window_label_samples = runtime_layout.get("residentEstimatedOutOfWindowLabelSamples", [])
    if not isinstance(resident_estimated_out_of_window_label_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window label samples must be an array")
    if resident_estimated_out_of_window_labels > 0 and not resident_estimated_out_of_window_label_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window label samples required")
    if len(resident_estimated_out_of_window_label_samples) > resident_estimated_out_of_window_labels:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window label sample accounting mismatch")
    _require_runtime_layout_sample_fields(
        resident_estimated_out_of_window_label_samples,
        "estimated resident out-of-window label",
        ("bank", "line", "estimatedOffset", "estimatedAddress", "estimatedSegment"),
        ("label", "module"),
    )
    resident_estimated_out_of_window_calls = runtime_layout.get("residentEstimatedOutOfWindowCallCount", 0)
    if not isinstance(resident_estimated_out_of_window_calls, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window call count must be numeric")
    resident_estimated_out_of_window_call_samples = runtime_layout.get("residentEstimatedOutOfWindowCallSamples", [])
    if not isinstance(resident_estimated_out_of_window_call_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window call samples must be an array")
    if resident_estimated_out_of_window_calls > 0 and not resident_estimated_out_of_window_call_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window call samples required")
    if len(resident_estimated_out_of_window_call_samples) > resident_estimated_out_of_window_calls:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout estimated resident out-of-window call sample accounting mismatch")
    _require_runtime_layout_sample_fields(
        resident_estimated_out_of_window_call_samples,
        "estimated resident out-of-window call",
        ("callerBank", "line", "targetBank", "targetEstimatedOffset", "targetEstimatedAddress", "targetEstimatedSegment"),
        ("callerModule", "target", "targetModule"),
    )
    far_to_far_direct_calls = runtime_layout.get("farToFarDirectCallCount", 0)
    if not isinstance(far_to_far_direct_calls, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout far-to-far direct call count must be numeric")
    far_to_far_direct_call_samples = runtime_layout.get("farToFarDirectCallSamples", [])
    if not isinstance(far_to_far_direct_call_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout far-to-far direct call samples must be an array")
    if far_to_far_direct_calls > 0 and not far_to_far_direct_call_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout far-to-far direct call samples required")
    if len(far_to_far_direct_call_samples) > far_to_far_direct_calls:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout far-to-far direct call sample accounting mismatch")
    _require_runtime_layout_sample_fields(
        far_to_far_direct_call_samples,
        "far-to-far direct call",
        ("callerBank", "line", "targetBank"),
        ("callerModule", "target", "targetModule"),
    )
    hidden_resident_call_samples = runtime_layout.get("lowerPageHiddenResidentCallSamples", [])
    if not isinstance(hidden_resident_call_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout hidden resident call samples must be an array")
    if hidden_resident_calls > 0 and not hidden_resident_call_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout hidden resident call samples required")
    if len(hidden_resident_call_samples) > hidden_resident_calls:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout hidden resident call sample accounting mismatch")
    _require_runtime_layout_sample_fields(
        hidden_resident_call_samples,
        "hidden resident call",
        ("bank", "line"),
        ("module", "target"),
    )
    resident_bridge_calls = runtime_layout.get("residentBridgeCallCount", 0)
    if not isinstance(resident_bridge_calls, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call count must be numeric")
    resident_bridge_call_samples = runtime_layout.get("residentBridgeCallSamples", [])
    if not isinstance(resident_bridge_call_samples, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call samples must be an array")
    if resident_bridge_calls > 0 and not resident_bridge_call_samples:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call samples required")
    if len(resident_bridge_call_samples) > resident_bridge_calls:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call sample accounting mismatch")
    for sample in resident_bridge_call_samples:
        if not isinstance(sample, dict):
            raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call samples must be objects")
        if not isinstance(sample.get("bank"), int):
            raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout resident bridge call samples need numeric bank")
        for field in ("module", "target", "stub"):
            if not isinstance(sample.get(field), str) or not sample.get(field).strip():
                raise RuntimeError(f"MegaROM mapper artifact validation failed: runtimeLayout resident bridge call samples need {field}")
    expected_smoke_blocked = target_format == "ascii16" and (
        hidden_resident_calls > 0
        or far_to_far_direct_calls > 0
        or data_window_resident_conflict
        or (ram_trampoline_required and not ram_trampoline_installed)
    )
    if runtime_layout.get("smokeBlocked") != expected_smoke_blocked:
        raise RuntimeError("MegaROM mapper artifact validation failed: runtimeLayout smokeBlocked mismatch")

    tilebank_summary = tilebank_integrity.get("summary") if isinstance(tilebank_integrity.get("summary"), dict) else {}
    tilebank_issue_screens = tilebank_summary.get("issueScreens", 0)
    tilebank_issue_cells = tilebank_summary.get("issueCells", 0)
    tilebank_missing_asset_cells = tilebank_summary.get("missingAssetCells", 0)
    tilebank_unassigned_cells = tilebank_summary.get("unassignedCells", 0)
    if not isinstance(tilebank_issue_screens, int) or not isinstance(tilebank_issue_cells, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: tilebank_integrity.json summary accounting must be numeric")
    if not isinstance(tilebank_missing_asset_cells, int) or not isinstance(tilebank_unassigned_cells, int):
        raise RuntimeError("MegaROM mapper artifact validation failed: tilebank_integrity.json issue breakdown must be numeric")
    if strict_tilebank_integrity and tilebank_issue_cells:
        raise RuntimeError(
            "MegaROM mapper artifact validation failed: strict tilebank integrity requires zero issue cells; "
            f"issueScreens={tilebank_issue_screens}, issueCells={tilebank_issue_cells}, "
            f"missingAssetCells={tilebank_missing_asset_cells}, unassignedCells={tilebank_unassigned_cells}"
        )

    manifest_banks = manifest.get("banks")
    banks_banks = banks.get("banks")
    if not isinstance(manifest_banks, list) or not isinstance(banks_banks, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: manifest and banks artifacts need bank arrays")
    if len(manifest_banks) != len(banks_banks):
        raise RuntimeError("MegaROM mapper artifact validation failed: manifest and banks bank counts differ")

    resource_count = 0
    resource_size_by_id: dict[int, int] = {}
    resource_raw_size_by_id: dict[int, int] = {}
    resource_flags_by_id: dict[int, int] = {}
    manifest_data_banks: set[int] = set()
    manifest_zone_banks: set[int] = set()
    for bank in manifest_banks:
        if not isinstance(bank, dict):
            raise RuntimeError("MegaROM mapper artifact validation failed: manifest bank entries must be objects")
        bank_number = bank.get("bank")
        org_address = bank.get("orgAddress")
        end_address = bank.get("endAddress")
        used = bank.get("usedBytes")
        free = bank.get("freeBytes")
        if not all(isinstance(value, int) for value in (bank_number, org_address, end_address, used, free)):
            raise RuntimeError("MegaROM mapper artifact validation failed: manifest bank accounting must be numeric")
        if org_address != 0x4000 + (bank_number * segment_size) or end_address != org_address + segment_size:
            raise RuntimeError("MegaROM mapper artifact validation failed: manifest bank range does not match mapper segment size")
        if used < 0 or free < 0 or used > segment_size or free > segment_size or used + free != segment_size:
            raise RuntimeError("MegaROM mapper artifact validation failed: manifest bank accounting does not match mapper segment size")
        resources = bank.get("resources")
        if not isinstance(resources, list):
            raise RuntimeError("MegaROM mapper artifact validation failed: manifest bank resources must be an array")
        manifest_zone_banks.add(bank_number)
        if resources:
            manifest_data_banks.add(bank_number)
        for resource in resources:
            if not isinstance(resource, dict):
                raise RuntimeError("MegaROM mapper artifact validation failed: manifest resources must be objects")
            zone_offset = resource.get("zoneOffset")
            physical_address = resource.get("physicalAddress")
            window_address = resource.get("windowAddress")
            stored_size = resource.get("storedSize", resource.get("size"))
            raw_size = resource.get("uncompressedSize", stored_size)
            flags = resource.get("flags", 0)
            if not all(isinstance(value, int) for value in (zone_offset, physical_address, window_address, stored_size, raw_size, flags)):
                raise RuntimeError("MegaROM mapper artifact validation failed: resource placement fields must be numeric")
            placement_reason = resource.get("placementReason")
            if not isinstance(placement_reason, str) or not placement_reason.strip():
                raise RuntimeError("MegaROM mapper artifact validation failed: manifest resources need placementReason")
            if zone_offset < 0 or stored_size <= 0 or zone_offset + stored_size > segment_size:
                raise RuntimeError("MegaROM mapper artifact validation failed: resource crosses mapper data segment")
            if physical_address != org_address + zone_offset:
                raise RuntimeError("MegaROM mapper artifact validation failed: resource physical address does not match zone offset")
            if window_address != window_base_int + zone_offset:
                raise RuntimeError("MegaROM mapper artifact validation failed: resource window address does not match mapper base")
            resource_id = resource.get("id")
            if not isinstance(resource_id, int):
                raise RuntimeError("MegaROM mapper artifact validation failed: manifest resources need numeric id")
            if resource_id in resource_size_by_id:
                raise RuntimeError("MegaROM mapper artifact validation failed: manifest resource ids must be unique")
            resource_size_by_id[resource_id] = stored_size
            resource_raw_size_by_id[resource_id] = raw_size
            resource_flags_by_id[resource_id] = flags
            resource_count += 1

    boss_data_banks = _validate_segment_budget_boss_data_banks(
        segment_budget,
        expected,
        segment_size,
        "MegaROM mapper artifact validation failed",
    )
    if boss_data_banks & manifest_zone_banks:
        raise RuntimeError("MegaROM mapper artifact validation failed: bossDataBanks must not overlap dataBanks")

    manifest_stored_bytes = sum(resource_size_by_id.values())
    manifest_raw_bytes = sum(resource_raw_size_by_id.values())
    manifest_compressed_resources = sum(1 for flags in resource_flags_by_id.values() if flags & 1)

    load_summary = load_plan.get("summary")
    load_scenes = load_plan.get("scenes")
    if not isinstance(load_summary, dict):
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan.json summary must be an object")
    if not isinstance(load_scenes, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan.json scenes must be an array")
    if load_summary.get("sceneCount") != len(load_scenes):
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary sceneCount differs from scenes")
    if load_summary.get("resourceCount") != resource_count:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary resourceCount differs from manifest")
    if load_summary.get("totalStoredBytes") != manifest_stored_bytes:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary stored byte accounting mismatch")
    if load_summary.get("totalRawBytes") != manifest_raw_bytes:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary raw byte accounting mismatch")
    if load_summary.get("compressedResources") != manifest_compressed_resources:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary compressed resource accounting mismatch")

    scene_bank_touches = 0
    max_scene_bank_touches = 0
    for load_scene in load_scenes:
        if not isinstance(load_scene, dict):
            raise RuntimeError("MegaROM mapper artifact validation failed: load_plan scene entries must be objects")
        load_banks = load_scene.get("banks")
        if not isinstance(load_banks, list):
            raise RuntimeError("MegaROM mapper artifact validation failed: load_plan scene banks must be an array")
        scene_bank_touches += len(load_banks)
        max_scene_bank_touches = max(max_scene_bank_touches, len(load_banks))
        scene_resource_ids: list[int] = []
        scene_stored_bytes = 0
        scene_raw_bytes = 0
        for load_bank in load_banks:
            if not isinstance(load_bank, dict):
                raise RuntimeError("MegaROM mapper artifact validation failed: load_plan bank entries must be objects")
            bank_number = load_bank.get("bank")
            resource_ids = load_bank.get("resourceIds")
            stored_bytes = load_bank.get("storedBytes")
            raw_bytes = load_bank.get("rawBytes")
            if not isinstance(bank_number, int) or not isinstance(resource_ids, list) or not all(isinstance(resource_id, int) for resource_id in resource_ids):
                raise RuntimeError("MegaROM mapper artifact validation failed: load_plan bank needs numeric bank and resourceIds")
            if not isinstance(stored_bytes, int) or not isinstance(raw_bytes, int):
                raise RuntimeError("MegaROM mapper artifact validation failed: load_plan bank accounting must be numeric")
            expected_stored = 0
            expected_raw = 0
            for resource_id in resource_ids:
                if resource_id not in resource_size_by_id:
                    raise RuntimeError("MegaROM mapper artifact validation failed: load_plan references unknown resource id")
                expected_stored += resource_size_by_id[resource_id]
                expected_raw += resource_raw_size_by_id[resource_id]
                scene_resource_ids.append(resource_id)
            if stored_bytes != expected_stored or raw_bytes != expected_raw:
                raise RuntimeError("MegaROM mapper artifact validation failed: load_plan bank byte accounting mismatch")
            scene_stored_bytes += stored_bytes
            scene_raw_bytes += raw_bytes
        if load_scene.get("resourceCount") != len(scene_resource_ids):
            raise RuntimeError("MegaROM mapper artifact validation failed: load_plan scene resourceCount mismatch")
        if load_scene.get("totalStoredBytes") != scene_stored_bytes or load_scene.get("totalRawBytes") != scene_raw_bytes:
            raise RuntimeError("MegaROM mapper artifact validation failed: load_plan scene byte accounting mismatch")
        scene_compressed_resources = sum(1 for resource_id in scene_resource_ids if resource_flags_by_id[resource_id] & 1)
        if load_scene.get("compressedResources") != scene_compressed_resources:
            raise RuntimeError("MegaROM mapper artifact validation failed: load_plan scene compressed resource accounting mismatch")
    if load_summary.get("totalSceneBankTouches") != scene_bank_touches:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary scene-bank touch accounting mismatch")
    if load_summary.get("maxSceneBankTouches") != max_scene_bank_touches:
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary max scene-bank touch mismatch")
    if load_summary.get("uniqueDataBanks") != len(manifest_data_banks):
        raise RuntimeError("MegaROM mapper artifact validation failed: load_plan summary unique data-bank accounting mismatch")

    current_placement = bank_optimizer.get("currentPlacement")
    if not isinstance(current_placement, dict):
        raise RuntimeError("MegaROM mapper artifact validation failed: bank_optimizer.json currentPlacement must be an object")
    if current_placement.get("resourceCount") != resource_count:
        raise RuntimeError("MegaROM mapper artifact validation failed: currentPlacement resourceCount differs from manifest")
    if current_placement.get("totalStoredBytes") != manifest_stored_bytes:
        raise RuntimeError("MegaROM mapper artifact validation failed: currentPlacement stored byte accounting mismatch")
    if current_placement.get("totalRawBytes") != manifest_raw_bytes:
        raise RuntimeError("MegaROM mapper artifact validation failed: currentPlacement raw byte accounting mismatch")
    if current_placement.get("compressedResources") != manifest_compressed_resources:
        raise RuntimeError("MegaROM mapper artifact validation failed: currentPlacement compressed resource accounting mismatch")

    proposed_placement = bank_optimizer.get("proposedPlacement")
    if not isinstance(proposed_placement, dict):
        raise RuntimeError("MegaROM mapper artifact validation failed: bank_optimizer.json proposedPlacement must be an object")
    if proposed_placement.get("resourceCount") != resource_count:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourceCount differs from manifest")
    if proposed_placement.get("totalStoredBytes") != manifest_stored_bytes:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement stored byte accounting mismatch")
    if proposed_placement.get("zoneSize") != segment_size:
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement zoneSize must match mapper segment size")
    proposed_banks = proposed_placement.get("banks")
    if not isinstance(proposed_banks, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement banks must be an array")
    proposed_top_level_placements = proposed_placement.get("resourcePlacements")
    if not isinstance(proposed_top_level_placements, list):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements must be an array")
    proposed_resource_ids: list[int] = []
    proposed_placement_resource_ids: list[int] = []
    proposed_placements_by_id: dict[int, tuple[int, int, int, int, str]] = {}
    for proposed_bank in proposed_banks:
        if not isinstance(proposed_bank, dict):
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement bank entries must be objects")
        used = proposed_bank.get("usedBytes")
        free = proposed_bank.get("freeBytes")
        if not isinstance(used, int) or not isinstance(free, int):
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement bank accounting must be numeric")
        if used < 0 or free < 0 or used > segment_size or free > segment_size or used + free != segment_size:
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement accounting must match mapper segment size")
        resource_ids = proposed_bank.get("resourceIds")
        if not isinstance(resource_ids, list) or not all(isinstance(resource_id, int) for resource_id in resource_ids):
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement bank resourceIds must be numeric")
        resource_placements = proposed_bank.get("resourcePlacements")
        if not isinstance(resource_placements, list):
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement bank resourcePlacements must be an array")
        proposed_used = 0
        for resource_id in resource_ids:
            if resource_id not in resource_size_by_id:
                raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement references unknown resource id")
            proposed_used += resource_size_by_id[resource_id]
            proposed_resource_ids.append(resource_id)
        if proposed_used != used:
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement bank usedBytes must equal resource sizes")
        bank_placement_ids: list[int] = []
        for placement in resource_placements:
            resource_id = _validate_proposed_resource_placement(
                placement,
                resource_size_by_id,
                segment_size,
                window_base_int,
                proposed_bank.get("bank"),
            )
            bank_placement_ids.append(resource_id)
            proposed_placement_resource_ids.append(resource_id)
            proposed_placements_by_id[resource_id] = _proposed_resource_placement_signature(placement)
        if sorted(bank_placement_ids) != sorted(resource_ids):
            raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements must match bank resourceIds")
    if sorted(proposed_resource_ids) != sorted(resource_size_by_id):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement must include every manifest resource exactly once")
    top_level_placement_ids: list[int] = []
    top_level_placements_by_id: dict[int, tuple[int, int, int, int, str]] = {}
    for placement in proposed_top_level_placements:
        resource_id = _validate_proposed_resource_placement(
            placement,
            resource_size_by_id,
            segment_size,
            window_base_int,
        )
        top_level_placement_ids.append(resource_id)
        top_level_placements_by_id[resource_id] = _proposed_resource_placement_signature(placement)
    if sorted(proposed_placement_resource_ids) != sorted(resource_size_by_id):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement resourcePlacements must include every manifest resource exactly once")
    if sorted(top_level_placement_ids) != sorted(proposed_placement_resource_ids):
        raise RuntimeError("MegaROM mapper artifact validation failed: proposedPlacement top-level resourcePlacements mismatch")
    _require_matching_proposed_resource_placements(proposed_placements_by_id, top_level_placements_by_id)

    return {
        "mapper_format": str(expected["format"]),
        "segment_size": segment_size,
        "data_window_page": str(expected["data_window_page"]),
        "window_base": str(expected["window_base"]),
        "resource_count": resource_count,
        "bank_count": len(manifest_banks),
        "boss_data_bank_count": len(boss_data_banks),
        "manifest_v2_build_id": str(manifest_v2_validation["manifest_v2_build_id"]),
        "tilebank_issue_screens": tilebank_issue_screens,
        "tilebank_issue_cells": tilebank_issue_cells,
        "tilebank_missing_asset_cells": tilebank_missing_asset_cells,
        "tilebank_unassigned_cells": tilebank_unassigned_cells,
    }


def _inspect_ascii16_actual_resident_symbols(segment_budget: dict, sym_path: Path | None) -> dict[str, Any]:
    """Compare assembled resident bank end symbols with their configured windows."""
    if sym_path is None or not sym_path.exists():
        return {
            "symbols_available": False,
            "actual_resident_window_overflow_count": 0,
            "max_actual_resident_used": 0,
            "min_actual_resident_free": 0,
            "actual_resident_low_free_threshold": ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES,
            "actual_resident_low_free_bank_count": 0,
            "actual_resident_low_free_bank_usages": [],
            "actual_resident_bank_usages": [],
        }

    overflow_count = 0
    max_used = 0
    bank_usages: list[dict[str, int | bool]] = []
    sym_text = sym_path.read_text(encoding="utf-8", errors="ignore")
    code_banks = segment_budget.get("codeBanks")
    if not isinstance(code_banks, list):
        return {
            "symbols_available": True,
            "actual_resident_window_overflow_count": 0,
            "max_actual_resident_used": 0,
            "min_actual_resident_free": 0,
            "actual_resident_low_free_threshold": ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES,
            "actual_resident_low_free_bank_count": 0,
            "actual_resident_low_free_bank_usages": [],
            "actual_resident_bank_usages": [],
        }

    for code_bank in code_banks:
        if not isinstance(code_bank, dict) or code_bank.get("role") != "resident_code":
            continue
        bank_number = code_bank.get("bank")
        org_address = code_bank.get("orgAddress")
        end_address = code_bank.get("endAddress")
        if not all(isinstance(value, int) for value in (bank_number, org_address, end_address)):
            continue
        try:
            used_end = _sym_equ_value(sym_text, f"BANK_{bank_number}_USED_END")
        except RuntimeError:
            continue
        actual_used = max(0, used_end - org_address)
        window_bytes = max(0, end_address - org_address)
        overflow_bytes = max(0, used_end - end_address)
        max_used = max(max_used, actual_used)
        if overflow_bytes > 0:
            overflow_count += 1
        bank_usages.append({
            "bank": bank_number,
            "orgAddress": org_address,
            "endAddress": end_address,
            "usedEnd": used_end,
            "actualUsedBytes": actual_used,
            "windowBytes": window_bytes,
            "freeBytes": max(0, window_bytes - actual_used),
            "overflowBytes": overflow_bytes,
            "overflow": overflow_bytes > 0,
        })

    low_free_bank_usages = [
        bank
        for bank in bank_usages
        if not bool(bank["overflow"]) and int(bank["freeBytes"]) < ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES
    ]
    return {
        "symbols_available": True,
        "actual_resident_window_overflow_count": overflow_count,
        "max_actual_resident_used": max_used,
        "min_actual_resident_free": min((int(bank["freeBytes"]) for bank in bank_usages), default=0),
        "actual_resident_low_free_threshold": ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES,
        "actual_resident_low_free_bank_count": len(low_free_bank_usages),
        "actual_resident_low_free_bank_usages": low_free_bank_usages,
        "actual_resident_bank_usages": bank_usages,
    }


def inspect_ascii16_runtime_layout(
    asm_path: Path,
    artifact_dir: Path | None = None,
    sym_path: Path | None = None,
) -> dict[str, Any]:
    """Classify whether the current ASCII16 ASM layout is safe enough for gameplay smoke."""
    if artifact_dir is not None:
        segment_budget_path = artifact_dir / "segment_budget.json"
        if segment_budget_path.exists():
            segment_budget = _require_json_object(segment_budget_path)
            runtime_layout = segment_budget.get("runtimeLayout")
            if isinstance(runtime_layout, dict) and runtime_layout.get("mapperFormat") == "ascii16":
                actual_resident = _inspect_ascii16_actual_resident_symbols(segment_budget, sym_path)
                resident_banks = runtime_layout.get("lowerPageResidentBanks")
                far_banks = runtime_layout.get("lowerPageFarBanks")
                upper_resident_banks = runtime_layout.get("upperPageResidentBanks", [])
                if isinstance(resident_banks, list) and isinstance(far_banks, list):
                    resident_count = len([bank for bank in resident_banks if isinstance(bank, int)])
                    far_count = len([bank for bank in far_banks if isinstance(bank, int)])
                    upper_resident_count = len([bank for bank in upper_resident_banks if isinstance(bank, int)]) if isinstance(upper_resident_banks, list) else 0
                    smoke_blocked = bool(runtime_layout.get("smokeBlocked"))
                    resident_estimated_window_overflows = int(runtime_layout.get("residentEstimatedWindowOverflowCount") or 0)
                    actual_symbols_available = bool(actual_resident["symbols_available"])
                    actual_resident_window_overflows = int(actual_resident["actual_resident_window_overflow_count"])
                    declared_status = str(runtime_layout.get("status", "compile-only" if smoke_blocked else "smoke-candidate"))
                    if smoke_blocked or actual_resident_window_overflows > 0:
                        runtime_status = "compile-only"
                    elif actual_symbols_available:
                        runtime_status = "smoke-candidate"
                    elif resident_estimated_window_overflows > 0:
                        runtime_status = "smoke-candidate-risk"
                    else:
                        runtime_status = declared_status
                    reason = str(runtime_layout.get("reason", ""))
                    if (
                        declared_status == "smoke-candidate-risk"
                        and runtime_status == "smoke-candidate"
                        and resident_estimated_window_overflows > 0
                    ):
                        reason = (
                            f"ASCII16 estimated resident pressure remains diagnostic-only: "
                            f"{resident_estimated_window_overflows} estimated bank group(s) exceed the fixed window, "
                            f"but Glass symbols report actualResidentOverflows=0 and maxActualResidentUsed="
                            f"{int(actual_resident['max_actual_resident_used'])}."
                        )
                    return {
                        "mapper_format": "ascii16",
                        "runtime_status": runtime_status,
                        "declared_runtime_status": declared_status,
                        "smoke_blocked": smoke_blocked,
                        "far_lower_page_bank_count": far_count,
                        "resident_lower_page_bank_count": resident_count,
                        "upper_resident_bank_count": upper_resident_count,
                        "lower_page_hazard_bank_count": resident_count + far_count,
                        "far_trampolines_switch_p1": far_count > 0 and not bool(runtime_layout.get("ramTrampolineInstalled")),
                        "ram_trampoline_required": bool(runtime_layout.get("ramTrampolineRequired")),
                        "ram_trampoline_installed": bool(runtime_layout.get("ramTrampolineInstalled")),
                        "resident_estimated_window_overflow_count": resident_estimated_window_overflows,
                        "resident_estimated_out_of_window_label_count": int(runtime_layout.get("residentEstimatedOutOfWindowLabelCount") or 0),
                        "resident_estimated_out_of_window_call_count": int(runtime_layout.get("residentEstimatedOutOfWindowCallCount") or 0),
                        "far_to_far_direct_call_count": int(runtime_layout.get("farToFarDirectCallCount") or 0),
                        "resident_bridge_call_count": int(runtime_layout.get("residentBridgeCallCount") or 0),
                        "actual_resident_symbols_available": actual_symbols_available,
                        "actual_resident_window_overflow_count": actual_resident_window_overflows,
                        "max_actual_resident_used": int(actual_resident["max_actual_resident_used"]),
                        "min_actual_resident_free": int(actual_resident["min_actual_resident_free"]),
                        "actual_resident_low_free_threshold": int(actual_resident["actual_resident_low_free_threshold"]),
                        "actual_resident_low_free_bank_count": int(actual_resident["actual_resident_low_free_bank_count"]),
                        "actual_resident_low_free_bank_usages": actual_resident["actual_resident_low_free_bank_usages"],
                        "actual_resident_bank_usages": actual_resident["actual_resident_bank_usages"],
                        "hidden_resident_call_count": int(runtime_layout.get("lowerPageHiddenResidentCallCount") or 0),
                        "data_window_resident_conflict": bool(runtime_layout.get("dataWindowResidentConflict")),
                        "reason": reason,
                    }

    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    far_lower_page_banks = sorted(
        {int(bank) for bank in re.findall(r";\s*--- Far bank (\d+) \[#6000, window P1\]", asm_text)}
    )
    far_trampolines_switch_p1 = re.search(
        r"^\s*call\s+mapper_set_bank_p1\s*$",
        asm_text,
        flags=re.MULTILINE,
    ) is not None
    smoke_blocked = bool(far_lower_page_banks and far_trampolines_switch_p1)
    return {
        "mapper_format": "ascii16",
        "runtime_status": "compile-only" if smoke_blocked else "smoke-candidate",
        "declared_runtime_status": "compile-only" if smoke_blocked else "smoke-candidate",
        "smoke_blocked": smoke_blocked,
        "far_lower_page_bank_count": len(far_lower_page_banks),
        "resident_lower_page_bank_count": 0,
        "upper_resident_bank_count": 0,
        "lower_page_hazard_bank_count": len(far_lower_page_banks),
        "far_trampolines_switch_p1": far_trampolines_switch_p1,
        "ram_trampoline_required": False,
        "ram_trampoline_installed": False,
        "resident_estimated_window_overflow_count": 0,
        "resident_estimated_out_of_window_label_count": 0,
        "resident_estimated_out_of_window_call_count": 0,
        "far_to_far_direct_call_count": 0,
        "resident_bridge_call_count": 0,
        "actual_resident_symbols_available": False,
        "actual_resident_window_overflow_count": 0,
        "max_actual_resident_used": 0,
        "min_actual_resident_free": 0,
        "actual_resident_low_free_threshold": ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES,
        "actual_resident_low_free_bank_count": 0,
        "actual_resident_low_free_bank_usages": [],
        "actual_resident_bank_usages": [],
        "hidden_resident_call_count": 0,
        "data_window_resident_conflict": False,
        "reason": (
            "far code still switches P1/#6000, which shares #4000-#7FFF with bank-0 trampolines"
            if smoke_blocked
            else "no P1/#6000 far-code trampoline hazard detected"
        ),
    }


def validate_openmsx_mapper_smoke_contract(
    asm_path: Path,
    target_format: str,
    artifact_dir: Path | None = None,
    sym_path: Path | None = None,
) -> None:
    """Reject mapper/runtime combinations that cannot produce a meaningful smoke run yet."""
    if target_format == "ascii16":
        layout = inspect_ascii16_runtime_layout(asm_path, artifact_dir, sym_path)
        if layout["smoke_blocked"] or layout["actual_resident_window_overflow_count"]:
            raise RuntimeError(
                "OpenMSX smoke unsupported for current MegaROM mapper contract: "
                "ascii16 generated code still uses the shared lower #4000-#7FFF page "
                f"({layout['resident_lower_page_bank_count']} resident bank groups, "
                f"{layout['far_lower_page_bank_count']} far bank groups, "
                f"{layout['upper_resident_bank_count']} upper resident bank groups detected). "
                f"Estimated resident window overflows: {layout['resident_estimated_window_overflow_count']}. "
                f"Actual resident overflows: {layout['actual_resident_window_overflow_count']}. "
                "ASCII16 maps #4000-#7FFF as one shared 16 KB page, so switching P1 from a bank-0 "
                "trampoline or relying on resident #6000 code can hide the executing trampoline/header page. "
                "It also maps #8000-#BFFF as one shared 16 KB page; resident code there cannot safely share "
                "the resource data window during gameplay."
            )
        return
    if target_format != "ascii8":
        return

    asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
    far_code_uses_p1_window = re.search(r";\s*--- Far bank \d+ \[#6000, window P1\]", asm_text) is not None
    far_trampolines_switch_p1 = re.search(r"^\s*call\s+mapper_set_bank_p1\s*$", asm_text, flags=re.MULTILINE) is not None
    if not (far_code_uses_p1_window and far_trampolines_switch_p1):
        return

    raise RuntimeError(
        "OpenMSX smoke unsupported for current MegaROM mapper contract: "
        "ascii8 generated far code still executes in #6000-#7FFF as logical P1, "
        "and the far trampolines switch mapper_set_bank_p1. "
        "ASCII8 maps #6000-#7FFF through register #6800/logical P2, so this can remap "
        "resident bank-0 code or leave the executing page unchanged. "
        "Implement mapper-aware far-code windows before accepting this target in gameplay smoke."
    )


def validate_ascii16_runtime_layout_gate(layout: dict[str, Any] | None) -> None:
    """Fail when ASCII16 is still diagnostic-only instead of emulator-accepted."""
    if not layout or (not layout.get("smoke_blocked") and not layout.get("actual_resident_window_overflow_count")):
        return
    reason = str(layout.get("reason") or "ASCII16 runtime layout is compile-only")
    raise RuntimeError(
        "ASCII16 runtime layout validation failed: "
        f"residentLowerPageBanks={layout['resident_lower_page_bank_count']}, "
        f"farLowerPageBanks={layout['far_lower_page_bank_count']}, "
        f"upperResidentBanks={layout['upper_resident_bank_count']}, "
        f"lowerPageHazards={layout['lower_page_hazard_bank_count']}, "
        f"estimatedResidentWindowOverflows={layout['resident_estimated_window_overflow_count']}, "
        f"estimatedResidentOutOfWindowLabels={layout['resident_estimated_out_of_window_label_count']}, "
        f"estimatedResidentOutOfWindowCalls={layout['resident_estimated_out_of_window_call_count']}, "
        f"farToFarDirectCalls={layout['far_to_far_direct_call_count']}, "
        f"actualResidentOverflows={layout['actual_resident_window_overflow_count']}, "
        f"maxActualResidentUsed={layout['max_actual_resident_used']}, "
        f"minActualResidentFree={layout.get('min_actual_resident_free', 0)}, "
        f"lowFreeResidentBanks={layout.get('actual_resident_low_free_bank_count', 0)}, "
        f"hiddenResidentCalls={layout['hidden_resident_call_count']}, "
        f"dataWindowResidentConflict={layout['data_window_resident_conflict']}. "
        f"Reason: {reason}"
    )


def validate_ascii16_resident_free_gate(layout: dict[str, Any] | None, min_free_bytes: int) -> None:
    """Fail when assembled ASCII16 resident code fits but leaves too little headroom."""
    if min_free_bytes <= 0 or not layout or not layout.get("actual_resident_symbols_available"):
        return
    if int(layout.get("actual_resident_window_overflow_count", 0)) > 0:
        return
    low_free_banks = [
        bank for bank in layout.get("actual_resident_bank_usages", [])
        if isinstance(bank, dict) and int(bank.get("freeBytes", 0)) < min_free_bytes
    ]
    if not low_free_banks:
        return
    samples = ", ".join(
        f"bank {bank.get('bank')} free={bank.get('freeBytes')}"
        for bank in low_free_banks[:4]
    )
    raise RuntimeError(
        "ASCII16 resident free-space validation failed: "
        f"requiredFreeBytes={min_free_bytes}, lowFreeResidentBanks={len(low_free_banks)}, "
        f"{samples}"
    )


def annotate_ascii16_runtime_layout_artifact(artifact_dir: Path | None, layout: dict[str, Any] | None) -> None:
    """Persist post-assembly ASCII16 status derived from Glass symbols into segment_budget.json."""
    if not artifact_dir or not layout:
        return
    segment_budget_path = artifact_dir / "segment_budget.json"
    if not segment_budget_path.exists():
        return
    segment_budget = _require_json_object(segment_budget_path)
    runtime_layout = segment_budget.get("runtimeLayout")
    if not isinstance(runtime_layout, dict) or runtime_layout.get("mapperFormat") != "ascii16":
        return

    declared_status = str(layout.get("declared_runtime_status") or runtime_layout.get("status") or "")
    runtime_layout["preAssemblyStatus"] = declared_status
    runtime_layout["status"] = str(layout["runtime_status"])
    runtime_layout["actualResidentSymbolsAvailable"] = bool(layout["actual_resident_symbols_available"])
    runtime_layout["actualResidentWindowOverflowCount"] = int(layout["actual_resident_window_overflow_count"])
    runtime_layout["maxActualResidentUsed"] = int(layout["max_actual_resident_used"])
    runtime_layout["minActualResidentFree"] = int(layout.get("min_actual_resident_free", 0))
    runtime_layout["actualResidentLowFreeThreshold"] = int(layout.get("actual_resident_low_free_threshold", ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES))
    runtime_layout["actualResidentLowFreeBankCount"] = int(layout.get("actual_resident_low_free_bank_count", 0))
    runtime_layout["actualResidentLowFreeBankUsages"] = layout.get("actual_resident_low_free_bank_usages", [])
    runtime_layout["actualResidentBankUsages"] = layout.get("actual_resident_bank_usages", [])
    runtime_layout["postAssemblyReason"] = str(layout["reason"])
    segment_budget_path.write_text(json.dumps(segment_budget, indent=2) + "\n", encoding="utf-8")


def _sym_equ_value(sym_text: str, label: str) -> int:
    match = re.search(rf"^\s*{re.escape(label)}:\s+equ\s+([0-9A-Fa-f]+)H\s*$", sym_text, flags=re.MULTILINE)
    if not match:
        raise RuntimeError(f"Konami8K validation failed: missing symbol {label}")
    return int(match.group(1), 16)


def _validate_code_bank_used_end_symbols(segment_budget: dict, sym_path: Path) -> dict[str, int | bool]:
    if not sym_path.exists():
        raise RuntimeError(f"Konami8K validation failed: missing symbols file {sym_path}")

    sym_text = sym_path.read_text(encoding="utf-8", errors="ignore")
    bank0_end = _sym_equ_value(sym_text, "BANK_0_USED_END")
    if bank0_end < 0x4000 or bank0_end > 0x6000:
        raise RuntimeError(
            f"Konami8K validation failed: bank0 code crosses fixed #4000-#5FFF window (end=#{bank0_end:04X})"
        )

    max_used = bank0_end - 0x4000
    p3_resident_actual_used = 0
    p3_resident_estimated_used = 0
    actual_code_banks = 1
    budget_code_banks = segment_budget.get("codeBanks")
    if not isinstance(budget_code_banks, list):
        raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks must be an array")

    for budget_bank in budget_code_banks:
        if not isinstance(budget_bank, dict):
            raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks entries must be objects")
        bank_number = budget_bank.get("bank")
        org_address = budget_bank.get("orgAddress")
        end_address = budget_bank.get("endAddress")
        if not isinstance(bank_number, int) or not isinstance(org_address, int) or not isinstance(end_address, int):
            raise RuntimeError("Konami8K validation failed: code bank entries need numeric bank/orgAddress/endAddress")
        if end_address - org_address != 8192:
            raise RuntimeError("Konami8K validation failed: code bank windows must be exactly 8KB")

        used_end = _sym_equ_value(sym_text, f"BANK_{bank_number}_USED_END")
        if used_end < org_address or used_end > end_address:
            raise RuntimeError(
                "Konami8K validation failed: assembled code bank crosses its 8KB window; "
                f"bank={bank_number} org=#{org_address:04X} endSymbol=#{used_end:04X} limit=#{end_address:04X}"
            )
        if budget_bank.get("role") == "far_code":
            far_start = _sym_equ_value(sym_text, f"FAR_BANK_{bank_number}_ROM_START")
            physical_bank = (far_start - 0x4000) // 0x2000
            if far_start < 0x4000 or (far_start - 0x4000) % 0x2000 != 0 or physical_bank != bank_number:
                raise RuntimeError(
                    "Konami8K validation failed: far code bank label does not match its physical segment; "
                    f"bank={bank_number} label=#{far_start:04X} physicalBank={physical_bank}"
                )
        actual_used = used_end - org_address
        if bank_number == 3 and budget_bank.get("role") == "resident_code":
            p3_resident_actual_used = actual_used
            estimated = budget_bank.get("estimatedUsedBytes")
            p3_resident_estimated_used = estimated if isinstance(estimated, int) else 0
        max_used = max(max_used, actual_used)
        actual_code_banks += 1

    return {
        "actual_code_banks": actual_code_banks,
        "max_actual_code_used": max_used,
        "p3_resident_actual_used": p3_resident_actual_used,
        "p3_resident_estimated_used": p3_resident_estimated_used,
        "code_bank_symbols_ok": True,
    }


def _resident_p3_module_summary(segment_budget: dict) -> str:
    code_banks = segment_budget.get("codeBanks")
    if not isinstance(code_banks, list):
        return "unknown"

    for code_bank in code_banks:
        if not isinstance(code_bank, dict):
            continue
        if code_bank.get("bank") != 3 or code_bank.get("role") != "resident_code":
            continue
        modules = code_bank.get("modules")
        if not isinstance(modules, list):
            return "unknown"
        names = [
            str(module.get("key"))
            for module in modules
            if isinstance(module, dict) and module.get("key")
        ]
        return ", ".join(names) if names else "none"

    return "none"


def validate_konami8k_generated_artifacts(
    artifact_dir: Path | None,
    expected_resource_count: int | None = None,
    segment_count: int | None = None,
    asm_path: Path | None = None,
    sym_path: Path | None = None,
    strict_p3_data_window: bool = False,
    strict_vram_staging: bool = False,
    strict_tilebank_integrity: bool = False,
) -> dict[str, int | bool]:
    if artifact_dir is None:
        raise RuntimeError("Konami8K validation failed: missing generated artifact directory")

    manifest = _require_json_object(artifact_dir / "packing_manifest.json")
    manifest_v2 = _require_json_object(artifact_dir / "manifest_v2.json")
    banks = _require_json_object(artifact_dir / "banks.json")
    project_usage = _require_json_object(artifact_dir / "project_usage.json")
    load_plan = _require_json_object(artifact_dir / "load_plan.json")
    bank_optimizer = _require_json_object(artifact_dir / "bank_optimizer.json")
    tilebank_integrity = _require_json_object(artifact_dir / "tilebank_integrity.json")
    segment_budget = _require_json_object(artifact_dir / "segment_budget.json")
    unused_report = _require_text_artifact(artifact_dir / "unused_report.txt")

    expected_mapper = _expected_megarom_mapper_window("konami")
    mapper = manifest.get("mapper") if isinstance(manifest.get("mapper"), dict) else {}
    summary = manifest.get("summary") if isinstance(manifest.get("summary"), dict) else {}
    if project_usage.get("version") != 1 or project_usage.get("scope") != "konami8k_megarom_data":
        raise RuntimeError("Konami8K validation failed: project_usage.json must declare konami8k_megarom_data")
    if load_plan.get("version") != 1 or load_plan.get("scope") != "konami8k_scene_load_plan":
        raise RuntimeError("Konami8K validation failed: load_plan.json must declare konami8k_scene_load_plan")
    if bank_optimizer.get("version") != 1 or bank_optimizer.get("scope") != "konami8k_bank_optimizer":
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json must declare konami8k_bank_optimizer")
    if tilebank_integrity.get("version") != 1 or tilebank_integrity.get("scope") != "konami8k_tilebank_integrity":
        raise RuntimeError("Konami8K validation failed: tilebank_integrity.json must declare konami8k_tilebank_integrity")
    if segment_budget.get("version") != 1 or segment_budget.get("scope") != "konami8k_segment_budget":
        raise RuntimeError("Konami8K validation failed: segment_budget.json must declare konami8k_segment_budget")
    if segment_budget.get("segmentSize") != 8192:
        raise RuntimeError("Konami8K validation failed: segment_budget.json segmentSize must be 8192")
    manifest_v2_validation = validate_manifest_v2_artifact(
        manifest_v2,
        manifest,
        banks,
        expected_mapper,
        "konami",
    )

    _require_mapper_field(load_plan, "mapper.format", expected_mapper["format"])
    _require_mapper_field(load_plan, "mapper.segmentSize", 8192)
    _require_mapper_field(load_plan, "mapper.dataWindowPage", expected_mapper["data_window_page"])
    _require_mapper_field(load_plan, "mapper.windowBase", expected_mapper["window_base"])
    _require_mapper_field(load_plan, "mapper.windowMask", expected_mapper["window_mask"])
    _require_mapper_field(load_plan, "mapper.bankDivisor", expected_mapper["bank_divisor"])
    if "Scope: konami8k_megarom_resident_modules" not in unused_report:
        raise RuntimeError("Konami8K validation failed: unused_report.txt must declare resident module scope")
    usage_counts = project_usage.get("counts") if isinstance(project_usage.get("counts"), dict) else {}
    if not isinstance(usage_counts.get("bankedResources"), int):
        raise RuntimeError("Konami8K validation failed: project_usage.json must report bankedResources")
    tilebank_summary = tilebank_integrity.get("summary")
    tilebank_screens = tilebank_integrity.get("screens")
    if not isinstance(tilebank_summary, dict) or not isinstance(tilebank_screens, list):
        raise RuntimeError("Konami8K validation failed: tilebank_integrity.json must include summary and screens")
    if tilebank_summary.get("screens") != usage_counts.get("screens") or len(tilebank_screens) != usage_counts.get("screens"):
        raise RuntimeError("Konami8K validation failed: tilebank_integrity.json screen count differs from project_usage.json")
    for key in (
        "tileBanks",
        "checkedScreens",
        "issueScreens",
        "issueCells",
        "issueTiles",
        "missingAssetCells",
        "missingAssetTiles",
        "unassignedCells",
        "unassignedTiles",
    ):
        if not isinstance(tilebank_summary.get(key), int):
            raise RuntimeError("Konami8K validation failed: tilebank_integrity.json summary accounting must be numeric")
    if strict_tilebank_integrity and tilebank_summary.get("issueCells", 0):
        raise RuntimeError(
            "Konami8K validation failed: strict tilebank integrity requires zero issue cells; "
            f"issueScreens={tilebank_summary.get('issueScreens', 0)}, "
            f"issueCells={tilebank_summary.get('issueCells', 0)}, "
            f"missingAssetCells={tilebank_summary.get('missingAssetCells', 0)}, "
            f"unassignedCells={tilebank_summary.get('unassignedCells', 0)}"
        )
    for screen in tilebank_screens:
        if not isinstance(screen, dict):
            raise RuntimeError("Konami8K validation failed: tilebank_integrity.json screen entries must be objects")
        totals = screen.get("totals")
        if not isinstance(totals, dict):
            raise RuntimeError("Konami8K validation failed: tilebank_integrity.json screen totals must be an object")
        for key in (
            "checkedCells",
            "uniqueTiles",
            "issueCells",
            "issueTiles",
            "missingAssetCells",
            "missingAssetTiles",
            "unassignedCells",
            "unassignedTiles",
        ):
            if not isinstance(totals.get(key), int):
                raise RuntimeError("Konami8K validation failed: tilebank_integrity.json screen totals must be numeric")
    if mapper.get("dataWindowPage") != "p3" or mapper.get("windowBase") != "#A000":
        raise RuntimeError("Konami8K validation failed: packing_manifest.json must declare P3/#A000 data window")
    if mapper.get("windowMask") != "#1FFF" or mapper.get("bankDivisor") != "#2000":
        raise RuntimeError("Konami8K validation failed: packing_manifest.json must declare #1FFF mask and #2000 divisor")
    if mapper.get("zoneSize") != 8192:
        raise RuntimeError("Konami8K validation failed: packing_manifest.json zoneSize must be 8192")
    if summary.get("overflowCount") not in (0, None):
        raise RuntimeError("Konami8K validation failed: packing_manifest.json reports overflow resources")
    manifest_overflow = manifest.get("overflow")
    if isinstance(manifest_overflow, list) and len(manifest_overflow) > 0:
        raise RuntimeError("Konami8K validation failed: packing_manifest.json overflow list must be empty")

    banks_window = banks.get("dataWindow") if isinstance(banks.get("dataWindow"), dict) else {}
    if banks.get("segmentSize") != 8192:
        raise RuntimeError("Konami8K validation failed: banks.json segmentSize must be 8192")
    if banks_window.get("page") != "p3" or banks_window.get("base") != "#A000":
        raise RuntimeError("Konami8K validation failed: banks.json must declare P3/#A000 data window")
    if banks_window.get("mask") != "#1FFF" or banks_window.get("bankDivisor") != "#2000":
        raise RuntimeError("Konami8K validation failed: banks.json must declare #1FFF mask and #2000 divisor")
    banks_overflow = banks.get("overflow")
    if isinstance(banks_overflow, list) and len(banks_overflow) > 0:
        raise RuntimeError("Konami8K validation failed: banks.json overflow list must be empty")

    for section_name in ("codeBanks", "dataBanks"):
        budget_banks = segment_budget.get(section_name)
        if not isinstance(budget_banks, list):
            raise RuntimeError(f"Konami8K validation failed: segment_budget.json {section_name} must be an array")
        for budget_bank in budget_banks:
            if not isinstance(budget_bank, dict):
                raise RuntimeError(f"Konami8K validation failed: segment_budget.json {section_name} entries must be objects")
            if section_name == "codeBanks":
                used = budget_bank.get("estimatedUsedBytes", budget_bank.get("usedBytes"))
                free = budget_bank.get("estimatedFreeBytes", budget_bank.get("freeBytes"))
                if not isinstance(used, int) or not isinstance(free, int):
                    raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks estimated accounting must be numeric")
                if used < 0 or free < 0 or free > 8192 or free != max(0, 8192 - used):
                    raise RuntimeError(
                        "Konami8K validation failed: segment_budget.json codeBanks estimated accounting is inconsistent"
                    )
                placement_reason = budget_bank.get("placementReason")
                if not isinstance(placement_reason, str) or not placement_reason.strip():
                    raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks need placementReason")
                modules = budget_bank.get("modules")
                if not isinstance(modules, list):
                    raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks need modules")
                for module in modules:
                    if not isinstance(module, dict):
                        raise RuntimeError("Konami8K validation failed: segment_budget.json codeBank modules must be objects")
                    module_reason = module.get("placementReason")
                    if not isinstance(module_reason, str) or not module_reason.strip():
                        raise RuntimeError("Konami8K validation failed: segment_budget.json codeBank modules need placementReason")
                continue
            used = budget_bank.get("usedBytes")
            free = budget_bank.get("freeBytes")
            if not isinstance(used, int) or not isinstance(free, int):
                raise RuntimeError(f"Konami8K validation failed: segment_budget.json {section_name} accounting must be numeric")
            if used < 0 or free < 0 or used > 8192 or free > 8192 or used + free != 8192:
                raise RuntimeError(f"Konami8K validation failed: segment_budget.json {section_name} accounting must equal 8192")

    code_symbol_validation = None
    if sym_path is not None:
        code_symbol_validation = _validate_code_bank_used_end_symbols(segment_budget, sym_path)
        p3_used = code_symbol_validation["p3_resident_actual_used"]
        if strict_p3_data_window and isinstance(p3_used, int) and p3_used > 0:
            estimated = code_symbol_validation["p3_resident_estimated_used"]
            modules = _resident_p3_module_summary(segment_budget)
            raise RuntimeError(
                "Konami8K validation failed: strict P3 data-window mode requires "
                f"#A000-#BFFF to contain no resident code; actual={p3_used} bytes, "
                f"estimated={estimated} bytes, modules={modules}"
            )

    code_bank_numbers: set[int] = set()
    for code_bank in segment_budget.get("codeBanks"):
        bank_number = code_bank.get("bank")
        role = code_bank.get("role")
        page = code_bank.get("page")
        org_address = code_bank.get("orgAddress")
        end_address = code_bank.get("endAddress")
        if not isinstance(bank_number, int) or not isinstance(role, str):
            raise RuntimeError("Konami8K validation failed: segment_budget.json codeBanks need numeric bank and string role")
        code_bank_numbers.add(bank_number)
        if role == "resident_code":
            if bank_number not in (1, 2):
                raise RuntimeError("Konami8K validation failed: resident code must stay in banks 1 and 2")
            if page not in (1, 2):
                raise RuntimeError("Konami8K validation failed: resident code page must be 1 or 2")
        elif role == "far_code":
            if bank_number < 4:
                raise RuntimeError("Konami8K validation failed: far code banks must not overlap the resident kernel")
            if page != 1 or org_address != 0x6000 or end_address != 0x8000:
                raise RuntimeError("Konami8K validation failed: far code must execute through the P1/#6000 trampoline window")
        else:
            raise RuntimeError(f"Konami8K validation failed: unknown code bank role {role}")

    boss_data_bank_numbers = _validate_segment_budget_boss_data_banks(
        segment_budget,
        expected_mapper,
        8192,
        "Konami8K validation failed",
    )
    if boss_data_bank_numbers & code_bank_numbers:
        raise RuntimeError("Konami8K validation failed: segment_budget.json bossDataBanks must not overlap codeBanks")
    if segment_count is not None:
        for bank_number in boss_data_bank_numbers:
            if bank_number < 0 or bank_number >= segment_count:
                raise RuntimeError("Konami8K validation failed: segment_budget.json bossDataBanks reference a bank outside the ROM")

    manifest_banks = manifest.get("banks")
    banks_banks = banks.get("banks")
    if not isinstance(manifest_banks, list) or not isinstance(banks_banks, list):
        raise RuntimeError("Konami8K validation failed: manifest artifacts must contain banks arrays")
    if len(manifest_banks) != len(banks_banks):
        raise RuntimeError("Konami8K validation failed: packing_manifest.json and banks.json bank counts differ")
    budget_data_banks = segment_budget.get("dataBanks")
    if isinstance(budget_data_banks, list) and len(budget_data_banks) != len(manifest_banks):
        raise RuntimeError("Konami8K validation failed: segment_budget.json dataBanks count mismatch")
    zone_count = summary.get("zoneCount")
    if isinstance(zone_count, int) and zone_count != len(manifest_banks):
        raise RuntimeError("Konami8K validation failed: packing_manifest.json zoneCount mismatch")

    resource_count = 0
    large_vram_resource_count = 0
    large_vram_resource_max = 0
    large_vram_resource_labels: list[str] = []
    manifest_resource_keys: list[tuple[int, int, str, int, int]] = []
    for bank in manifest_banks:
        if not isinstance(bank, dict):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank entry must be an object")
        bank_number = bank.get("bank")
        if not isinstance(bank_number, int):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank number must be numeric")
        if bank_number < 3:
            raise RuntimeError("Konami8K validation failed: asset data banks must not overlap the resident P1/P2 kernel")
        if bank_number in code_bank_numbers:
            raise RuntimeError("Konami8K validation failed: asset data banks must not overlap code banks")
        if bank_number in boss_data_bank_numbers:
            raise RuntimeError("Konami8K validation failed: segment_budget.json bossDataBanks must not overlap dataBanks")
        if segment_count is not None and (bank_number < 0 or bank_number >= segment_count):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json references a bank outside the ROM")
        org_address = bank.get("orgAddress")
        end_address = bank.get("endAddress")
        if not isinstance(org_address, int) or not isinstance(end_address, int):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank needs numeric orgAddress and endAddress")
        if org_address != 0x4000 + (bank_number * 8192) or end_address != org_address + 8192:
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank range must match 8KB physical bank")
        used = bank.get("usedBytes")
        free = bank.get("freeBytes")
        if not isinstance(used, int) or not isinstance(free, int):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank accounting must be numeric")
        if used < 0 or free < 0 or used > 8192 or free > 8192 or used + free != 8192:
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank accounting must equal 8192")
        resources = bank.get("resources")
        if not isinstance(resources, list):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank resources must be an array")
        verification = bank.get("verification")
        if not isinstance(verification, dict):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank verification must be an object")
        bank_checksum_entries: list[tuple[int, str, list[object]]] = []
        for resource in resources:
            if not isinstance(resource, dict):
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resource must be an object")
            address = resource.get("windowAddress")
            size = resource.get("size")
            if not isinstance(address, int) or not isinstance(size, int):
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resources need numeric address and size")
            stored_size = resource.get("storedSize", size)
            uncompressed_size = resource.get("uncompressedSize", size)
            flags_value = resource.get("flags", 0)
            if not isinstance(stored_size, int) or not isinstance(uncompressed_size, int) or not isinstance(flags_value, int):
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resources need numeric storedSize, uncompressedSize and flags")
            if stored_size != size:
                raise RuntimeError("Konami8K validation failed: packing_manifest.json storedSize must match size")
            if flags_value == 0 and uncompressed_size != size:
                raise RuntimeError("Konami8K validation failed: raw packing_manifest.json resource size must match uncompressedSize")
            if flags_value & ~0x01 or ((flags_value & 0x01) and uncompressed_size < size):
                raise RuntimeError("Konami8K validation failed: invalid packing_manifest.json compression metadata")
            if size <= 0:
                raise RuntimeError(
                    "Konami8K validation failed: packing_manifest.json resource size must be greater than zero"
                )
            resource_type = str(resource.get("type") or "").upper()
            if (
                flags_value & 0x01
                and uncompressed_size > ZX0_VRAM_TRANSFER_BUFFER_SIZE
                and any(marker in resource_type for marker in VRAM_RESOURCE_TYPE_MARKERS)
            ):
                large_vram_resource_count += 1
                large_vram_resource_max = max(large_vram_resource_max, uncompressed_size)
                if len(large_vram_resource_labels) < 8:
                    label = str(resource.get("label") or "<unnamed>")
                    large_vram_resource_labels.append(f"{label}({uncompressed_size})")
            if address < 0xA000 or address > 0xBFFF or (size > 0 and address + size - 1 > 0xBFFF):
                label = resource.get("label") or "<unnamed>"
                raise RuntimeError(f"Konami8K validation failed: manifest resource crosses data window: {label}")
            resource_id = resource.get("id")
            label = resource.get("label")
            if not isinstance(resource_id, int) or not isinstance(label, str):
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resources need numeric id and string label")
            placement_reason = resource.get("placementReason")
            if not isinstance(placement_reason, str) or not placement_reason.strip():
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resources need placementReason")
            zone_offset = resource.get("zoneOffset")
            physical_address = resource.get("physicalAddress")
            if not isinstance(zone_offset, int) or not isinstance(physical_address, int):
                raise RuntimeError("Konami8K validation failed: packing_manifest.json resources need numeric zoneOffset and physicalAddress")
            if zone_offset < 0 or zone_offset >= 8192:
                raise RuntimeError("Konami8K validation failed: packing_manifest.json zoneOffset must stay inside one 8KB bank")
            if address != 0xA000 + zone_offset:
                raise RuntimeError("Konami8K validation failed: packing_manifest.json windowAddress does not match zoneOffset")
            if physical_address != 0x4000 + (bank_number * 8192) + zone_offset:
                raise RuntimeError("Konami8K validation failed: packing_manifest.json physicalAddress does not match bank and zoneOffset")
            manifest_resource_keys.append((bank_number, resource_id, label, address, size))
            bank_checksum_entries.append((
                zone_offset,
                label,
                [resource_id, label, zone_offset, size, uncompressed_size, flags_value],
            ))
            resource_count += 1
        if verification.get("algorithm") != "fnv1a32-resource-metadata":
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank verification algorithm mismatch")
        if verification.get("resourceCount") != len(resources) or verification.get("storedBytes") != used:
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank verification accounting mismatch")
        bank_checksum_parts: list[object] = [bank_number, used]
        for _offset, _label, checksum_parts in sorted(bank_checksum_entries, key=lambda entry: (entry[0], entry[1])):
            bank_checksum_parts.extend(checksum_parts)
        if verification.get("metadataChecksum") != _bank_metadata_checksum(bank_checksum_parts):
            raise RuntimeError("Konami8K validation failed: packing_manifest.json bank metadata checksum mismatch")

    expected_count = summary.get("resourceCount")
    if isinstance(expected_count, int) and expected_count != resource_count:
        raise RuntimeError("Konami8K validation failed: packing_manifest.json resourceCount mismatch")
    if expected_resource_count is not None and expected_resource_count != resource_count:
        raise RuntimeError("Konami8K validation failed: packing_manifest.json resourceCount differs from resource_table")
    if usage_counts.get("bankedResources") != resource_count:
        raise RuntimeError("Konami8K validation failed: project_usage.json bankedResources differs from resource_table")

    banks_resource_count = 0
    banks_resource_keys: list[tuple[int, int, str, int, int]] = []
    for bank in banks_banks:
        if not isinstance(bank, dict):
            raise RuntimeError("Konami8K validation failed: banks.json bank entry must be an object")
        bank_number = bank.get("bank")
        if not isinstance(bank_number, int):
            raise RuntimeError("Konami8K validation failed: banks.json bank number must be numeric")
        if segment_count is not None and (bank_number < 0 or bank_number >= segment_count):
            raise RuntimeError("Konami8K validation failed: banks.json references a bank outside the ROM")
        origin = bank.get("origin")
        end = bank.get("end")
        if not isinstance(origin, int) or not isinstance(end, int):
            raise RuntimeError("Konami8K validation failed: banks.json bank needs numeric origin and end")
        if origin != 0x4000 + (bank_number * 8192) or end != origin + 8192:
            raise RuntimeError("Konami8K validation failed: banks.json bank range must match 8KB physical bank")
        used = bank.get("usedBytes")
        free = bank.get("freeBytes")
        if not isinstance(used, int) or not isinstance(free, int):
            raise RuntimeError("Konami8K validation failed: banks.json bank accounting must be numeric")
        if used < 0 or free < 0 or used > 8192 or free > 8192 or used + free != 8192:
            raise RuntimeError("Konami8K validation failed: banks.json bank accounting must equal 8192")
        resources = bank.get("resources")
        if not isinstance(resources, list):
            raise RuntimeError("Konami8K validation failed: banks.json bank resources must be an array")
        verification = bank.get("verification")
        if not isinstance(verification, dict):
            raise RuntimeError("Konami8K validation failed: banks.json bank verification must be an object")
        bank_checksum_entries: list[tuple[int, str, list[object]]] = []
        for resource in resources:
            if not isinstance(resource, dict):
                raise RuntimeError("Konami8K validation failed: banks.json resource must be an object")
            address = resource.get("address")
            size = resource.get("size")
            if not isinstance(address, int) or not isinstance(size, int):
                raise RuntimeError("Konami8K validation failed: banks.json resources need numeric address and size")
            stored_size = resource.get("storedSize", size)
            uncompressed_size = resource.get("uncompressedSize", size)
            flags_value = resource.get("flags", 0)
            if not isinstance(stored_size, int) or not isinstance(uncompressed_size, int) or not isinstance(flags_value, int):
                raise RuntimeError("Konami8K validation failed: banks.json resources need numeric storedSize, uncompressedSize and flags")
            if stored_size != size:
                raise RuntimeError("Konami8K validation failed: banks.json storedSize must match size")
            if flags_value == 0 and uncompressed_size != size:
                raise RuntimeError("Konami8K validation failed: raw banks.json resource size must match uncompressedSize")
            if flags_value & ~0x01 or ((flags_value & 0x01) and uncompressed_size < size):
                raise RuntimeError("Konami8K validation failed: invalid banks.json compression metadata")
            if size <= 0:
                raise RuntimeError(
                    "Konami8K validation failed: banks.json resource size must be greater than zero"
                )
            if address < 0xA000 or address > 0xBFFF or (size > 0 and address + size - 1 > 0xBFFF):
                label = resource.get("label") or "<unnamed>"
                raise RuntimeError(f"Konami8K validation failed: banks.json resource crosses data window: {label}")
            resource_id = resource.get("id")
            label = resource.get("label")
            if not isinstance(resource_id, int) or not isinstance(label, str):
                raise RuntimeError("Konami8K validation failed: banks.json resources need numeric id and string label")
            offset = resource.get("offset")
            if not isinstance(offset, int):
                raise RuntimeError("Konami8K validation failed: banks.json resources need numeric offset")
            if offset < 0 or offset >= 8192:
                raise RuntimeError("Konami8K validation failed: banks.json offset must stay inside one 8KB bank")
            if address != 0xA000 + offset:
                raise RuntimeError("Konami8K validation failed: banks.json address does not match offset")
            banks_resource_keys.append((bank_number, resource_id, label, address, size))
            bank_checksum_entries.append((
                offset,
                label,
                [resource_id, label, offset, size, uncompressed_size, flags_value],
            ))
            banks_resource_count += 1
        if verification.get("algorithm") != "fnv1a32-resource-metadata":
            raise RuntimeError("Konami8K validation failed: banks.json bank verification algorithm mismatch")
        if verification.get("resourceCount") != len(resources) or verification.get("storedBytes") != used:
            raise RuntimeError("Konami8K validation failed: banks.json bank verification accounting mismatch")
        bank_checksum_parts: list[object] = [bank_number, used]
        for _offset, _label, checksum_parts in sorted(bank_checksum_entries, key=lambda entry: (entry[0], entry[1])):
            bank_checksum_parts.extend(checksum_parts)
        if verification.get("metadataChecksum") != _bank_metadata_checksum(bank_checksum_parts):
            raise RuntimeError("Konami8K validation failed: banks.json bank metadata checksum mismatch")

    if banks_resource_count != resource_count:
        raise RuntimeError("Konami8K validation failed: packing_manifest.json and banks.json resource counts differ")
    if sorted(manifest_resource_keys) != sorted(banks_resource_keys):
        raise RuntimeError("Konami8K validation failed: packing_manifest.json and banks.json resource entries differ")
    resource_ids = sorted(resource[1] for resource in manifest_resource_keys)
    if resource_ids != list(range(resource_count)):
        raise RuntimeError("Konami8K validation failed: resource ids must be contiguous from 0")

    usage_resources = project_usage.get("bankedResources")
    if not isinstance(usage_resources, list):
        raise RuntimeError("Konami8K validation failed: project_usage.json bankedResources must be an array")
    usage_resource_keys: list[tuple[int, int, str, int, int]] = []
    for usage_resource in usage_resources:
        if not isinstance(usage_resource, dict):
            raise RuntimeError("Konami8K validation failed: project_usage.json bankedResources entries must be objects")
        resource_id = usage_resource.get("id")
        label = usage_resource.get("label")
        bank = usage_resource.get("bank")
        address = usage_resource.get("windowAddress")
        size = usage_resource.get("size")
        if not isinstance(resource_id, int) or not isinstance(label, str):
            raise RuntimeError("Konami8K validation failed: project_usage.json resources need numeric id and string label")
        if not isinstance(bank, int) or not isinstance(address, int) or not isinstance(size, int):
            raise RuntimeError("Konami8K validation failed: project_usage.json resources need numeric bank, address and size")
        stored_size = usage_resource.get("storedSize", size)
        uncompressed_size = usage_resource.get("uncompressedSize", size)
        flags_value = usage_resource.get("flags", 0)
        if not isinstance(stored_size, int) or not isinstance(uncompressed_size, int) or not isinstance(flags_value, int):
            raise RuntimeError("Konami8K validation failed: project_usage.json resources need numeric storedSize, uncompressedSize and flags")
        if stored_size != size or (flags_value == 0 and uncompressed_size != size) or flags_value & ~0x01:
            raise RuntimeError("Konami8K validation failed: invalid project_usage.json compression metadata")
        usage_resource_keys.append((bank, resource_id, label, address, size))
    if sorted(usage_resource_keys) != sorted(banks_resource_keys):
        raise RuntimeError("Konami8K validation failed: project_usage.json bankedResources differ from banks.json")

    project_scenes = project_usage.get("scenes")
    load_scenes = load_plan.get("scenes")
    if not isinstance(project_scenes, list):
        raise RuntimeError("Konami8K validation failed: project_usage.json scenes must be an array")
    if not isinstance(load_scenes, list):
        raise RuntimeError("Konami8K validation failed: load_plan.json scenes must be an array")
    if len(project_scenes) != len(load_scenes):
        raise RuntimeError("Konami8K validation failed: load_plan.json scene count differs from project_usage.json")

    resource_key_by_id = {key[1]: key for key in banks_resource_keys}
    for project_scene, load_scene in zip(project_scenes, load_scenes):
        if not isinstance(project_scene, dict) or not isinstance(load_scene, dict):
            raise RuntimeError("Konami8K validation failed: scene entries must be objects")
        if (
            project_scene.get("index") != load_scene.get("index")
            or project_scene.get("id") != load_scene.get("id")
            or project_scene.get("name") != load_scene.get("name")
        ):
            raise RuntimeError("Konami8K validation failed: load_plan.json scenes differ from project_usage.json")

        project_resource_ids = project_scene.get("resourceIds")
        if not isinstance(project_resource_ids, list) or not all(isinstance(resource_id, int) for resource_id in project_resource_ids):
            raise RuntimeError("Konami8K validation failed: project_usage.json scene resourceIds must be numeric")
        load_banks = load_scene.get("banks")
        if not isinstance(load_banks, list):
            raise RuntimeError("Konami8K validation failed: load_plan.json scene banks must be an array")
        load_resource_ids: list[int] = []
        load_stored_bytes = 0
        load_raw_bytes = 0
        for load_bank in load_banks:
            if not isinstance(load_bank, dict):
                raise RuntimeError("Konami8K validation failed: load_plan.json bank entries must be objects")
            bank_number = load_bank.get("bank")
            resource_ids = load_bank.get("resourceIds")
            stored_bytes = load_bank.get("storedBytes")
            raw_bytes = load_bank.get("rawBytes")
            if not isinstance(bank_number, int) or not isinstance(resource_ids, list):
                raise RuntimeError("Konami8K validation failed: load_plan.json bank needs numeric bank and resourceIds")
            if not isinstance(stored_bytes, int) or not isinstance(raw_bytes, int):
                raise RuntimeError("Konami8K validation failed: load_plan.json bank accounting must be numeric")
            for resource_id in resource_ids:
                if not isinstance(resource_id, int) or resource_id not in resource_key_by_id:
                    raise RuntimeError("Konami8K validation failed: load_plan.json references an unknown resource id")
                resource_bank, _, _, _, _ = resource_key_by_id[resource_id]
                if resource_bank != bank_number:
                    raise RuntimeError("Konami8K validation failed: load_plan.json resource bank mismatch")
                load_resource_ids.append(resource_id)
            load_stored_bytes += stored_bytes
            load_raw_bytes += raw_bytes
        if sorted(project_resource_ids) != sorted(load_resource_ids):
            raise RuntimeError("Konami8K validation failed: load_plan.json resourceIds differ from project_usage.json scene")
        if load_scene.get("resourceCount") != len(load_resource_ids):
            raise RuntimeError("Konami8K validation failed: load_plan.json resourceCount mismatch")
        if load_scene.get("totalStoredBytes") != load_stored_bytes or load_scene.get("totalRawBytes") != load_raw_bytes:
            raise RuntimeError("Konami8K validation failed: load_plan.json scene byte accounting mismatch")

    optimizer_placement = bank_optimizer.get("currentPlacement")
    if not isinstance(optimizer_placement, dict):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json currentPlacement must be an object")
    if optimizer_placement.get("resourceCount") != resource_count:
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json resourceCount mismatch")
    if optimizer_placement.get("bankCount") != len(manifest_banks):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json bankCount mismatch")
    if optimizer_placement.get("totalStoredBytes") != sum(key[4] for key in banks_resource_keys):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json stored byte accounting mismatch")
    proposed_placement = bank_optimizer.get("proposedPlacement")
    if not isinstance(proposed_placement, dict):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposedPlacement must be an object")
    if proposed_placement.get("resourceCount") != resource_count:
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed resourceCount mismatch")
    if proposed_placement.get("totalStoredBytes") != sum(key[4] for key in banks_resource_keys):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed stored byte accounting mismatch")
    proposed_banks = proposed_placement.get("banks")
    if not isinstance(proposed_banks, list):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed banks must be an array")
    if proposed_placement.get("bankCount") != len(proposed_banks):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed bankCount mismatch")
    proposed_resource_ids: list[int] = []
    for proposed_bank in proposed_banks:
        if not isinstance(proposed_bank, dict):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed bank entries must be objects")
        bank_number = proposed_bank.get("bank")
        used_bytes = proposed_bank.get("usedBytes")
        free_bytes = proposed_bank.get("freeBytes")
        resource_ids = proposed_bank.get("resourceIds")
        if not isinstance(bank_number, int) or not isinstance(used_bytes, int) or not isinstance(free_bytes, int):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed bank accounting must be numeric")
        if used_bytes < 0 or free_bytes < 0 or used_bytes > 8192 or free_bytes > 8192 or used_bytes + free_bytes != 8192:
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed bank accounting must equal 8192")
        if not isinstance(resource_ids, list) or not all(isinstance(resource_id, int) for resource_id in resource_ids):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed resourceIds must be numeric")
        for resource_id in resource_ids:
            if resource_id not in resource_key_by_id:
                raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed placement references unknown resource")
            proposed_resource_ids.append(resource_id)
    if sorted(proposed_resource_ids) != sorted(resource_key_by_id):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed placement must include every resource once")
    proposed_scene_plan = proposed_placement.get("sceneBankPlan")
    if not isinstance(proposed_scene_plan, list) or len(proposed_scene_plan) != len(project_scenes):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json proposed sceneBankPlan mismatch")
    optimizer_clusters = bank_optimizer.get("sceneClusters")
    if not isinstance(optimizer_clusters, list):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json sceneClusters must be an array")
    if len(optimizer_clusters) != len(project_scenes):
        raise RuntimeError("Konami8K validation failed: bank_optimizer.json scene count differs from project_usage.json")
    for project_scene, optimizer_scene in zip(project_scenes, optimizer_clusters):
        if not isinstance(optimizer_scene, dict):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json scene cluster entries must be objects")
        if (
            project_scene.get("index") != optimizer_scene.get("index")
            or project_scene.get("id") != optimizer_scene.get("id")
            or project_scene.get("name") != optimizer_scene.get("name")
        ):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json scene clusters differ from project_usage.json")
        optimizer_resource_ids = optimizer_scene.get("resourceIds")
        if not isinstance(optimizer_resource_ids, list) or sorted(optimizer_resource_ids) != sorted(project_scene.get("resourceIds", [])):
            raise RuntimeError("Konami8K validation failed: bank_optimizer.json scene resourceIds differ from project_usage.json")

    if asm_path is not None:
        asm_text = asm_path.read_text(encoding="utf-8", errors="ignore")
        direct_refs = _find_direct_banked_resource_references(
            asm_text,
            [key[2] for key in manifest_resource_keys],
        )
        if direct_refs:
            preview = "; ".join(direct_refs[:8])
            raise RuntimeError(
                "Konami8K validation failed: active code must access banked resource labels through "
                f"RESOURCE_ID/resource_table, not direct symbol references: {preview}"
            )

    budget_data_by_bank = {
        budget_bank.get("bank"): budget_bank
        for budget_bank in budget_data_banks
        if isinstance(budget_bank, dict)
    }
    for bank in banks_banks:
        bank_number = bank.get("bank")
        budget_bank = budget_data_by_bank.get(bank_number)
        if not isinstance(budget_bank, dict):
            raise RuntimeError("Konami8K validation failed: segment_budget.json dataBanks missing bank")
        if (
            budget_bank.get("usedBytes") != bank.get("usedBytes")
            or budget_bank.get("freeBytes") != bank.get("freeBytes")
            or budget_bank.get("resources") != len(bank.get("resources", []))
            or budget_bank.get("orgAddress") != bank.get("origin")
            or budget_bank.get("endAddress") != bank.get("end")
        ):
            raise RuntimeError("Konami8K validation failed: segment_budget.json dataBanks differ from banks.json")

    if strict_vram_staging and large_vram_resource_count:
        preview = ", ".join(large_vram_resource_labels)
        raise RuntimeError(
            "Konami8K validation failed: compressed VRAM resources must fit the "
            f"{ZX0_VRAM_TRANSFER_BUFFER_SIZE}-byte RAM staging buffer; "
            f"largeVramResources={large_vram_resource_count}, maxRaw={large_vram_resource_max}, found {preview}"
        )

    return {
        "artifact_ok": True,
        "manifest_resource_count": resource_count,
        "manifest_bank_count": len(manifest_banks),
        "boss_data_bank_count": len(boss_data_bank_numbers),
        "manifest_v2_build_id": str(manifest_v2_validation["manifest_v2_build_id"]),
        "actual_code_banks": code_symbol_validation["actual_code_banks"] if code_symbol_validation else 0,
        "max_actual_code_used": code_symbol_validation["max_actual_code_used"] if code_symbol_validation else 0,
        "p3_resident_actual_used": code_symbol_validation["p3_resident_actual_used"] if code_symbol_validation else 0,
        "p3_resident_estimated_used": code_symbol_validation["p3_resident_estimated_used"] if code_symbol_validation else 0,
        "code_bank_symbols_ok": bool(code_symbol_validation),
        "large_vram_resource_count": large_vram_resource_count,
        "large_vram_resource_max": large_vram_resource_max,
        "tilebank_issue_screens": tilebank_summary.get("issueScreens", 0),
        "tilebank_issue_cells": tilebank_summary.get("issueCells", 0),
        "tilebank_missing_asset_cells": tilebank_summary.get("missingAssetCells", 0),
        "tilebank_unassigned_cells": tilebank_summary.get("unassignedCells", 0),
    }


def compile_generator(project_root: Path, ts_build_dir: Path, allow_tsc_errors: bool) -> Path:
    generator_ts = project_root / "utils" / "msxGenerator" / "index.ts"
    if not generator_ts.exists():
        raise FileNotFoundError(f"Missing generator source: {generator_ts}")

    ts_build_dir.mkdir(parents=True, exist_ok=True)
    npx_exec = shutil.which("npx.cmd") or shutil.which("npx") or "npx"
    tsc_cmd = [
        npx_exec,
        "tsc",
        "--pretty",
        "false",
        "--module",
        "commonjs",
        "--target",
        "ES2020",
        "--outDir",
        str(ts_build_dir),
        "--moduleResolution",
        "node",
        "--skipLibCheck",
        "--noEmitOnError",
        "false",
        str(generator_ts.relative_to(project_root)),
    ]
    result = run_command(tsc_cmd, cwd=project_root, allow_failure=True)
    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"

    if result.returncode != 0 and not allow_tsc_errors:
        raise RuntimeError("TypeScript compilation failed. Pass --allow-tsc-errors to emit anyway.")
    if not compiled_index.exists():
        raise RuntimeError("TypeScript compilation did not produce utils/msxGenerator/index.js")

    (ts_build_dir / "package.json").write_text('{"type":"commonjs"}', encoding="utf-8")
    return compiled_index


def generate_asm_from_json(
    compiled_index: Path,
    json_path: Path,
    asm_output: Path,
    project_name_override: str | None,
    project_root: Path,
    rom_mode: str,
    target_format: str,
    execution_mode: str,
    auto_megarom: bool,
    enable_hard_player_tick: bool,
) -> tuple[str, int]:
    with json_path.open("r", encoding="utf-8") as fh:
        project = json.load(fh)

    project_name = project_name_override or project.get("name") or json_path.stem

    node_script = """
const fs = require("fs");
const os = require("os");
const path = require("path");
const generator = require(process.argv[2]);
const jsonPath = process.argv[3];
const asmPath = process.argv[4];
const forcedName = process.argv[5];
const romMode = process.argv[6];
const targetFormat = process.argv[7];
const executionMode = process.argv[8];
const autoMegaROM = process.argv[9] === "true";
const enableHardPlayerTick = process.argv[10] === "true";
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const name = forcedName || raw.name || "mideas_project";
const assets = Array.isArray(raw.assets) ? [...raw.assets] : [];
const knownAssetIds = new Set(assets.map(a => a && a.id).filter(Boolean));
const hasFontAsset = assets.some(a => a && a.type === "font");

if (!hasFontAsset && raw.msxFont && typeof raw.msxFont === "object") {
  assets.push({
    id: "__project_font__",
    name: "Project Font",
    type: "font",
    data: {
      fontData: raw.msxFont,
      // Project-level msxFontColorAttributes in saved JSON are editor/global state,
      // not always the per-row runtime format expected by the ASM generator.
      // Inject only font patterns here; runtime color falls back to the generator default.
      fontColorAttributes: {},
    },
  });
  knownAssetIds.add("__project_font__");
}

if (Array.isArray(raw.componentDefinitions)) {
  for (const comp of raw.componentDefinitions) {
    if (!comp || !comp.id || knownAssetIds.has(comp.id)) continue;
    assets.push({
      id: comp.id,
      name: comp.name || comp.id,
      type: "componentdefinition",
      data: comp,
    });
    knownAssetIds.add(comp.id);
  }
}

if (Array.isArray(raw.entityTemplates)) {
  for (const tpl of raw.entityTemplates) {
    if (!tpl || !tpl.id || knownAssetIds.has(tpl.id)) continue;
    assets.push({
      id: tpl.id,
      name: tpl.name || tpl.id,
      type: "entitytemplate",
      data: tpl,
    });
    knownAssetIds.add(tpl.id);
  }
}

if (raw.presentationScreen && raw.presentationScreen.data && Array.isArray(raw.presentationScreen.data.nameTable) && raw.presentationScreen.data.nameTable.length === 768) {
  assets.push({
    id: "system_presentation_screen",
    name: raw.presentationScreen.name || "Presentation Screen",
    type: "presentationscreen",
    data: raw.presentationScreen,
  });
}

const hasMsx2Presentation = assets.some(asset => asset && asset.type === "msx2presentation");
const msx2GameFlows = assets.filter(asset => asset && asset.type === "msx2gameflow");
const currentMsx2GameFlow = msx2GameFlows.find(asset => asset.name === "Main MSX2") || msx2GameFlows[0];
const currentMsx2GameFlowPurpose = currentMsx2GameFlow && currentMsx2GameFlow.data ? currentMsx2GameFlow.data.purpose : undefined;
const requestedScreenMode = raw.screenMode || raw.currentScreenMode || "SCREEN 2 (Graphics I)";
const exportScreenMode = currentMsx2GameFlowPurpose === "screen4-runtime"
  ? "SCREEN 4 (Graphics II)"
  : (hasMsx2Presentation ? "SCREEN 5 (Graphics III)" : requestedScreenMode);
const defaultGraphicsBackend = currentMsx2GameFlowPurpose === "screen4-runtime"
  ? "msx2-screen4-pattern"
  : currentMsx2GameFlowPurpose === "screen5-presentation" && hasMsx2Presentation
  ? "msx2-screen5-presentation"
  : hasMsx2Presentation
  ? "msx2-screen5-presentation"
  : (["SCREEN 4 (Graphics II)", "SCREEN 5 (Graphics III)"].includes(exportScreenMode) ? "msx2-screen4-pattern" : "screen2-tilebank");

const files = generator.generateModularASM(name, assets, {
  generateUnified: true,
  romMode,
  targetFormat,
  executionMode,
  autoMegaROM,
  screenMode: exportScreenMode,
  targetGraphicsBackend: currentMsx2GameFlowPurpose ? defaultGraphicsBackend : (raw.targetGraphicsBackend || defaultGraphicsBackend),
  interruptConfig: {
    ...(raw.interruptConfig || {}),
    enableHardPlayerTick: enableHardPlayerTick || Boolean(raw.interruptConfig && raw.interruptConfig.enableHardPlayerTick),
  },
});
const asm = files["unitedFiles.asm"] || files["main.asm"];
if (!asm) {
  throw new Error("Generator did not return unitedFiles.asm or main.asm");
}
function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}
function writeTextFileWithRetry(filePath, content) {
  const payload = Buffer.from(content, "utf8");
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      fs.writeFileSync(filePath, payload);
      return;
    } catch (error) {
      lastError = error;
      if (!["EBUSY", "EPERM", "EACCES", "UNKNOWN"].includes(error && error.code) || attempt === 5) {
        break;
      }
      sleepMs(75 * attempt);
    }
  }
  try {
    if (fs.existsSync(filePath)) {
      const stalePath = `${filePath}.stale_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      fs.renameSync(filePath, stalePath);
      fs.writeFileSync(filePath, payload);
      try { fs.unlinkSync(stalePath); } catch (_) {}
      return;
    }
  } catch (renameError) {
    lastError = renameError;
  }
  const deferredPath = path.join(os.tmpdir(), `mideas_deferred_asm_${Date.now()}_${Math.random().toString(16).slice(2)}.asm`);
  fs.writeFileSync(deferredPath, payload);
  console.log(`ASM_DEFERRED_PATH:${deferredPath}`);
  console.warn(`ASM direct write failed for ${filePath}; deferred write saved to ${deferredPath}: ${lastError && lastError.message}`);
}
writeTextFileWithRetry(asmPath, asm);
console.log(`ASM generated: ${asmPath}`);
console.log(`Project: ${name}`);
console.log(`Assets: ${assets.length}`);
console.log(`ASM chars: ${asm.length}`);
console.log(`ROM config: mode=${romMode}, mapper=${targetFormat}, engine=${executionMode}, autoMegaROM=${autoMegaROM}`);
"""

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".cjs",
        delete=False,
        encoding="utf-8",
    ) as tmp_file:
        tmp_file.write(node_script)
        tmp_script_path = Path(tmp_file.name)

    try:
        completed = run_command(
            [
                "node",
                str(tmp_script_path),
                str(compiled_index),
                str(json_path),
                str(asm_output),
                project_name,
                rom_mode,
                target_format,
                execution_mode,
                "true" if auto_megarom else "false",
                "true" if enable_hard_player_tick else "false",
            ],
            cwd=project_root,
        )
        stdout_text = completed.stdout.decode("utf-8", errors="replace") if completed.stdout else ""
        deferred_match = re.search(r"ASM_DEFERRED_PATH:(.+)", stdout_text)
        if deferred_match:
            deferred_path = Path(deferred_match.group(1).strip())
            if not deferred_path.exists():
                raise RuntimeError(f"Deferred ASM write reported missing file: {deferred_path}")
            ensure_parent(asm_output)
            try:
                shutil.copyfile(deferred_path, asm_output)
            except OSError:
                if asm_output.exists():
                    stale_path = asm_output.with_name(f"{asm_output.name}.stale_{int(time.time() * 1000)}")
                    asm_output.replace(stale_path)
                    shutil.copyfile(deferred_path, asm_output)
                    try:
                        stale_path.unlink()
                    except OSError:
                        pass
                else:
                    raise
            try:
                deferred_path.unlink()
            except OSError:
                pass
            print(f"ASM deferred write copied to: {asm_output}")
    finally:
        try:
            tmp_script_path.unlink(missing_ok=True)
        except Exception:
            pass

    asm_chars = len(asm_output.read_text(encoding="utf-8", errors="ignore"))
    return project_name, asm_chars


def compile_with_glass(
    glass_jar: Path,
    asm_output: Path,
    rom_output: Path,
    sym_output: Path | None,
    project_root: Path,
) -> None:
    rotated_outputs: list[Path] = []
    for output_path in [rom_output, sym_output]:
        if output_path and output_path.exists():
            stale_path = output_path.with_name(f"{output_path.name}.stale_{int(time.time() * 1000)}")
            try:
                output_path.replace(stale_path)
                rotated_outputs.append(stale_path)
            except OSError:
                pass
    cmd = ["java", "-jar", str(glass_jar)]
    server_include = project_root / "server"
    if server_include.exists():
        cmd.extend(["-I", str(server_include)])
    cmd.extend([str(asm_output), str(rom_output)])
    if sym_output:
        cmd.append(str(sym_output))
    completed = run_command(cmd, cwd=project_root, allow_failure=True)
    if completed.returncode == 0:
        for stale_path in rotated_outputs:
            try:
                stale_path.unlink()
            except OSError:
                pass
        return
    stdout_text = completed.stdout.decode("utf-8", errors="replace") if completed.stdout else ""
    stderr_text = completed.stderr.decode("utf-8", errors="replace") if completed.stderr else ""
    diagnostic = describe_glass_compile_failure(stdout_text, stderr_text, asm_output)
    if diagnostic:
        raise RuntimeError(diagnostic)
    raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(cmd)}")


def describe_glass_compile_failure(stdout_text: str, stderr_text: str, asm_output: Path | None = None) -> str | None:
    combined = f"{stdout_text}\n{stderr_text}"
    negative_match = re.search(r"Negative initial size:\s*(-?\d+)", combined, flags=re.IGNORECASE)
    if not negative_match:
        return None

    asm_text = ""
    if asm_output and asm_output.exists():
        try:
            asm_text = asm_output.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            asm_text = ""

    if "MSX2 SCREEN 4 cold data bank" in asm_text and re.search(r"ds\s+#C000\s*-\s*\$", asm_text, flags=re.IGNORECASE):
        return (
            "MSX2 MegaROM resident bank overflow before ROM output: "
            f"Glass reported a negative #C000 padding ({negative_match.group(1)} bytes). "
            "The fixed/resident SCREEN 4 code and hot runtime tables crossed #C000 before the cold data bank. "
            "Move cold read-only tables to a world/data bank, remove unused resident fallback data, "
            "or replace repeated resident tables with VRAM fill/streaming before compiling again."
        )

    return (
        "MegaROM bank padding overflow before ROM output: "
        f"Glass reported a negative DS padding ({negative_match.group(1)} bytes). "
        "A generated bank crossed its mapper window limit; split the bank payload or move cold data to another bank."
    )


def maybe_run_zx0_preprocess(
    project_root: Path,
    asm_output: Path,
    enabled: bool,
) -> tuple[Path, dict | None]:
    if not enabled:
        return asm_output, None

    server_js = project_root / "server" / "server.js"
    if not server_js.exists():
        raise FileNotFoundError(f"ZX0 preprocess entrypoint not found: {server_js}")

    compressed_output = asm_output.with_name(f"{asm_output.stem}_compressed.asm")
    temp_dir = (project_root / "server" / "temp").resolve()
    temp_dir.mkdir(parents=True, exist_ok=True)

    node_script = r"""
const fs = require("fs");
const path = require("path");
const { injectZx0IntoUnifiedAsm } = require(process.argv[2]);

async function main() {
  const inputPath = process.argv[3];
  const outputPath = process.argv[4];
  const tempDir = process.argv[5];
  const source = fs.readFileSync(inputPath, "utf8");
  const result = await injectZx0IntoUnifiedAsm(source, tempDir);
  fs.writeFileSync(outputPath, result.code, "utf8");
  process.stdout.write(JSON.stringify({
    outputPath,
    info: result.info || null
  }));
}

main().catch((error) => {
  const message = error && error.stack ? error.stack : String(error);
  process.stderr.write(message + "\n");
  process.exit(1);
});
"""

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".cjs",
        delete=False,
        encoding="utf-8",
    ) as tmp_file:
        tmp_file.write(node_script)
        tmp_script_path = Path(tmp_file.name)

    try:
        completed = run_command(
            [
                "node",
                str(tmp_script_path),
                str(server_js),
                str(asm_output),
                str(compressed_output),
                str(temp_dir),
            ],
            cwd=project_root,
        )
    finally:
        try:
            tmp_script_path.unlink(missing_ok=True)
        except Exception:
            pass

    stdout_text = completed.stdout.decode("utf-8", errors="replace").strip()
    info = None
    if stdout_text:
        try:
            payload = json.loads(stdout_text.splitlines()[-1])
            info = payload.get("info")
            output_path = payload.get("outputPath")
            if output_path:
                compressed_output = Path(output_path).resolve()
        except json.JSONDecodeError:
            pass

    return compressed_output, info


def ensure_sprite_copy_helper(asm_output: Path) -> None:
    asm_code = asm_output.read_text(encoding="utf-8", errors="ignore")
    if "COPY_SPRITE_SRC_TO_VRAM" not in asm_code:
        return
    if re.search(r"^\s*COPY_SPRITE_SRC_TO_VRAM:\s*$", asm_code, re.MULTILINE):
        return

    helper = """
; ==================================================================
; COPY_SPRITE_SRC_TO_VRAM stub (CLI builder fallback)
; Input: HL=source (ROM), DE=VRAM destination, BC=byte count
; ==================================================================
COPY_SPRITE_SRC_TO_VRAM:
    jp FAST_LDIRVM
"""

    plain48_pad_pattern = r"^\s*ds\s+#C000\s*-\s*\$\s*(?:;.*)?$"
    has_linear48_layout = re.search(
        r"^\s*;\s*Linear48K Page0 Data:\s*(Yes|No)\b",
        asm_code,
        re.IGNORECASE | re.MULTILINE,
    )

    if has_linear48_layout and re.search(plain48_pad_pattern, asm_code, re.IGNORECASE | re.MULTILINE):
        pad_match = re.search(plain48_pad_pattern, asm_code, re.IGNORECASE | re.MULTILINE)
        pad_line = pad_match.group(0) if pad_match else None
        asm_code = re.sub(
            plain48_pad_pattern,
            "",
            asm_code,
            count=1,
            flags=re.IGNORECASE | re.MULTILINE,
        ).rstrip()

        if pad_line and re.search(r"^\s*end\b.*$", asm_code, re.IGNORECASE | re.MULTILINE):
            asm_code = re.sub(
                r"^\s*end\b.*$",
                f"{helper}\n\n{pad_line}\n\nend",
                asm_code,
                count=1,
                flags=re.IGNORECASE | re.MULTILINE,
            )
        elif pad_line:
            asm_code = f"{asm_code}\n\n{helper}\n\n{pad_line}\n"
    elif re.search(r"^\s*end\b.*$", asm_code, re.IGNORECASE | re.MULTILINE):
        asm_code = re.sub(
            r"^\s*end\b.*$",
            f"{helper}\n\nend",
            asm_code,
            count=1,
            flags=re.IGNORECASE | re.MULTILINE,
        )
    else:
        asm_code = f"{asm_code.rstrip()}\n\n{helper}\n"

    asm_output.write_text(asm_code, encoding="utf-8")
    print("Injected COPY_SPRITE_SRC_TO_VRAM fallback stub into ASM output.")


def post_asm_report_json_path(asm_path: Path) -> Path:
    return asm_path.with_suffix(".post-asm-report.json")


def load_post_asm_report(report_path: Path) -> dict[str, Any]:
    if not report_path.exists():
        raise RuntimeError(f"Post-ASM validation failed: missing report {report_path}")
    try:
        report = json.loads(report_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Post-ASM validation failed: invalid JSON report {report_path}: {exc}") from exc
    if not isinstance(report, dict):
        raise RuntimeError(f"Post-ASM validation failed: report must be a JSON object: {report_path}")
    return report


def _post_asm_int(value: Any) -> int:
    return value if isinstance(value, int) else 0


def format_post_asm_report_summary(report_path: Path, report: dict[str, Any]) -> list[str]:
    metrics = report.get("metrics")
    if not isinstance(metrics, dict):
        return [f"Post-ASM report: {report_path} (metrics unavailable)"]

    block_inventory = metrics.get("block_inventory")
    if not isinstance(block_inventory, dict):
        block_inventory = {}
    optimization_summary = metrics.get("optimization_summary")
    if not isinstance(optimization_summary, dict):
        optimization_summary = {}
    optimization_passes = metrics.get("optimization_passes")
    if not isinstance(optimization_passes, list):
        optimization_passes = []
    selected_rules = metrics.get("selected_rules")
    if not isinstance(selected_rules, list):
        selected_rules = []

    lines = [
        (
            "Post-ASM report: "
            f"findings={_post_asm_int(report.get('findings') if isinstance(report.get('findings'), int) else len(report.get('findings', [])) if isinstance(report.get('findings'), list) else 0)}, "
            f"applied={_post_asm_int(report.get('applied_patches'))}, "
            f"deadBlocks={_post_asm_int(block_inventory.get('dead_block_candidates'))} "
            f"({_post_asm_int(block_inventory.get('dead_candidate_lines'))} lines / "
            f"{_post_asm_int(block_inventory.get('dead_candidate_source_bytes'))} bytes), "
            f"report={report_path}"
        )
    ]
    if selected_rules:
        lines.append(f"Post-ASM rules: {', '.join(str(rule) for rule in selected_rules)}")
    passes_run = _post_asm_int(optimization_summary.get("passes_run"))
    if passes_run:
        lines.append(
            "Post-ASM savings: "
            f"passes={passes_run}, "
            f"removed={_post_asm_int(optimization_summary.get('removed_lines'))} lines / "
            f"{_post_asm_int(optimization_summary.get('removed_source_bytes'))} bytes"
        )
    if optimization_passes:
        pass_parts: list[str] = []
        for pass_info in optimization_passes[:6]:
            if not isinstance(pass_info, dict):
                continue
            pass_parts.append(
                f"p{_post_asm_int(pass_info.get('pass'))}:"
                f"{_post_asm_int(pass_info.get('patchable'))} patches,"
                f"{_post_asm_int(pass_info.get('removed_lines'))}l/"
                f"{_post_asm_int(pass_info.get('removed_source_bytes'))}b,"
                f"{_post_asm_int(pass_info.get('input_line_count'))}->"
                f"{_post_asm_int(pass_info.get('output_line_count'))}"
            )
        if len(optimization_passes) > 6:
            pass_parts.append(f"+{len(optimization_passes) - 6} more")
        if pass_parts:
            lines.append(f"Post-ASM passes: {'; '.join(pass_parts)}")
    return lines


def print_post_asm_report_summary(report_path: Path) -> None:
    if not report_path.exists():
        return
    report = load_post_asm_report(report_path)
    for line in format_post_asm_report_summary(report_path, report):
        print(line)


def enforce_post_asm_no_dead_blocks(project_root: Path, optimizer: Path, asm_path: Path) -> None:
    cmd = [
        sys.executable,
        str(optimizer),
        "--input",
        str(asm_path),
        "--rules",
        "dead-blocks",
        "--passes",
        "1",
    ]
    run_command(cmd, cwd=project_root)
    report = load_post_asm_report(post_asm_report_json_path(asm_path))
    metrics = report.get("metrics")
    if not isinstance(metrics, dict):
        raise RuntimeError("Post-ASM validation failed: report metrics must be an object")
    block_inventory = metrics.get("block_inventory")
    if not isinstance(block_inventory, dict):
        raise RuntimeError("Post-ASM validation failed: report block_inventory must be an object")
    candidates = block_inventory.get("dead_block_candidates", 0)
    source_lines = block_inventory.get("dead_candidate_lines", 0)
    source_bytes = block_inventory.get("dead_candidate_source_bytes", 0)
    if not isinstance(candidates, int) or not isinstance(source_lines, int) or not isinstance(source_bytes, int):
        raise RuntimeError("Post-ASM validation failed: dead-block metrics must be numeric")
    if candidates:
        raise RuntimeError(
            "Post-ASM validation failed: strict dead-block gate requires zero candidates; "
            f"deadBlockCandidates={candidates}, lines={source_lines}, sourceBytes={source_bytes}, "
            f"report={post_asm_report_json_path(asm_path)}"
        )


def maybe_run_post_asm_optimizer(
    project_root: Path,
    asm_output: Path,
    glass_jar: Path,
    enabled: bool,
    check_only: bool,
    rules: str | None,
    explicit_output: str | None,
    passes: int,
    strict_no_dead_blocks: bool = False,
) -> Path:
    if not enabled and not check_only and not strict_no_dead_blocks:
        return asm_output
    if passes < 1:
        raise ValueError("--post-asm-passes must be >= 1")

    optimizer = project_root / "scripts" / "post_asm_optimize.py"
    if not optimizer.exists():
        raise FileNotFoundError(f"Post-ASM optimizer not found: {optimizer}")

    output_path = (
        Path(explicit_output).expanduser().resolve()
        if explicit_output
        else asm_output.with_suffix(".optimized.asm")
    )
    if enabled or check_only:
        cmd = [
            sys.executable,
            str(optimizer),
            "--input",
            str(asm_output),
        ]
        if rules:
            cmd.extend(["--rules", rules])
        cmd.extend(["--passes", str(passes)])
        if enabled and not check_only:
            cmd.extend(["--apply", "--output", str(output_path)])
            cmd.extend(["--validate-glass", str(glass_jar)])

        run_command(cmd, cwd=project_root)

    asm_to_compile = output_path if enabled and not check_only else asm_output
    if strict_no_dead_blocks:
        enforce_post_asm_no_dead_blocks(project_root, optimizer, asm_to_compile)
    if enabled and not check_only:
        return output_path
    return asm_output


def launch_openmsx(
    openmsx_exec: str,
    rom_output: Path,
    project_root: Path,
    rom_mode: str | None = None,
    target_format: str | None = None,
    force_romtype: bool = True,
) -> None:
    cmd = [openmsx_exec, "-cart", str(rom_output)]
    if not force_romtype:
        pass
    elif rom_mode == "plain48k":
        cmd.extend(["-romtype", "Plain"])
    elif rom_mode == "megarom":
        mapper_to_romtype = {
            "konami": "konami",
            "ascii8": "ascii8",
            "ascii16": "ascii16",
        }
        romtype = mapper_to_romtype.get((target_format or "").lower())
        if romtype:
            cmd.extend(["-romtype", romtype])
    print("Running:", " ".join(cmd))
    if os.name == "nt":
        creationflags = 0x00000008 | 0x00000200
        proc = subprocess.Popen(cmd, cwd=str(project_root), creationflags=creationflags, close_fds=True)
    else:
        proc = subprocess.Popen(cmd, cwd=str(project_root), close_fds=True)
    print(f"OpenMSX launched (pid={proc.pid}).")


def _openmsx_cart_command(
    openmsx_exec: str,
    rom_output: Path,
    rom_mode: str | None = None,
    target_format: str | None = None,
    force_romtype: bool = True,
) -> list[str]:
    cmd = [openmsx_exec, "-cart", str(rom_output)]
    if not force_romtype:
        return cmd
    if rom_mode == "plain48k":
        cmd.extend(["-romtype", "Plain"])
    elif rom_mode == "megarom":
        mapper_to_romtype = {
            "konami": "konami",
            "ascii8": "ascii8",
            "ascii16": "ascii16",
        }
        romtype = mapper_to_romtype.get((target_format or "").lower())
        if romtype:
            cmd.extend(["-romtype", romtype])
    return cmd


def _sym_value(sym_text: str, label: str) -> int:
    match = re.search(rf"^\s*{re.escape(label)}:\s+equ\s+([0-9A-Fa-f]+)H\s*$", sym_text, flags=re.MULTILINE)
    if not match:
        raise RuntimeError(f"OpenMSX smoke failed: missing symbol {label}")
    return int(match.group(1), 16)


def _tcl_path(path: Path) -> str:
    return str(path).replace("\\", "/")


def _write_openmsx_smoke_script(
    script_path: Path,
    log_path: Path,
    shot_dir: Path,
    shot_prefix: str,
    symbols: dict[str, int],
) -> None:
    ensure_parent(script_path)
    shot_dir.mkdir(parents=True, exist_ok=True)
    script = f"""set log_path "{_tcl_path(log_path)}"
set shot_dir "{_tcl_path(shot_dir)}"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {{msg}} {{ global f; puts $f $msg; flush $f; puts $msg }}
proc mem8 {{addr}} {{ return [debug read memory $addr] }}
proc mem16 {{addr}} {{ set lo [mem8 $addr]; set hi [mem8 [expr {{$addr + 1}}]]; return [expr {{$lo | ($hi << 8)}}] }}
proc state {{tag}} {{
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0x{symbols['mapper_bank_p1_current']:04X}]; set p2 [mem8 0x{symbols['mapper_bank_p2_current']:04X}]; set p3 [mem8 0x{symbols['mapper_bank_p3_current']:04X}]; set p4 [mem8 0x{symbols['mapper_bank_p4_current']:04X}]
    set flow [mem8 0x{symbols['current_flow_state']:04X}]; set screen [mem8 0x{symbols['current_screen_id']:04X}]; set irq [mem16 0x{symbols['interrupt_counter']:04X}]; set inirq [mem8 0x{symbols['interrupt_in_progress']:04X}]
    set input [mem8 0x{symbols['input_state']:04X}]; set btn [mem8 0x{symbols['input_btn_curr']:04X}]
    set key8 [debug read keymatrix 8]; set joy [debug read joystickports 0]
    set ret [mem16 $sp]
    set pidx [mem8 0x{symbols['player_entity_index']:04X}]
    set hero [mem8 0x{symbols['hero_entity_id']:04X}]
    set prun [mem8 0x{symbols['player_runtime_enabled']:04X}]
    set entx 65535
    set enty 65535
    set sprslot 255
    set sprx 65535
    set spry 65535
    set visbestslot 255
    set visbestx 65535
    set visbesty 65535
    for {{set scan 0}} {{$scan < 32}} {{incr scan}} {{
        set scanaddr [expr {{0x{symbols['sprite_attributes']:04X} + ($scan * 4)}}]
        set scany [mem8 $scanaddr]
        set scanx [mem8 [expr {{$scanaddr + 1}}]]
        if {{$scany < 208 && $scany > 32 && $scanx > 16}} {{
            if {{$visbestslot == 255 || $scanx > $visbestx}} {{
                set visbestslot $scan
                set visbestx $scanx
                set visbesty $scany
            }}
        }}
    }}
    if {{$pidx < 32}} {{
        set entx [mem8 [expr {{0x{symbols['entity_x_pos']:04X} + $pidx}}]]
        set enty [mem8 [expr {{0x{symbols['entity_y_pos']:04X} + $pidx}}]]
        set sprslot [mem8 [expr {{0x{symbols['entity_sprite_config']:04X} + ($pidx * 2)}}]]
        if {{$sprslot < 32}} {{
            set spraddr [expr {{0x{symbols['sprite_attributes']:04X} + ($sprslot * 4)}}]
            set spry [mem8 $spraddr]
            set sprx [mem8 [expr {{$spraddr + 1}}]]
        }}
    }}
    set px [mem16 0x{symbols['player_x']:04X}]; set py [mem16 0x{symbols['player_y']:04X}]
    logline [format "%s pc=%04X sp=%04X ret=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X input=%02X btn=%02X key8=%02X joy=%02X pidx=%02X hero=%02X prun=%02X ent=%d,%d sprslot=%02X spr=%d,%d visbest=%02X,%d,%d pos=%d,%d" $tag $pc $sp $ret $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $input $btn $key8 $joy $pidx $hero $prun $entx $enty $sprslot $sprx $spry $visbestslot $visbestx $visbesty $px $py]
}}
proc down_space {{}} {{ keymatrixdown 8 0x01 }}
proc up_space {{}} {{ keymatrixup 8 0x01 }}
proc down_right {{}} {{ keymatrixdown 8 0x80 }}
proc up_right {{}} {{ keymatrixup 8 0x80 }}
proc down_left {{}} {{ keymatrixdown 8 0x10 }}
proc up_left {{}} {{ keymatrixup 8 0x10 }}
proc tap_space {{tag}} {{ state "${{tag}}_before"; down_space; after time 0.12 [list state "${{tag}}_during"]; after time 0.35 up_space; after time 0.45 [list state "${{tag}}_after"] }}
proc hold_right {{tag duration}} {{ state "${{tag}}_before"; down_right; after time 0.25 [list state "${{tag}}_during"]; after time $duration up_right; after time [expr {{$duration + 0.05}}] [list state "${{tag}}_after"] }}
proc hold_left {{tag duration}} {{ state "${{tag}}_before"; down_left; after time 0.25 [list state "${{tag}}_during"]; after time $duration up_left; after time [expr {{$duration + 0.05}}] [list state "${{tag}}_after"] }}
proc gameplay_ready {{}} {{
    global task_input_hits
    set px [mem16 0x{symbols['player_x']:04X}]
    set py [mem16 0x{symbols['player_y']:04X}]
    return [expr {{$task_input_hits > 0 && $px != 0x3333 && $py != 0x3333}}]
}}
proc hold_right_when_ready {{tag duration remaining}} {{
    if {{[gameplay_ready]}} {{
        hold_right $tag $duration
    }} elseif {{$remaining <= 0}} {{
        state "${{tag}}_not_ready"
    }} else {{
        after time 0.5 [list hold_right_when_ready $tag $duration [expr {{$remaining - 1}}]]
    }}
}}
proc shot {{name tag}} {{
    global shot_dir
    state $tag
    if {{[catch {{screenshot "$shot_dir/$name"}} err]}} {{ logline "SHOTERR $err" }} else {{ logline "SHOTOK $name" }}
}}

debug set_bp 0x4010 {{}} {{ state "BP_4010"; debug cont }}
set task_input_hits 0
debug set_bp 0x{symbols['task_update_input']:04X} {{}} {{
    global task_input_hits
    incr task_input_hits
    if {{$task_input_hits <= 2 || [debug read keymatrix 8] != 0xFF}} {{
        state "BP_task_input_$task_input_hits"
    }}
    debug cont
}}

after time 7.0 {{ tap_space "space1" }}
after time 9.0 {{ tap_space "space2" }}
after time 12.0 {{ shot "{shot_prefix}_t12.png" "t12" }}
after time 12.8 {{ tap_space "space3" }}
after time 14.0 {{ hold_right_when_ready "right" 1.0 18 }}
after time 16.0 {{ shot "{shot_prefix}_t16.png" "t16" }}
after time 17.0 {{ hold_left "left" 1.0 }}
after time 22.0 {{ shot "{shot_prefix}_t22.png" "t22"; close $f; exit }}
"""
    script_path.write_text(script, encoding="utf-8")


def _parse_player_probe(log_text: str, tag: str) -> tuple[int, str]:
    line_match = re.search(rf"^{re.escape(tag)}\b.*$", log_text, flags=re.MULTILINE)
    if not line_match:
        raise RuntimeError(f"OpenMSX smoke failed: missing {tag} position in probe log")

    line = line_match.group(0)

    # Some projects draw the active player from shadow OAM while player_x stays
    # as a logical sentinel. Prefer the visible sprite coordinate when logged.
    sprite_match = re.search(r"\bspr=(\d+),(\d+)", line)
    if sprite_match:
        sprite_x = int(sprite_match.group(1))
        sprite_y = int(sprite_match.group(2))
        if sprite_x != 65535 and sprite_y < 208:
            return sprite_x, "sprite"

    visible_match = re.search(r"\bvisbest=([0-9A-Fa-f]{2}),(\d+),(\d+)", line)
    if visible_match:
        visible_slot = int(visible_match.group(1), 16)
        visible_x = int(visible_match.group(2))
        visible_y = int(visible_match.group(3))
        if visible_slot != 255 and visible_x != 65535 and visible_y < 208:
            return visible_x, "visible-sprite"

    position_match = re.search(r"\bpos=(\d+),(\d+)", line)
    if not position_match:
        raise RuntimeError(f"OpenMSX smoke failed: missing {tag} position in probe log")
    return int(position_match.group(1)), "logical-position"


def _parse_player_x(log_text: str, tag: str) -> int:
    return _parse_player_probe(log_text, tag)[0]


@contextmanager
def _openmsx_smoke_lock(lock_path: Path):
    lock_dir = lock_path.with_name(lock_path.name + ".dir")
    stale_after_seconds = 10 * 60
    announced_wait = False
    ensure_parent(lock_dir)
    try:
        while True:
            try:
                lock_dir.mkdir()
                break
            except FileExistsError:
                try:
                    lock_age = time.time() - lock_dir.stat().st_mtime
                except FileNotFoundError:
                    continue
                if lock_age > stale_after_seconds:
                    shutil.rmtree(lock_dir, ignore_errors=True)
                    continue
                if not announced_wait:
                    print(f"Waiting for OpenMSX smoke lock: {lock_dir}")
                    announced_wait = True
                time.sleep(0.25)
        (lock_dir / "owner.txt").write_text(f"pid={os.getpid()}\n", encoding="utf-8")
        print("OpenMSX smoke lock acquired")
        yield
    finally:
        shutil.rmtree(lock_dir, ignore_errors=True)


def run_openmsx_smoke(
    openmsx_exec: str,
    rom_output: Path,
    sym_output: Path,
    project_root: Path,
    rom_mode: str | None = None,
    target_format: str | None = None,
    timeout_seconds: float = 35.0,
    require_movement: bool = False,
    force_romtype: bool = True,
) -> None:
    if not sym_output.exists():
        raise RuntimeError(f"OpenMSX smoke failed: missing symbols file {sym_output}")

    sym_text = sym_output.read_text(encoding="utf-8", errors="ignore")
    symbol_names = [
        "current_flow_state",
        "current_screen_id",
        "interrupt_counter",
        "interrupt_in_progress",
        "mapper_bank_p1_current",
        "mapper_bank_p2_current",
        "mapper_bank_p3_current",
        "mapper_bank_p4_current",
        "input_state",
        "input_btn_curr",
        "task_update_input",
        "entity_x_pos",
        "entity_y_pos",
        "entity_sprite_config",
        "hero_entity_id",
        "player_entity_index",
        "player_runtime_enabled",
        "sprite_attributes",
        "player_x",
        "player_y",
    ]
    symbols = {name: _sym_value(sym_text, name) for name in symbol_names}

    temp_dir = project_root / "server" / "temp"
    smoke_name = rom_output.stem + "_openmsx_smoke"
    script_path = temp_dir / f"{smoke_name}.tcl"
    log_path = temp_dir / f"{smoke_name}.log"
    stdout_path = temp_dir / f"{smoke_name}_stdout.log"
    stderr_path = temp_dir / f"{smoke_name}_stderr.log"
    shot_dir = temp_dir / f"{smoke_name}_shots"

    def run_attempt(attempt: int) -> tuple[int, int]:
        for stale_path in (log_path, stdout_path, stderr_path):
            try:
                stale_path.unlink(missing_ok=True)
            except Exception:
                pass
        shutil.rmtree(shot_dir, ignore_errors=True)
        _write_openmsx_smoke_script(script_path, log_path, shot_dir, rom_output.stem, symbols)

        lock_path = temp_dir / "openmsx_smoke.lock"
        with _openmsx_smoke_lock(lock_path):
            if os.name == "nt":
                subprocess.run(["taskkill", "/IM", "openmsx.exe", "/F"], capture_output=True)

            cmd = _openmsx_cart_command(openmsx_exec, rom_output, rom_mode, target_format, force_romtype)
            cmd.extend(["-script", str(script_path)])
            print(f"OpenMSX smoke attempt {attempt}:")
            print("Running:", " ".join(cmd))
            with stdout_path.open("wb") as stdout_fh, stderr_path.open("wb") as stderr_fh:
                creationflags = 0x00000008 | 0x00000200 if os.name == "nt" else 0
                proc = subprocess.Popen(
                    cmd,
                    cwd=str(project_root),
                    stdout=stdout_fh,
                    stderr=stderr_fh,
                    creationflags=creationflags,
                    close_fds=True,
                )
                try:
                    proc.wait(timeout=timeout_seconds)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=5)
                    raise RuntimeError(f"OpenMSX smoke failed: timed out after {timeout_seconds:g}s")

            if proc.returncode not in (0, None):
                raise RuntimeError(f"OpenMSX smoke failed: openMSX exited with {proc.returncode}")
            if not log_path.exists():
                raise RuntimeError("OpenMSX smoke failed: probe log was not created")

            log_text = log_path.read_text(encoding="utf-8", errors="replace")
            stderr_text = stderr_path.read_text(encoding="utf-8", errors="replace") if stderr_path.exists() else ""
            if "SHOTERR" in log_text:
                raise RuntimeError("OpenMSX smoke failed: screenshot capture reported SHOTERR")
            for marker in ("BP_4010", "space1_before", "space1_after", "space2_before", "space2_after", "t12", "right_before", "right_after", "left_before", "left_after", "t16", "t22"):
                if marker not in log_text:
                    raise RuntimeError(f"OpenMSX smoke failed: missing probe marker {marker}")
            for image_name in (f"{rom_output.stem}_t12.png", f"{rom_output.stem}_t16.png", f"{rom_output.stem}_t22.png"):
                if not (shot_dir / image_name).exists():
                    raise RuntimeError(f"OpenMSX smoke failed: missing screenshot {image_name}")

            start_x, start_source = _parse_player_probe(log_text, "right_before")
            right_x, right_source = _parse_player_probe(log_text, "right_after")
            left_x, left_source = _parse_player_probe(log_text, "left_after")
            right_moved = right_source == start_source and right_x != start_x
            left_moved = left_source == right_source and left_x != right_x
            end_x = right_x if right_moved else left_x
            if require_movement and not right_moved and not left_moved:
                raise RuntimeError(f"OpenMSX smoke failed: cursor movement did not change player X ({start_x})")
            if stderr_text.strip():
                raise RuntimeError(f"OpenMSX smoke failed: stderr is not empty: {stderr_text.strip()}")
            return start_x, end_x

    max_attempts = 2
    last_error: RuntimeError | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            start_x, end_x = run_attempt(attempt)
            if last_error is not None:
                print(f"OpenMSX smoke recovered on retry after: {last_error}")
            break
        except RuntimeError as exc:
            last_error = exc
            if attempt >= max_attempts:
                raise
            print(f"OpenMSX smoke attempt {attempt} failed, retrying once: {exc}")

    print(
        "OpenMSX smoke: "
        f"ok, playerX={start_x}->{end_x}, "
        f"movement={'ok' if end_x != start_x else 'unchanged'}, "
        f"romtype={'forced' if force_romtype else 'auto'}, "
        f"log={log_path}, screenshots={shot_dir}"
    )


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    json_path = resolve_existing(args.json, project_root)

    with json_path.open("r", encoding="utf-8") as fh:
        inferred_name = json.load(fh).get("name") or json_path.stem

    asm_output = (
        Path(args.asm_output).expanduser().resolve()
        if args.asm_output
        else (project_root / "server" / "temp" / f"{inferred_name}_unified.asm").resolve()
    )
    rom_output = (
        Path(args.rom_output).expanduser().resolve()
        if args.rom_output
        else (project_root / "server" / "temp" / f"{inferred_name}_unified.rom").resolve()
    )
    sym_output = Path(args.sym_output).expanduser().resolve() if args.sym_output else None
    if (
        args.openmsx_smoke
        or (args.rom_mode == "megarom" and args.target_format == "konami")
        or (args.rom_mode == "megarom" and args.target_format == "ascii16" and args.strict_ascii16_runtime_layout)
    ) and sym_output is None:
        sym_output = rom_output.with_suffix(".sym")

    ensure_parent(asm_output)
    ensure_parent(rom_output)
    if sym_output:
        ensure_parent(sym_output)

    if args.ts_build_dir:
        ts_build_dir = Path(args.ts_build_dir).expanduser().resolve()
    elif args.skip_ts_build:
        ts_build_dir = (project_root / "server" / "temp" / "tsbuild_skill").resolve()
    else:
        ts_build_dir = Path(tempfile.mkdtemp(prefix="mideas_tsbuild_")).resolve()
    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"

    if args.skip_ts_build:
        if not compiled_index.exists():
            print(
                "Missing compiled generator. Disable --skip-ts-build or provide --ts-build-dir with compiled files.",
                file=sys.stderr,
            )
            return 2
    else:
        compiled_index = compile_generator(project_root, ts_build_dir, args.allow_tsc_errors)

    try:
        glass_jar = resolve_glass(args.glass, project_root)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    project_name, asm_chars = generate_asm_from_json(
        compiled_index=compiled_index,
        json_path=json_path,
        asm_output=asm_output,
        project_name_override=args.project_name,
        project_root=project_root,
        rom_mode=args.rom_mode,
        target_format=args.target_format,
        execution_mode=args.execution_mode,
        auto_megarom=args.auto_megarom,
        enable_hard_player_tick=args.enable_hard_player_tick,
    )
    auto_resolve_msx2_budget = bool(
        args.auto_resolve_msx2_budget
        or (
            not args.no_auto_resolve_msx2_budget
            and args.rom_mode == "megarom"
            and args.target_format == "konami"
        )
    )

    zx0_asm, zx0_info = maybe_run_zx0_preprocess(
        project_root=project_root,
        asm_output=asm_output,
        enabled=not args.skip_zx0_preprocess,
    )
    artifact_dir = write_generated_artifacts(zx0_asm)
    artifact_dir, zx0_asm = validate_msx2_preflight_with_safe_resolution(
        artifact_dir=artifact_dir,
        asm_output=zx0_asm,
        project_root=project_root,
        strict_warnings=args.strict_msx2_megarom_preflight_warnings,
        auto_resolve=auto_resolve_msx2_budget,
        skip_zx0_preprocess=args.skip_zx0_preprocess,
        max_attempts=args.msx2_budget_resolve_attempts,
    )

    asm_to_compile = maybe_run_post_asm_optimizer(
        project_root=project_root,
        asm_output=zx0_asm,
        glass_jar=glass_jar,
        enabled=args.post_asm_opt,
        check_only=args.post_asm_check_only,
        rules=args.post_asm_rules,
        explicit_output=args.post_asm_output,
        passes=args.post_asm_passes,
        strict_no_dead_blocks=args.strict_post_asm_no_dead_blocks,
    )
    ensure_sprite_copy_helper(asm_to_compile)
    post_asm_rejected_report_paths: list[Path] = []
    post_asm_rejected_reason: str | None = None
    auto_post_asm_requested = False
    compile_resolver_attempts: list[dict[str, object]] = []

    try:
        compile_with_glass(
            glass_jar=glass_jar,
            asm_output=asm_to_compile,
            rom_output=rom_output,
            sym_output=sym_output,
            project_root=project_root,
        )
    except RuntimeError as exc:
        can_auto_compile_resolve = (
            auto_resolve_msx2_budget
            and not args.post_asm_opt
            and not args.post_asm_check_only
            and not args.strict_post_asm_no_dead_blocks
            and "resident bank overflow" in str(exc).lower()
        )
        compile_resolved_by_retry = False
        if can_auto_compile_resolve:
            initial_failure_path = write_msx2_compile_failure_summary(
                artifact_dir=artifact_dir,
                asm_to_compile=asm_to_compile,
                rom_output=rom_output,
                sym_output=sym_output,
                reason=str(exc),
                resolver_attempts=[],
            )
            initial_failure = (
                read_preflight_json_artifact(initial_failure_path, "msx2_compile_failure.json")
                if initial_failure_path and initial_failure_path.exists()
                else {}
            )
            automatic_plan = initial_failure.get("automaticResolutionPlan") if isinstance(initial_failure, dict) else {}
            next_compile_candidate = (
                automatic_plan.get("nextCandidateId")
                if isinstance(automatic_plan, dict) and automatic_plan.get("nextCandidateId")
                else "run_post_asm_dead_block_optimizer"
            )
            compile_resolver_attempts.append({
                "attempt": 0,
                "action": "glass_compile",
                "status": "failed",
                "reason": str(exc),
                "candidateId": next_compile_candidate,
                "asm": str(asm_to_compile),
            })
            if next_compile_candidate == "move_cold_readonly_data_to_world_bank":
                regenerated_asm = asm_output.with_name(f"{asm_output.stem}.resident-regenerated.asm")
                compile_resolver_attempts.append({
                    "attempt": 1,
                    "action": "move_cold_readonly_data_to_world_bank",
                    "candidateId": "move_cold_readonly_data_to_world_bank",
                    "status": "started",
                    "reason": "Regenerating ASM from project JSON with the current SCREEN 4 runtime layer policy.",
                    "asm": str(regenerated_asm),
                })
                try:
                    generate_asm_from_json(
                        compiled_index=compiled_index,
                        json_path=json_path,
                        asm_output=regenerated_asm,
                        project_name_override=args.project_name,
                        project_root=project_root,
                        rom_mode=args.rom_mode,
                        target_format=args.target_format,
                        execution_mode=args.execution_mode,
                        auto_megarom=args.auto_megarom,
                        enable_hard_player_tick=args.enable_hard_player_tick,
                    )
                    regenerated_zx0_asm, _ = maybe_run_zx0_preprocess(
                        project_root=project_root,
                        asm_output=regenerated_asm,
                        enabled=not args.skip_zx0_preprocess,
                    )
                    regenerated_artifact_dir = write_generated_artifacts(regenerated_zx0_asm)
                    regenerated_artifact_dir, regenerated_zx0_asm = validate_msx2_preflight_with_safe_resolution(
                        artifact_dir=regenerated_artifact_dir,
                        asm_output=regenerated_zx0_asm,
                        project_root=project_root,
                        strict_warnings=args.strict_msx2_megarom_preflight_warnings,
                        auto_resolve=auto_resolve_msx2_budget,
                        skip_zx0_preprocess=args.skip_zx0_preprocess,
                        max_attempts=args.msx2_budget_resolve_attempts,
                    )
                    ensure_sprite_copy_helper(regenerated_zx0_asm)
                    compile_with_glass(
                        glass_jar=glass_jar,
                        asm_output=regenerated_zx0_asm,
                        rom_output=rom_output,
                        sym_output=sym_output,
                        project_root=project_root,
                    )
                    artifact_dir = regenerated_artifact_dir
                    zx0_asm = regenerated_zx0_asm
                    asm_to_compile = regenerated_zx0_asm
                    compile_resolver_attempts[-1].update({
                        "status": "resolved",
                        "asm": str(asm_to_compile),
                    })
                    compile_resolved_by_retry = True
                except RuntimeError as regen_exc:
                    compile_resolver_attempts[-1].update({
                        "status": "failed",
                        "reason": str(regen_exc),
                    })
                    write_msx2_compile_failure_summary(
                        artifact_dir=artifact_dir,
                        asm_to_compile=asm_to_compile,
                        rom_output=rom_output,
                        sym_output=sym_output,
                        reason=str(exc),
                        resolver_attempts=compile_resolver_attempts,
                    )
            if compile_resolved_by_retry:
                pass
            else:
                post_attempt_number = len(compile_resolver_attempts)
                try:
                    auto_post_asm_requested = True
                    optimized_asm = maybe_run_post_asm_optimizer(
                        project_root=project_root,
                        asm_output=zx0_asm,
                        glass_jar=glass_jar,
                        enabled=True,
                        check_only=False,
                        rules="dead-blocks",
                        explicit_output=None,
                        passes=1,
                        strict_no_dead_blocks=False,
                    )
                    ensure_sprite_copy_helper(optimized_asm)
                    compile_with_glass(
                        glass_jar=glass_jar,
                        asm_output=optimized_asm,
                        rom_output=rom_output,
                        sym_output=sym_output,
                        project_root=project_root,
                    )
                    asm_to_compile = optimized_asm
                    compile_resolver_attempts.append({
                        "attempt": post_attempt_number,
                        "action": "run_post_asm_dead_block_optimizer",
                        "candidateId": "run_post_asm_dead_block_optimizer",
                        "status": "resolved",
                        "asm": str(asm_to_compile),
                        "report": str(post_asm_report_json_path(asm_to_compile)),
                    })
                    compile_resolved_by_retry = True
                except RuntimeError as retry_exc:
                    compile_resolver_attempts.append({
                        "attempt": post_attempt_number,
                        "action": "run_post_asm_dead_block_optimizer",
                        "candidateId": "run_post_asm_dead_block_optimizer",
                        "status": "failed",
                        "reason": str(retry_exc),
                        "report": str(post_asm_report_json_path(zx0_asm.with_suffix(".optimized.asm"))),
                    })
                    if (
                        args.rom_mode == "megarom"
                        and args.target_format == "konami"
                        and "MSX2 SCREEN 4" in zx0_asm.read_text(encoding="utf-8", errors="ignore")
                    ):
                        write_msx2_compile_failure_summary(
                            artifact_dir=artifact_dir,
                            asm_to_compile=zx0_asm,
                            rom_output=rom_output,
                            sym_output=sym_output,
                            reason=str(exc),
                            resolver_attempts=compile_resolver_attempts,
                        )
                    raise exc
        if compile_resolved_by_retry:
            pass
        elif asm_to_compile != zx0_asm and args.post_asm_opt and not args.post_asm_check_only:
            post_asm_rejected_report_paths.append(post_asm_report_json_path(asm_to_compile))
            post_asm_rejected_reason = str(exc)
            print(
                "Post-ASM optimized ASM failed Glass compile; "
                f"falling back to baseline ASM. Reason: {post_asm_rejected_reason}",
                file=sys.stderr,
            )
            asm_to_compile = zx0_asm
            ensure_sprite_copy_helper(asm_to_compile)
            try:
                compile_with_glass(
                    glass_jar=glass_jar,
                    asm_output=asm_to_compile,
                    rom_output=rom_output,
                    sym_output=sym_output,
                    project_root=project_root,
                )
            except RuntimeError as fallback_exc:
                if (
                    args.rom_mode == "megarom"
                    and args.target_format == "konami"
                    and "MSX2 SCREEN 4" in asm_to_compile.read_text(encoding="utf-8", errors="ignore")
                ):
                    write_msx2_compile_failure_summary(
                        artifact_dir=artifact_dir,
                        asm_to_compile=asm_to_compile,
                        rom_output=rom_output,
                        sym_output=sym_output,
                        reason=str(fallback_exc),
                        resolver_attempts=compile_resolver_attempts,
                    )
                raise
        elif not can_auto_compile_resolve:
            if (
                args.rom_mode == "megarom"
                and args.target_format == "konami"
                and "MSX2 SCREEN 4" in asm_to_compile.read_text(encoding="utf-8", errors="ignore")
            ):
                write_msx2_compile_failure_summary(
                    artifact_dir=artifact_dir,
                    asm_to_compile=asm_to_compile,
                    rom_output=rom_output,
                    sym_output=sym_output,
                    reason=str(exc),
                    resolver_attempts=compile_resolver_attempts,
                )
            raise

    def validate_compiled_outputs(selected_asm: Path) -> dict[str, object]:
        original, padded = pad_rom_to_valid_size(rom_output, args.rom_mode, args.target_format)
        compiled_text = selected_asm.read_text(encoding="utf-8", errors="ignore")
        screen4_fixed = (
            args.rom_mode == "megarom"
            and args.target_format == "konami"
            and "Mideas MSX2 SCREEN 4 tile backend" in compiled_text
            and "init_konami8k_fixed_bank0_banks:" in compiled_text
        )
        screen5_fixed = (
            args.rom_mode == "megarom"
            and args.target_format == "konami"
            and (
                "Mideas MSX2 SCREEN 5 presentation backend" in compiled_text
                or "Mideas MSX2 SCREEN 5 presentation chain backend" in compiled_text
            )
            and "init_konami8k_fixed_bank0_banks:" in compiled_text
        )
        mapper_validation = None
        ascii16_layout = None
        screen4_validation = None
        screen5_validation = None
        if args.rom_mode == "megarom" and not screen4_fixed and not screen5_fixed:
            mapper_validation = validate_megarom_mapper_artifact_metadata(
                artifact_dir,
                args.target_format,
                strict_tilebank_integrity=args.strict_tilebank_integrity,
            )
            if args.target_format == "ascii16":
                ascii16_layout = inspect_ascii16_runtime_layout(selected_asm, artifact_dir, sym_output)
                if args.strict_ascii16_runtime_layout:
                    validate_ascii16_runtime_layout_gate(ascii16_layout)
                validate_ascii16_resident_free_gate(
                    ascii16_layout,
                    args.strict_ascii16_resident_free_bytes,
                )
                annotate_ascii16_runtime_layout_artifact(artifact_dir, ascii16_layout)
        konami_validation = None
        konami_artifact_validation = None
        if screen4_fixed:
            screen4_validation = validate_msx2_screen4_konami_fixed_bank0_megarom(rom_output, selected_asm, sym_output)
        elif screen5_fixed:
            screen5_validation = validate_msx2_screen5_konami_fixed_bank0_megarom(rom_output, selected_asm)
        elif args.rom_mode == "megarom" and args.target_format == "konami":
            konami_validation = validate_konami8k_megarom(rom_output, selected_asm)
            konami_artifact_validation = validate_konami8k_generated_artifacts(
                artifact_dir,
                expected_resource_count=konami_validation["resource_count"],
                segment_count=konami_validation["segment_count"],
                asm_path=selected_asm,
                sym_path=sym_output,
                strict_p3_data_window=args.strict_p3_data_window,
                strict_vram_staging=args.strict_vram_staging,
                strict_tilebank_integrity=args.strict_tilebank_integrity,
            )
        kind = (
            "msx2_screen4_konami_fixed_bank0"
            if screen4_fixed
            else "msx2_screen5_konami_fixed_bank0"
            if screen5_fixed
            else f"{args.rom_mode}_{args.target_format}"
        )
        return {
            "original_size": original,
            "padded_size": padded,
            "screen4_konami_fixed_bank0_compat": screen4_fixed,
            "screen5_konami_fixed_bank0_compat": screen5_fixed,
            "megarom_mapper_artifact_validation": mapper_validation,
            "ascii16_runtime_layout": ascii16_layout,
            "msx2_screen4_konami_validation": screen4_validation,
            "msx2_screen5_konami_validation": screen5_validation,
            "konami8k_validation": konami_validation,
            "konami8k_artifact_validation": konami_artifact_validation,
            "validation_kind": kind,
        }

    try:
        validation_results = validate_compiled_outputs(asm_to_compile)
    except RuntimeError as exc:
        if asm_to_compile != zx0_asm and (args.post_asm_opt or auto_post_asm_requested) and not args.post_asm_check_only:
            post_asm_rejected_report_paths.append(post_asm_report_json_path(asm_to_compile))
            post_asm_rejected_reason = str(exc)
            print(
                "Post-ASM optimized ASM failed artifact validation; "
                f"falling back to baseline ASM. Reason: {post_asm_rejected_reason}",
                file=sys.stderr,
            )
            asm_to_compile = zx0_asm
            ensure_sprite_copy_helper(asm_to_compile)
            compile_with_glass(
                glass_jar=glass_jar,
                asm_output=asm_to_compile,
                rom_output=rom_output,
                sym_output=sym_output,
                project_root=project_root,
            )
            validation_results = validate_compiled_outputs(asm_to_compile)
        else:
            raise

    original_size = int(validation_results["original_size"])
    padded_size = int(validation_results["padded_size"])
    screen4_konami_fixed_bank0_compat = bool(validation_results["screen4_konami_fixed_bank0_compat"])
    screen5_konami_fixed_bank0_compat = bool(validation_results["screen5_konami_fixed_bank0_compat"])
    megarom_mapper_artifact_validation = validation_results["megarom_mapper_artifact_validation"]
    ascii16_runtime_layout = validation_results["ascii16_runtime_layout"]
    msx2_screen4_konami_validation = validation_results["msx2_screen4_konami_validation"]
    msx2_screen5_konami_validation = validation_results["msx2_screen5_konami_validation"]
    konami8k_validation = validation_results["konami8k_validation"]
    konami8k_artifact_validation = validation_results["konami8k_artifact_validation"]
    validation_kind = str(validation_results["validation_kind"])
    write_msx2_build_summary(
        artifact_dir=artifact_dir,
        rom_output=rom_output,
        asm_to_compile=asm_to_compile,
        sym_output=sym_output,
        original_size=original_size,
        padded_size=padded_size,
        validation_kind=validation_kind,
        post_asm_requested=bool(auto_post_asm_requested or args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks),
        post_asm_check_only=bool(args.post_asm_check_only),
        post_asm_applied=bool(asm_to_compile != zx0_asm),
        post_asm_report_paths=(
            [post_asm_report_json_path(zx0_asm)]
            + ([post_asm_report_json_path(asm_to_compile)] if asm_to_compile != zx0_asm else [])
            + [path for path in post_asm_rejected_report_paths if path != post_asm_report_json_path(zx0_asm) and path != post_asm_report_json_path(asm_to_compile)]
            if auto_post_asm_requested or args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks
            else []
        ),
        post_asm_rejected_report_paths=post_asm_rejected_report_paths,
        post_asm_rejected_reason=post_asm_rejected_reason,
        compile_resolver_attempts=compile_resolver_attempts,
        openmsx_requested=bool(args.openmsx_smoke),
    )

    print("")
    print("Done.")
    print(f"Project: {project_name}")
    print(f"JSON: {json_path}")
    print(f"ASM: {asm_output} ({asm_chars} chars)")
    if artifact_dir:
        print(f"Generated artifacts: {artifact_dir}")
    if zx0_asm != asm_output:
        print(f"ZX0 ASM: {zx0_asm}")
    if zx0_info is not None:
        applied = zx0_info.get("applied")
        net_saved = zx0_info.get("netSavedBytes")
        warning = zx0_info.get("warning")
        print(f"ZX0: applied={applied}, netSavedBytes={net_saved}, warning={warning or 'none'}")
    if asm_to_compile != zx0_asm:
        print(f"Optimized ASM: {asm_to_compile}")
    print(f"ROM: {rom_output} (original={original_size} bytes, padded={padded_size} bytes)")
    if screen4_konami_fixed_bank0_compat:
        validation_suffix = (
            f"; segments={msx2_screen4_konami_validation['segment_count']}, "
            f"mapperWrites=scattered:{msx2_screen4_konami_validation['scattered_mapper_writes']}"
            if msx2_screen4_konami_validation
            else ""
        )
        print(
            "Konami8K validation: SCREEN 4 fixed-bank0 compatibility path; "
            "ROM has MegaROM-sized 8KB banks and boot initializes 6000h=1 8000h=2 A000h=3"
            f"{validation_suffix}"
        )
    if screen5_konami_fixed_bank0_compat:
        validation_suffix = (
            f"; segments={msx2_screen5_konami_validation['segment_count']}"
            if msx2_screen5_konami_validation
            else ""
        )
        print(
            "Konami8K validation: SCREEN 5 presentation fixed-bank0 compatibility path; "
            "ROM has MegaROM-sized 8KB banks and boot initializes 6000h=1 8000h=2 A000h=3"
            f"{validation_suffix}"
        )
    if konami8k_validation:
        resource_count = konami8k_validation["resource_count"]
        resource_range = (
            f"resources={resource_count}, "
            f"windowRange=#{konami8k_validation['resource_min_address']:04X}-#{konami8k_validation['resource_max_address']:04X}"
            if resource_count
            else "resources=0"
        )
        print(
            "Konami8K validation: "
            f"segments={konami8k_validation['segment_count']}, "
            f"size={konami8k_validation['size_bytes']} bytes, header=AB, "
            "boot maps 6000h=1 8000h=2 A000h=3, "
            f"{resource_range}"
        )
    if konami8k_artifact_validation:
        print(
            "Konami8K artifacts: "
            f"banks={konami8k_artifact_validation['manifest_bank_count']}, "
            f"bossDataBanks={konami8k_artifact_validation['boss_data_bank_count']}, "
            f"resources={konami8k_artifact_validation['manifest_resource_count']}, "
            f"codeBanks={konami8k_artifact_validation['actual_code_banks']}, "
            f"maxCodeUsed={konami8k_artifact_validation['max_actual_code_used']}, "
            f"residentP3Used={konami8k_artifact_validation['p3_resident_actual_used']}, "
            f"largeVramResources={konami8k_artifact_validation['large_vram_resource_count']}, "
            f"maxLargeVramRaw={konami8k_artifact_validation['large_vram_resource_max']}, "
            f"tilebankIssueScreens={konami8k_artifact_validation['tilebank_issue_screens']}, "
            f"tilebankIssueCells={konami8k_artifact_validation['tilebank_issue_cells']}, "
            f"tilebankMissingAssetCells={konami8k_artifact_validation['tilebank_missing_asset_cells']}, "
            f"tilebankUnassignedCells={konami8k_artifact_validation['tilebank_unassigned_cells']}, "
            f"manifestV2={konami8k_artifact_validation['manifest_v2_build_id']}, "
            "packing_manifest.json=ok, manifest_v2.json=ok, banks.json=ok, project_usage.json=ok, load_plan.json=ok, "
            "bank_optimizer.json=ok, tilebank_integrity.json=ok, "
            "unused_report.txt=ok, segment_budget.json=ok"
        )
    if megarom_mapper_artifact_validation:
        print(
            "MegaROM mapper artifacts: "
            f"format={megarom_mapper_artifact_validation['mapper_format']}, "
            f"segmentSize={megarom_mapper_artifact_validation['segment_size']}, "
            f"window={megarom_mapper_artifact_validation['data_window_page']}/"
            f"{megarom_mapper_artifact_validation['window_base']}, "
            f"banks={megarom_mapper_artifact_validation['bank_count']}, "
            f"bossDataBanks={megarom_mapper_artifact_validation['boss_data_bank_count']}, "
            f"resources={megarom_mapper_artifact_validation['resource_count']}, "
            f"manifestV2={megarom_mapper_artifact_validation['manifest_v2_build_id']}, "
            f"tilebankIssueScreens={megarom_mapper_artifact_validation['tilebank_issue_screens']}, "
            f"tilebankIssueCells={megarom_mapper_artifact_validation['tilebank_issue_cells']}, "
            f"tilebankMissingAssetCells={megarom_mapper_artifact_validation['tilebank_missing_asset_cells']}, "
            f"tilebankUnassignedCells={megarom_mapper_artifact_validation['tilebank_unassigned_cells']}"
        )
    if ascii16_runtime_layout:
        print(
            "ASCII16 runtime layout: "
            f"status={ascii16_runtime_layout['runtime_status']}, "
            f"smokeBlocked={str(ascii16_runtime_layout['smoke_blocked']).lower()}, "
            f"residentLowerPageBanks={ascii16_runtime_layout['resident_lower_page_bank_count']}, "
            f"farLowerPageBanks={ascii16_runtime_layout['far_lower_page_bank_count']}, "
            f"lowerPageHazards={ascii16_runtime_layout['lower_page_hazard_bank_count']}, "
            f"estimatedResidentWindowOverflows={ascii16_runtime_layout['resident_estimated_window_overflow_count']}, "
            f"estimatedResidentOutOfWindowLabels={ascii16_runtime_layout['resident_estimated_out_of_window_label_count']}, "
            f"estimatedResidentOutOfWindowCalls={ascii16_runtime_layout['resident_estimated_out_of_window_call_count']}, "
            f"farToFarDirectCalls={ascii16_runtime_layout['far_to_far_direct_call_count']}, "
            f"actualResidentOverflows={ascii16_runtime_layout['actual_resident_window_overflow_count']}, "
            f"maxActualResidentUsed={ascii16_runtime_layout['max_actual_resident_used']}, "
            f"minActualResidentFree={ascii16_runtime_layout.get('min_actual_resident_free', 0)}, "
            f"lowFreeResidentBanks={ascii16_runtime_layout.get('actual_resident_low_free_bank_count', 0)}, "
            f"lowFreeThreshold={ascii16_runtime_layout.get('actual_resident_low_free_threshold', ASCII16_RESIDENT_LOW_FREE_WARNING_BYTES)}, "
            f"hiddenResidentCalls={ascii16_runtime_layout['hidden_resident_call_count']}, "
            f"residentBridgeCalls={ascii16_runtime_layout['resident_bridge_call_count']}, "
            f"upperResidentBanks={ascii16_runtime_layout['upper_resident_bank_count']}, "
            f"dataWindowResidentConflict={str(ascii16_runtime_layout['data_window_resident_conflict']).lower()}, "
            f"switchesP1={str(ascii16_runtime_layout['far_trampolines_switch_p1']).lower()}, "
            f"reason={ascii16_runtime_layout['reason']}"
        )
    print(f"Glass: {glass_jar}")
    print(
        "Generator config: "
        f"mode={args.rom_mode}, mapper={args.target_format}, engine={args.execution_mode}, "
        f"autoMegaROM={args.auto_megarom}, autoResolveMsx2Budget={auto_resolve_msx2_budget}"
    )
    if args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks:
        print(
            "Post-ASM: "
            f"enabled={args.post_asm_opt}, check_only={args.post_asm_check_only}, "
            f"rules={args.post_asm_rules or 'all'}, passes={args.post_asm_passes}, "
            f"strictNoDeadBlocks={args.strict_post_asm_no_dead_blocks}"
        )
        post_asm_report_paths = [post_asm_report_json_path(zx0_asm)]
        if asm_to_compile != zx0_asm:
            post_asm_report_paths.append(post_asm_report_json_path(asm_to_compile))
        seen_report_paths: set[Path] = set()
        for report_path in post_asm_report_paths:
            if report_path in seen_report_paths:
                continue
            seen_report_paths.add(report_path)
            print_post_asm_report_summary(report_path)

    if args.openmsx_smoke:
        validate_openmsx_mapper_smoke_contract(asm_to_compile, args.target_format, artifact_dir, sym_output)
        try:
            openmsx_exec = resolve_openmsx(args.openmsx_path)
        except FileNotFoundError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        run_openmsx_smoke(
            openmsx_exec=openmsx_exec,
            rom_output=rom_output,
            sym_output=sym_output,
            project_root=project_root,
            rom_mode=args.rom_mode,
            target_format=args.target_format,
            timeout_seconds=args.openmsx_timeout,
            require_movement=args.openmsx_smoke_require_movement,
            force_romtype=not args.openmsx_smoke_no_forced_romtype,
        )
        write_msx2_build_summary(
            artifact_dir=artifact_dir,
            rom_output=rom_output,
            asm_to_compile=asm_to_compile,
            sym_output=sym_output,
            original_size=original_size,
            padded_size=padded_size,
            validation_kind=validation_kind,
            post_asm_requested=bool(auto_post_asm_requested or args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks),
            post_asm_check_only=bool(args.post_asm_check_only),
            post_asm_applied=bool(asm_to_compile != zx0_asm),
            post_asm_report_paths=(
                [post_asm_report_json_path(zx0_asm)]
                + ([post_asm_report_json_path(asm_to_compile)] if asm_to_compile != zx0_asm else [])
                + [path for path in post_asm_rejected_report_paths if path != post_asm_report_json_path(zx0_asm) and path != post_asm_report_json_path(asm_to_compile)]
                if auto_post_asm_requested or args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks
                else []
            ),
            post_asm_rejected_report_paths=post_asm_rejected_report_paths,
            post_asm_rejected_reason=post_asm_rejected_reason,
            compile_resolver_attempts=compile_resolver_attempts,
            openmsx_requested=True,
            openmsx_passed=True,
        )

    if args.run_openmsx:
        try:
            openmsx_exec = resolve_openmsx(args.openmsx_path)
        except FileNotFoundError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        launch_openmsx(openmsx_exec, rom_output, project_root, args.rom_mode, args.target_format)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
