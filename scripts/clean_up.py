from pathlib import Path
import os
import sys

def log_ok(msg):   print(f"[OK] {msg}",   flush=True)
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)
def log_err(msg):  print(f"[ERR] {msg}",  flush=True)

SCRIPT_DIR = Path(__file__).resolve().parent
APP_BASE   = Path(os.environ.get("APP_BASE", SCRIPT_DIR.parent)).resolve()    
DOCS_DIR   = Path(os.environ.get("DOCS_DIR", APP_BASE / "docs")).resolve()

FILES_TO_DELETE = [
    DOCS_DIR / "updated_file.xlsx",
    DOCS_DIR / "updated_prices.xlsx",
    DOCS_DIR / "updated_tvl.xlsx",
]

def main():
    for path in FILES_TO_DELETE:
        p = Path(path)
        try:
            p.unlink()
            log_ok(f"Deleted: {p}")
        except FileNotFoundError:
            log_warn(f"Not found (skipped): {p}")
        except PermissionError:
            log_err(f"Permission denied: {p}")
        except IsADirectoryError:
            try:
                import shutil
                shutil.rmtree(p)
                log_ok(f"Deleted directory: {p}")
            except Exception as e:
                log_err(f"Error deleting directory {p}: {e}")
        except Exception as e:
            log_err(f"Error deleting {p}: {e}")

if __name__ == "__main__":
    main()
