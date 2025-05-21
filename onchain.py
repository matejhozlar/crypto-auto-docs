import subprocess, sys, os, time

SCRIPT_DELAY = 5
SCRIPTS = [
    "scripts/onchain_rewrite_prices.py",
    "scripts/onchain_update_prices.py",
    "scripts/onchain_update_tvl.py",
    "scripts/onchain_sort_by_tvl.py",
    "scripts/clean_up.py",
]

def main():
    for i, relpath in enumerate(SCRIPTS):
        script_path = os.path.abspath(relpath)
        script_dir  = os.path.dirname(script_path)
        print(f"⌛ Running {relpath} in {script_dir}…")
        ret = subprocess.call(
            [sys.executable, script_path],
            cwd=script_dir
        )
        if ret != 0:
            print(f"❌ {relpath} failed with {ret}", file=sys.stderr)
            sys.exit(ret)
        if i < len(SCRIPTS)-1:
            time.sleep(SCRIPT_DELAY)
    print("✅ All onchain scripts completed successfully.")

if __name__=="__main__":
    main()
