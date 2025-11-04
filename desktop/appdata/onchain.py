import os
import sys
import time
import subprocess
import traceback
import runpy
from pathlib import Path

BASE = Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parent))

PYTHONPATH = os.pathsep.join(
    [str(BASE), str(BASE / "scripts"), os.environ.get("PYTHONPATH", "")]
)

def log_ok(msg):   print(f"[OK] {msg}",   flush=True)
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)
def log_err(msg):  print(f"[ERR] {msg}",  flush=True)

SCRIPT_DELAY = 3

MODULES = [
    ("scripts.onchain_update_date",    "Updating date..."),
    ("scripts.onchain_rewrite_prices", "Rewriting prices..."),
    ("scripts.onchain_update_prices",  "Updating prices..."),
    ("scripts.onchain_update_tvl",     "Updating TVL..."),
    ("scripts.onchain_sort_by_tvl",    "Sorting rows by TVL..."),
    ("scripts.onchain_validate_tvl",   "Validating TVL..."),
    ("scripts.onchain_sort_charts",    "Sorting charts..."),
    ("scripts.clean_up",               "Cleaning up..."),
]

def run_step(mod_name: str, timeout_sec: int = 1800):
    if getattr(sys, "frozen", False):
        old_path = list(sys.path)
        try:
            sys.path.insert(0, str(BASE))
            sys.path.insert(0, str(BASE / "scripts"))
            log_info(f"[embedded] running {mod_name}")
            runpy.run_module(mod_name, run_name="__main__")
        except SystemExit as e:
            code = e.code if isinstance(e.code, int) else 0
            if code != 0:
                raise subprocess.CalledProcessError(code, mod_name)
        except Exception as e:
            tb = traceback.format_exc()
            log_err(f"Unhandled error in embedded module {mod_name}:\n{tb}")
            raise subprocess.CalledProcessError(1, mod_name) from e
        finally:
            sys.path[:] = old_path
    else:
        env = os.environ.copy()
        env["PYTHONPATH"] = PYTHONPATH
        env["PYTHONUNBUFFERED"] = "1"
        cmd = [sys.executable, "-m", mod_name]
        subprocess.run(cmd, check=True, cwd=str(BASE), env=env, timeout=timeout_sec)

def try_excel_recalc():
    if os.name != "nt":
        return
    docs_dir = Path(os.environ.get("DOCS_DIR", BASE / "docs")).resolve()
    candidates = [
        docs_dir / "sorted_tvl.xlsx",
        docs_dir / "Monthly_Performance_CVR_latest.xlsx",
        docs_dir / "Monthly_Performance_CVR.xlsx",
    ]
    files = [str(p) for p in candidates if p.exists()]
    if not files:
        return

    try:
        import win32com.client
        log_info("Recalculating workbooks in Excel (Windows)...")
        excel = win32com.client.DispatchEx("Excel.Application")
        excel.Visible = False
        excel.ScreenUpdating = False
        excel.DisplayAlerts = False
        try:
            for fp in files:
                wb = excel.Workbooks.Open(fp, UpdateLinks=0, ReadOnly=False)
                excel.CalculateFullRebuild()
                wb.Save()
                wb.Close(SaveChanges=True)
        finally:
            excel.Quit()
        log_ok("Excel recalculation completed successfully.")
    except Exception as e:
        log_warn(f"Excel recalculation skipped ({e}). Continuing without it.")

def main():
    for i, (mod_name, message) in enumerate(MODULES):
        if message:
            log_info(message)

        if mod_name == "scripts.onchain_validate_tvl":
            try_excel_recalc()

        try:
            run_step(mod_name)
        except subprocess.TimeoutExpired:
            log_err(f"{mod_name} timed out.")
            sys.exit(124)
        except subprocess.CalledProcessError as e:
            code = e.returncode if isinstance(e.returncode, int) else 1
            log_err(f"{mod_name} failed with exit code {code}")
            sys.exit(code)
        except FileNotFoundError as e:
            log_err(f"Could not start interpreter or module not found: {e}")
            sys.exit(1)
        except Exception:
            log_err(f"{mod_name} failed with unexpected error:\n{traceback.format_exc()}")
            sys.exit(1)

        if i < len(MODULES) - 1 and SCRIPT_DELAY > 0:
            time.sleep(SCRIPT_DELAY)

    log_ok("All onchain scripts completed successfully.")

if __name__ == "__main__":
    main()
