import os
import sys
import time
import subprocess
from pathlib import Path
from scripts.common.log import log_ok, log_info, log_warn, log_err

SCRIPT_DELAY = 5  

SCRIPTS = [
    ("scripts/onchain_rewrite_prices.py", "Rewriting prices…"),
    ("scripts/onchain_update_prices.py",  "Updating prices…"),
    ("scripts/onchain_update_tvl.py",     "Updating TVL…"),
    ("scripts/onchain_sort_by_tvl.py",    "Sorting rows by TVL…"),
    ("scripts/clean_up.py",               "Cleaning up…"),
]

def script_label(relpath: str) -> str:
    """onchain_update_prices.py -> onchain_update_prices"""
    base = os.path.basename(relpath)
    return os.path.splitext(base)[0]

def main():
    for i, (relpath, message) in enumerate(SCRIPTS):
        script_path = os.path.abspath(relpath)
        script_dir  = os.path.dirname(script_path)
        
        if message:
            log_info(message)

        ret = subprocess.call([sys.executable, script_path], cwd=script_dir)

        if ret != 0:
            log_err(f"Failed with {ret}")
            sys.exit(ret)

        if i < len(SCRIPTS) - 1:
            time.sleep(SCRIPT_DELAY)

    log_ok("All onchain scripts completed successfully.")

if __name__ == "__main__":
    main()
