import os
import sys

FILES_TO_DELETE = [
    "../docs/updated_file.xlsx",
    "../docs/updated_prices.xlsx",
    "../docs/updated_tvl.xlsx",
]

def main():
    for path in FILES_TO_DELETE:
        try:
            os.remove(path)
            print(f"✅ Deleted: {path}")
        except FileNotFoundError:
            print(f"⚠️ Not found (skipped): {path}")
        except PermissionError:
            print(f"❌ Permission denied: {path}", file=sys.stderr)
        except Exception as e:
            print(f"❌ Error deleting {path}: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()