from pathlib import Path
import os
import shutil
from common.log import log_ok, log_warn  # no per-file errors logged anymore

SCRIPT_DIR = Path(__file__).resolve().parent
APP_BASE   = Path(os.environ.get("APP_BASE", SCRIPT_DIR.parent)).resolve()
DOCS_DIR   = Path(os.environ.get("DOCS_DIR", APP_BASE / "docs")).resolve()

FILES_TO_DELETE = [
    DOCS_DIR / "updated_file.xlsx",
    DOCS_DIR / "updated_prices.xlsx",
    DOCS_DIR / "updated_tvl.xlsx",
]

def main():
    failed = False

    for p in FILES_TO_DELETE:
        try:
            Path(p).unlink(missing_ok=True)  
        except IsADirectoryError:
            try:
                shutil.rmtree(p, ignore_errors=False)
            except Exception:
                failed = True
        except Exception:
            failed = True

    if failed:
        log_warn("Some cache files could not be removed. This can be ignored.")
    else:
        log_ok("Cache files cleared.")

if __name__ == "__main__":
    main()
