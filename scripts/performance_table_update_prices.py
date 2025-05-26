import requests
import time
from openpyxl import load_workbook
from openpyxl.styles import PatternFill
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("API_KEY")
INPUT_FILE       = "../docs/Weekly_Performance.xlsx"
OUTPUT_FILE      = "../docs/Weekly_Performance_updated.xlsx"
SHEET_NAME       = "PERFORMANCE_TABLE"
START_ROW        = 2
SYMBOL_COL       = 'C'
PRICE_COL        = 'E'
STOP_EMPTY_LIMIT = 10
REQUEST_DELAY    = 2.1

CMC_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
HEADERS = {"X-CMC_PRO_API_KEY": API_KEY}

wb = load_workbook(INPUT_FILE)
ws = wb[SHEET_NAME]

row = START_ROW
empty_count = 0

YELLOW_FILL_HEX = "FFFF00"

def smart_round(price):
    if price >= 0.01:
        return round(price, 2)
    else:
        decimals = 4
        while round(price, decimals) == 0 and decimals < 12:
            decimals += 1
        return round(price, decimals)

def is_yellow(cell):
    fill = cell.fill
    if not fill or not isinstance(fill.fill_type, str):
        return False
    fg_color = fill.fgColor.rgb or fill.fgColor.indexed
    return fg_color and YELLOW_FILL_HEX in fg_color

while empty_count < STOP_EMPTY_LIMIT:
    symbol_cell = ws[f"{SYMBOL_COL}{row}"]
    price_cell = ws[f"{PRICE_COL}{row}"]
    symbol = symbol_cell.value

    if symbol is None:
        empty_count += 1
    elif str(symbol).strip().upper() == "TICKER":
        row += 1
        continue
    elif not is_yellow(price_cell):
        print(f"Skipping row {row} (not yellow)")
    else:
        empty_count = 0
        symbol_clean = str(symbol).strip().upper()
        try:
            params = {"symbol": symbol_clean, "convert": "USD"}
            response = requests.get(CMC_URL, headers=HEADERS, params=params)
            data = response.json()

            if "data" in data and symbol_clean in data["data"]:
                price = data["data"][symbol_clean]["quote"]["USD"]["price"]
                rounded_price = smart_round(price)
                price_cell.value = rounded_price
                print(f"✅ {symbol}: ${rounded_price} successfuly imported")
            else:
                print(f"❌ Symbol {symbol_clean} not found.")

        except Exception as error:
            print(f"❌ Error fetching {symbol_clean}: {error}")

        time.sleep(REQUEST_DELAY)

    row += 1

wb.save(OUTPUT_FILE)
print(f"✅ Successfuly updated prices in filename: {OUTPUT_FILE}")