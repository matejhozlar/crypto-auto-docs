# Crypto Auto Docs

**Crypto Auto Docs** is a cross‑platform automation suite for keeping your cryptocurrency portfolio spreadsheets accurate and current. The project combines a powerful set of **Python scripts** with an **Electron desktop application** that wraps those scripts in a user‑friendly GUI. Whether you prefer a command line workflow or a point‑and‑click interface, Crypto Auto Docs handles the repetitive work of fetching token prices, Total Value Locked (TVL) data, and generating performance tables.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts Overview](#scripts-overview)
- [Desktop Application](#desktop-application)
- [Data Sources](#data-sources)
- [Project Structure](#project-structure)
- [Workflows](#workflows)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### CLI Toolkit (Python)

- Update token prices directly in Excel spreadsheets.
- Fetch TVL (Total Value Locked) via DefiLlama API.
- Rewrite outdated or monthly prices with fresh data.
- Sort portfolio by TVL.
- Generate detailed performance tables.
- Cleanup and normalize Excel outputs.

### Desktop GUI (Electron)

- Cross‑platform desktop app (Windows, macOS, Linux).
- One‑click buttons to trigger Python scripts.
- Live logs and progress indicators.
- Built with Electron Forge for packaging and distribution.
- Ships with appdata (example spreadsheets and scripts) bundled.

### Automated Workflows

- **Weekly Updates:** refresh performance sheets.
- **Monthly Updates:** rewrite monthly historical prices.
- **Custom Scripts:** extend or combine workflows.

---

## Architecture

- **Python layer**: business logic for API calls (CoinGecko, DefiLlama), Excel manipulation, portfolio metrics.
- **Node/Electron layer**: manages GUI, runs Python workers, packages everything into installers.
- **Shared data**: `defillama-slugs` JSON files map protocol/chain identifiers for API calls.

---

## Requirements

### CLI

- Python 3.9+
- `pip install -r requirements.txt`
- `.env` file with API keys (e.g., CoinGecko).

### Desktop App

- Node.js v18+
- npm or yarn
- Electron Forge (pre‑configured)

---

## Installation

### CLI

```bash
git clone https://github.com/matejhozlar/crypto-auto-docs.git
cd crypto-auto-docs
python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### Desktop

```bash
cd crypto-auto-docs/desktop
npm install
npm run make   # builds installers for your OS
```

---

## Usage

### CLI Examples

```bash
# Update token prices in Excel
python scripts/onchain_update_prices.py updated_file.xlsx

# Update TVL values
python scripts/onchain_update_tvl.py updated_file.xlsx

# Rewrite outdated prices
python scripts/onchain_rewrite_prices.py monthly_file.xlsx

# Sort by TVL
python scripts/onchain_sort_by_tvl.py updated_file.xlsx

# Update performance table
python scripts/performance_table_update_prices.py performance.xlsx

# Clean up old/generated files
python scripts/clean_up.py
```

### Desktop App

```bash
npm start   # run in dev mode
```

Or use the packaged installer (`out/make/…`) to run as a standalone app.

From the GUI you can:

- Update Prices
- Update TVL
- Rewrite Prices
- Sort by TVL
- Update Performance Table
- View logs & download results

---

## Scripts Overview

- **onchain_update_prices.py** → fetches live token prices (CoinGecko) into Excel.
- **onchain_update_tvl.py** → updates TVL per protocol/chain (DefiLlama).
- **onchain_rewrite_prices.py** → rewrites outdated monthly prices.
- **onchain_sort_by_tvl.py** → sorts portfolio by TVL.
- **performance_table_update_prices.py** → updates weekly/monthly performance tables.
- **clean_up.py** → utility script to clean generated/temp files.

---

## Desktop Application

- **main.js** → Electron entry point, creates BrowserWindow, spawns Python workers.
- **preload.cjs** → exposes safe APIs to the renderer.
- **renderer.html** → main UI template.
- **renderer.js** → controls UI events, logs, progress handling.
- **prepare-appdata.js** → bundles Python scripts and docs into packaged app.
- **styles.css** → provides modern, clean styling.
- **assets/** → application icons (icns, ico, png).

---

## Data Sources

- **CoinGecko API** → token prices.
- **DefiLlama API** → TVL, protocols, and chains.
- **defillama-slugs/** → JSON mappings (`chains.json`, `protocols.json`, `defillama_symbol_to_slug.json`) ensure consistent identifiers.

---

## Project Structure

```
crypto-auto-docs/
├── defillama-slugs/
│   ├── chains.json
│   ├── protocols.json
│   ├── defillama_symbol_to_slug.json
│   └── search_protocols.py
│
├── scripts/                     # Python CLI scripts
│   ├── onchain_update_prices.py
│   ├── onchain_update_tvl.py
│   ├── onchain_rewrite_prices.py
│   ├── onchain_sort_by_tvl.py
│   ├── performance_table_update_prices.py
│   └── clean_up.py
│
├── desktop/                     # Electron app
│   ├── main.js
│   ├── preload.cjs
│   ├── renderer.html
│   ├── scripts/
│   │   ├── renderer.js
│   │   └── prepare-appdata.js
│   ├── styles/styles.css
│   ├── assets/
│   │   ├── icon.icns | ico | png
│   └── appdata/ (bundled docs + scripts)
│
├── onchain.py                   # Orchestrator script
├── sync-env.js                  # Sync env variables between layers
├── generate-structure.js        # Helper to scaffold project
└── README.md
```

---

## Workflows

- **macOS build**: see `.github/workflows/macos-build.yml`
- **Windows build**: see `.github/workflows/windows-build.yml`
- Uses Electron Forge to package app per OS.
- Bundles Python scripts and defillama datasets.
