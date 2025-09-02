from __future__ import annotations

import os
import time
import argparse
from pathlib import Path

import requests
from dotenv import load_dotenv
from openpyxl import load_workbook
from typing import Optional

def log_ok(msg):   print(f"[OK] {msg}",   flush=True)
def log_info(msg): print(f"[INFO] {msg}", flush=True)
def log_warn(msg): print(f"[WARN] {msg}", flush=True)
def log_err(msg):  print(f"[ERR] {msg}",  flush=True)

SCRIPT_DIR = Path(__file__).resolve().parent              
ROOT_DIR   = SCRIPT_DIR.parent                            
DOCS_DIR   = ROOT_DIR / "docs"                            

load_dotenv(ROOT_DIR / ".env")
load_dotenv(SCRIPT_DIR / ".env")  

API_KEY = os.getenv("API_KEY")

CMC_URL  = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
HEADERS  = {"X-CMC_PRO_API_KEY": API_KEY}

SHEET_NAME       = "PERFORMANCE_TABLE"
START_ROW        = 2
SYMBOL_COL       = "C"
PRICE_COL        = "E"
STOP_EMPTY_LIMIT = 10
REQUEST_DELAY    = 2.1 

YELLOW_RGB = "FFFF00"

def _color_hex6(fg) -> Optional[str]:
    if not fg:
        return None

    for attr in ("rgb", "value"):
        v = getattr(fg, attr, None)
        if v:
            try:
                s = str(v).strip().upper()
            except Exception:
                continue
            if len(s) == 8:
                s = s[-6:]
            if len(s) == 6:
                return s

    idx = getattr(fg, "indexed", None)
    if isinstance(idx, int) and idx == 6:
        return YELLOW_RGB
    
    return None

def is_yellow(cell) -> bool:
    fill = getattr(cell, "fill", None)
    if not fill or getattr(fill, "fill_type", None) != "solid":
        return False

    fg = getattr(fill, "fgColor", None)
    hex6 = _color_hex6(fg)
    return hex6 == YELLOW_RGB

def smart_round(price: float) -> float:
    if price >= 0.01:
        return round(price, 2)
    decimals = 4
    while round(price, decimals) == 0 and decimals < 12:
        decimals += 1
    return round(price, decimals)

def fetch_cmc_price(symbol: str) -> float | None:
    params = {"symbol": symbol, "convert": "USD"}
    r = requests.get(CMC_URL, headers=HEADERS, params=params, timeout=20)
    data = r.json() if r.content else {}
    try:
        return data["data"][symbol]["quote"]["USD"]["price"]
    except Exception:
        return None

def run(input_path: Path, output_path: Path) -> None:
    if not API_KEY:
        raise SystemExit("API_KEY is missing. Put it in .env at repo root or scripts/.")

    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    wb = load_workbook(str(input_path))
    if SHEET_NAME not in wb.sheetnames:
        raise SystemExit(f"Sheet '{SHEET_NAME}' not found in {input_path.name}")
    ws = wb[SHEET_NAME]

    row = START_ROW
    empty_count = 0

    while empty_count < STOP_EMPTY_LIMIT:
        symbol_cell = ws[f"{SYMBOL_COL}{row}"]
        price_cell  = ws[f"{PRICE_COL}{row}"]
        symbol      = symbol_cell.value

        if symbol is None:
            empty_count += 1
        else:
            ticker = str(symbol).strip().upper()
            if ticker == "TICKER":
                row += 1
                continue

            if not is_yellow(price_cell):
                log_warn(f"Skipping row {row} (not yellow)")
            else:
                empty_count = 0
                try:
                    price = fetch_cmc_price(ticker)
                    if price is not None:
                        rounded = smart_round(price)
                        price_cell.value = rounded
                        log_ok(f"{ticker}: ${rounded} successfully imported")
                    else:
                        log_warn(f"Symbol {ticker} not found in CMC response.")
                except Exception as e:
                    log_err(f"Error fetching {ticker}: {e}")

                time.sleep(REQUEST_DELAY)

        row += 1

    wb.save(str(output_path))
    log_ok(f"Successfully updated prices in: {output_path}")

def parse_args():
    p = argparse.ArgumentParser(description="Update yellow prices in PERFORMANCE_TABLE.")
    p.add_argument("--input",  type=Path, default=DOCS_DIR / "Weekly_Performance_PORTFOLIO.xlsx",
                   help="Path to input Weekly_Performance_PORTFOLIO.xlsx")
    p.add_argument("--output", type=Path, default=DOCS_DIR / "Weekly_Performance_PORTFOLIO_latest.xlsx",
                   help="Path to output workbook")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run(args.input, args.output)
