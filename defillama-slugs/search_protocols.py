#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def find_clearpool_entries(protocols):
    results = []
    for p in protocols:
        slug = p.get("slug", "").lower()
        name = p.get("name", "").lower()
        if "clearpool" in slug or "clearpool" in name:
            results.append(p)
    return results

def main():
    json_path = Path(__file__).parent / "protocols.json"
    if not json_path.exists():
        print(f"❌ File not found: {json_path}", file=sys.stderr)
        sys.exit(1)

    try:
        protocols = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}", file=sys.stderr)
        sys.exit(1)

    matches = find_clearpool_entries(protocols)
    if not matches:
        print("⚠️  No entries matching 'clearpool' found in protocols.json", file=sys.stderr)
        sys.exit(1)

    for entry in matches:
        print(json.dumps(entry, indent=2))
        print("-" * 80)

if __name__ == "__main__":
    main()
