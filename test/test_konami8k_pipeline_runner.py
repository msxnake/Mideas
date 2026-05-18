import subprocess
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER = REPO_ROOT / "scripts" / "run_konami8k_pipeline.py"


def run_pipeline_help(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(RUNNER), *args],
        cwd=str(REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def test_dry_run_uses_konami8k_baseline_defaults() -> None:
    downloads_dir = Path(tempfile.gettempdir()) / "mideas_konami8k_missing_downloads"
    result = run_pipeline_help(
        "--dry-run",
        "--project-root",
        str(REPO_ROOT),
        "--downloads-dir",
        str(downloads_dir),
        "--no-openmsx-smoke",
    )

    assert result.returncode == 0
    assert "run_mideas_regression_matrix.py" in result.stdout
    assert "--modes megarom" in result.stdout
    assert "--target-formats konami" in result.stdout
    assert "--skip-missing-json" in result.stdout
    assert "--strict-p3-data-window" in result.stdout
    assert "--strict-vram-staging" in result.stdout
    assert "--strict-post-asm-no-dead-blocks" not in result.stdout
    assert "--post-asm-check-only" in result.stdout
    for json_name in ("joc51.json", "joc_tales_9.json", "patoantic248.json", "joc60.json"):
        assert json_name in result.stdout


def test_fail_missing_json_removes_skip_flag() -> None:
    result = run_pipeline_help(
        "--dry-run",
        "--project-root",
        str(REPO_ROOT),
        "--json",
        str(Path(tempfile.gettempdir()) / "mideas_absent_fixture.json"),
        "--fail-missing-json",
        "--no-openmsx-smoke",
    )

    assert result.returncode == 0
    assert "--skip-missing-json" not in result.stdout


def test_strict_dead_block_gate_is_explicit() -> None:
    result = run_pipeline_help(
        "--dry-run",
        "--project-root",
        str(REPO_ROOT),
        "--json",
        str(Path(tempfile.gettempdir()) / "mideas_absent_fixture.json"),
        "--strict-post-asm-no-dead-blocks",
        "--no-openmsx-smoke",
    )

    assert result.returncode == 0
    assert "--strict-post-asm-no-dead-blocks" in result.stdout


def test_default_baselines_resolve_latest_recursive_download_match() -> None:
    with tempfile.TemporaryDirectory(prefix="mideas_konami8k_pipeline_") as temp_dir:
        downloads_dir = Path(temp_dir)
        old_dir = downloads_dir / "old"
        new_dir = downloads_dir / "new"
        old_dir.mkdir()
        new_dir.mkdir()
        old_path = old_dir / "joc51.json"
        new_path = new_dir / "joc51.json"
        old_path.write_text("{}", encoding="utf-8")
        new_path.write_text("{}", encoding="utf-8")
        old_time = 1_700_000_000
        new_time = old_time + 100
        import os

        os.utime(old_path, (old_time, old_time))
        os.utime(new_path, (new_time, new_time))

        result = run_pipeline_help(
            "--dry-run",
            "--project-root",
            str(REPO_ROOT),
            "--downloads-dir",
            str(downloads_dir),
            "--no-openmsx-smoke",
        )

    assert result.returncode == 0
    assert str(new_path) in result.stdout
    assert str(old_path) not in result.stdout


if __name__ == "__main__":
    test_dry_run_uses_konami8k_baseline_defaults()
    test_fail_missing_json_removes_skip_flag()
    test_strict_dead_block_gate_is_explicit()
    test_default_baselines_resolve_latest_recursive_download_match()
