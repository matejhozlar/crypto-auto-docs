from __future__ import annotations
import os, sys, time
from datetime import datetime
from typing import Optional

def _emit(tag: str, msg: str, *, to_stderr: bool = False) -> None:
    prefix = f"[{tag}]"
    stream = sys.stderr if (to_stderr or tag == "ERR") else sys.stdout
    print(f"{prefix} {msg}", file=stream, flush=True)

def log_ok(msg: str)   -> None: _emit("OK",   msg)
def log_info(msg: str) -> None: _emit("INFO", msg)
def log_warn(msg: str) -> None: _emit("WARN", msg)
def log_err(msg: str)  -> None: _emit("ERR",  msg, to_stderr=True)

class Step:
    def __init__(self, label: str): self.label, self.t0 = label, time.time()
    def done(self, extra: str = "") -> None:
        dt = time.time() - self.t0
        log_ok(f"{self.label} ✓ {dt:.2f}s{(' ' + extra) if extra else ''}")

