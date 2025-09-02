import os
import sys

def log_ok(msg):   print(f"[OK] {msg}",   flush=True)
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)
def log_err(msg):  print(f"[ERR] {msg}",  flush=True)

FILES_TO_DELETE = [
    "../docs/updated_file.xlsx",
    "../docs/updated_prices.xlsx",
    "../docs/updated_tvl.xlsx",
]

def main():
    for path in FILES_TO_DELETE:
        try:
            os.remove(path)
            log_ok(f"Deleted: {path}")
        except FileNotFoundError:
            log_warn(f"Not found (skipped): {path}")
        except PermissionError:
            log_err(f"Permission denied: {path}", file=sys.stderr)
        except Exception as e:
            log_err(f"Error deleting {path}: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()