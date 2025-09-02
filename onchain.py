import os
import sys
import time
import runpy
from pathlib import Path

BASE = Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parent))

sys.path.insert(0, str(BASE))
sys.path.insert(0, str(BASE / 'scripts'))

import scripts.onchain_rewrite_prices  
import scripts.onchain_update_prices   
import scripts.onchain_update_tvl      
import scripts.onchain_sort_by_tvl     
import scripts.clean_up

def log_ok(msg):   print(f"[OK] {msg}",   flush=True)
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)
def log_err(msg):  print(f"[ERR] {msg}",  flush=True)

SCRIPT_DELAY = 5

MODULES = [
    ("scripts.onchain_rewrite_prices", "Rewriting prices..."),
    ("scripts.onchain_update_prices",  "Updating prices..."),
    ("scripts.onchain_update_tvl",     "Updating TVL..."),
    ("scripts.onchain_sort_by_tvl",    "Sorting rows by TVL..."),
    ("scripts.clean_up",               "Cleaning up..."),
]

def main():
    for i, (mod_name, message) in enumerate(MODULES):
        if message:
            log_info(message)
        try:
            runpy.run_module(mod_name, run_name="__main__")
        except SystemExit as e:
            code = e.code if isinstance(e.code, int) else 1
            log_err(f"Failed with {code}")
            sys.exit(code)
        except Exception as e:
            log_err(f"Failed with {e}")
            sys.exit(1)
        if i < len(MODULES) - 1:
            time.sleep(SCRIPT_DELAY)
    log_ok("All onchain scripts completed successfully.")

if __name__ == "__main__":
    main()
