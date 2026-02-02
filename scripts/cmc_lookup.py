from __future__ import annotations

import os
import argparse
from pathlib import Path

import requests
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent

# Load .env from repo root and scripts/ (same pattern as your main script)
load_dotenv(ROOT_DIR / ".env")
load_dotenv(SCRIPT_DIR / ".env")

API_KEY = os.getenv("API_KEY")

CMC_MAP_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map"


def log_ok(msg: str):   print(f"[OK] {msg}", flush=True)
def log_info(msg: str): print(f"[INFO] {msg}", flush=True)
def log_warn(msg: str): print(f"[WARN] {msg}", flush=True)
def log_err(msg: str):  print(f"[ERR] {msg}", flush=True)


def lookup_cmc_map(
    symbol: str,
    name_contains: str | None = None,
    slug_contains: str | None = None,
    include_inactive: bool = False,
    limit: int = 200,
):
    if not API_KEY:
        raise SystemExit("API_KEY is missing. Put it in .env at repo root or scripts/.")

    headers = {"X-CMC_PRO_API_KEY": API_KEY}

    params = {
        "symbol": symbol.strip().upper(),
        "limit": limit,
    }

    # If you want inactive included, the API supports listing_status
    # (active is default; "inactive" are delisted; "untracked" may appear too)
    if include_inactive:
        params["listing_status"] = "active,inactive,untracked"

    r = requests.get(CMC_MAP_URL, headers=headers, params=params, timeout=20)

    if r.status_code != 200:
        log_err(f"CMC HTTP {r.status_code}: {r.text[:400]}")
        return []

    data = r.json() if r.content else {}
    status = data.get("status") or {}

    if status.get("error_code", 0) != 0:
        log_err(f"CMC API error: {status.get('error_message')} (code {status.get('error_code')})")
        return []

    rows = data.get("data") or []
    if not rows:
        return []

    def _match(x) -> bool:
        if name_contains:
            n = (x.get("name") or "").lower()
            if name_contains.lower() not in n:
                return False
        if slug_contains:
            s = (x.get("slug") or "").lower()
            if slug_contains.lower() not in s:
                return False
        return True

    return [x for x in rows if _match(x)]


def print_rows(rows: list[dict], symbol: str):
    if not rows:
        log_warn(f"No results found for symbol={symbol}")
        return

    log_ok(f"Found {len(rows)} candidate(s) for symbol={symbol}:\n")

    for x in rows:
        platform = (x.get("platform") or {}).get("name")
        platform_symbol = (x.get("platform") or {}).get("symbol")
        listing_status = x.get("is_active")
        # is_active: 1 active, 0 inactive (when included)

        print(
            f"- id={x.get('id')}"
            f" | name={x.get('name')}"
            f" | symbol={x.get('symbol')}"
            f" | slug={x.get('slug')}"
            f" | rank={x.get('rank')}"
            f" | active={listing_status}"
            f" | platform={platform or '-'}{(' (' + platform_symbol + ')') if platform_symbol else ''}"
        )


def main():
    p = argparse.ArgumentParser(
        description="Lookup CoinMarketCap IDs (UCIDs) for an ambiguous ticker using /cryptocurrency/map."
    )
    p.add_argument("symbol", help="Ticker symbol to look up (e.g. LIGHT)")
    p.add_argument("--name", dest="name_contains", default=None, help="Filter results: name contains (case-insensitive)")
    p.add_argument("--slug-contains", dest="slug_contains", default=None, help="Filter results: slug contains (case-insensitive)")
    p.add_argument("--include-inactive", action="store_true", help="Include inactive/untracked listings")
    p.add_argument("--limit", type=int, default=200, help="Max results to request (default 200)")
    p.add_argument("--pick-id", type=int, default=None, help="If provided, print an override snippet for this id")
    args = p.parse_args()

    sym = args.symbol.strip().upper()
    rows = lookup_cmc_map(
        sym,
        name_contains=args.name_contains,
        slug_contains=args.slug_contains,
        include_inactive=args.include_inactive,
        limit=args.limit,
    )
    print_rows(rows, sym)

    if args.pick_id is not None:
        print("\nPaste this into your main script override map:\n")
        print("CMC_ID_OVERRIDES = {")
        print(f'    "{sym}": {args.pick_id},')
        print("}")


if __name__ == "__main__":
    main()
