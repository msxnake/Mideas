import subprocess
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER = REPO_ROOT / "scripts" / "run_mideas_regression_matrix.py"


def run_matrix(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(RUNNER), *args],
        cwd=str(REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def test_missing_json_fails_by_default() -> None:
    missing_json = Path(tempfile.gettempdir()) / "mideas_missing_matrix_fixture.json"
    if missing_json.exists():
        missing_json.unlink()

    result = run_matrix("--json", str(missing_json), "--project-root", str(REPO_ROOT), "--no-openmsx-smoke")

    assert result.returncode == 1
    assert "Regression matrix failed: JSON not found:" in result.stderr


def test_skip_missing_json_reports_empty_input_set() -> None:
    missing_json = Path(tempfile.gettempdir()) / "mideas_missing_matrix_fixture.json"
    if missing_json.exists():
        missing_json.unlink()

    result = run_matrix(
        "--json",
        str(missing_json),
        "--project-root",
        str(REPO_ROOT),
        "--no-openmsx-smoke",
        "--skip-missing-json",
    )

    assert result.returncode == 1
    assert "Skipping missing JSON:" in result.stdout
    assert "No existing JSON inputs remain after --skip-missing-json" in result.stderr


def test_help_lists_fixture_and_artifact_controls() -> None:
    result = run_matrix("--help")

    assert result.returncode == 0
    assert "--skip-missing-json" in result.stdout
    assert "--artifact-dir" in result.stdout


if __name__ == "__main__":
    test_missing_json_fails_by_default()
    test_skip_missing_json_reports_empty_input_set()
    test_help_lists_fixture_and_artifact_controls()
