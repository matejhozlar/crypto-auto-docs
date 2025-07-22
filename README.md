# Crypto Auto Docs

**Crypto Auto Docs** is a Python-based toolkit that automates the updating of cryptocurrency portfolio documentation. It fetches live data (like token prices and Total Value Locked) from external APIs and updates Excel spreadsheets accordingly. This project is designed for crypto enthusiasts, analysts, or developers who maintain portfolio trackers or on-chain analytics in Excel.

## Project Purpose

The primary goal of Crypto Auto Docs is to eliminate manual data entry and keep crypto portfolio documents up-to-date with the latest market and on-chain data. It achieves this by:

- Fetching live cryptocurrency prices from the CoinMarketCap API.
- Fetching on-chain TVL data from the DefiLlama API.
- Automating spreadsheet operations like copying values, sorting by TVL, and data cleanup.
- Streamlining portfolio reporting for both analysts and developers.

## Technologies and Dependencies

- **Python 3**
- **Libraries**:

  - `requests`
  - `openpyxl`
  - `python-dotenv`

- **APIs**:

  - **CoinMarketCap API** (requires API key)
  - **DefiLlama API** (no key required)

- **Node.js** (optional, for syncing environment variables)

## Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone https://github.com/matejhozlar/crypto-auto-docs.git
   cd crypto-auto-docs
   ```

2. **Create a Virtual Environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**

   ```bash
   pip install requests python-dotenv openpyxl
   ```

4. **Create a `.env` File**

   ```env
   API_KEY=YOUR_COINMARKETCAP_API_KEY
   ```

5. **Sync `.env` File to Scripts Directory**

   - Option A: Use the provided script:

     ```bash
     node sync-env.js
     ```

   - Option B: Manually copy `.env` into the `scripts/` folder.

6. **Verify Input Files**

   - Ensure `docs/Monthly_Performance_CVR.xlsx` and `docs/Weekly_Performance_PORTFOLIO.xlsx` are formatted correctly with necessary sheets like `ONCHAIN` and `PERFORMANCE_TABLE`.

7. **Input Data**

   - List token/project data in `ONCHAIN` sheet starting from row 4.
   - Ensure correct `name`, `symbol`, `type`, and `slug` are provided for each entry.

## Usage Examples

### Full On-Chain Update Pipeline

```bash
python onchain.py
```

This will:

- Rewrite prices from the monthly file
- Update prices via CoinMarketCap
- Update TVL via DefiLlama
- Sort by TVL
- Save results to `Weekly_Performance_updated.xlsx`

### Update Weekly Performance Table

```bash
python scripts/performance_table_update_prices.py
```

Updates yellow-highlighted tickers in `Weekly_Performance_PORTFOLIO.xlsx` with latest prices. Outputs to a new `_latest.xlsx` file.

### Utility Scripts

- `search_protocols.py`: Search for DefiLlama protocol slugs
- `onchain_update_prices.py`, `onchain_update_tvl.py`, etc. can be run individually if needed.

## Contribution Guidelines

- **Issues & Features**: Submit via GitHub Issues
- **Pull Requests**: Fork, branch, test, and submit with clear descriptions
- **Code Style**: Follow PEP8, write clean and readable Python code
- **Testing**: Test with sample Excel files before submitting
- **Documentation**: Update README or inline comments for significant changes

---

Crypto Auto Docs saves time by automating tedious updates in crypto spreadsheets. Whether you're an analyst keeping track of DeFi data or a developer wanting to extend the tool, this project is built to serve both efficiently.

Happy tracking!
