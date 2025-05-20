from dotenv import load_dotenv
import os
import requests
from openpyxl import load_workbook
import time

load_dotenv()

API_KEY = os.getenv("API_KEY")
INPUT_FILE = "../docs/updated_file.xlsx"
OUTPUT_FILE = "../docs/updated_prices.xlsx"
SHEET_NAME = "ONCHAIN"
START_ROW = 5
SYMBOL_COL = 'C'
PRICE_COL = 'F'
STOP_EMPTY_LIMIT = 10
REQUEST_DELAY = 2.1

CMC_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
HEADERS = {"X-CMC_PRO_API_KEY": API_KEY}

wb = load_workbook(INPUT_FILE)
ws = wb[SHEET_NAME]

row = START_ROW
empty_count = 0

while empty_count < STOP_EMPTY_LIMIT:
    cell = ws[f"{SYMBOL_COL}{row}"]
    symbol = cell.value

    if symbol is None:
        empty_count += 1
    elif str(symbol).strip().upper() == "SYMBOLS":
        row += 1
        continue
    else:
        empty_count -= 1
        try:
            params = {"symbol": str(symbol).strip().upper(), "convert": "USD"}
            response = requests.get(CMC_URL, headers=HEADERS, params=params)
            data = response.json()

            price = data["data"][symbol.upper()]["quote"]["USD"]["price"]
            ws[f"{PRICE_COL}{row}"] = price
            print(f"✅ {symbol}: ${price:.2f} successfuly imported")

        except Exception as error:
            print(f"❌ Error fetching {symbol}: {error}")

        time.sleep(REQUEST_DELAY)
    
    row += 1

wb.save(OUTPUT_FILE)
print(f"✅ Successfuly updated prices in filename: {OUTPUT_FILE}")

