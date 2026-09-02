#!/usr/bin/env python3
"""
Derive the anchors for the 0-100 display scale from the model's real behaviour.

The dashboard shows a 0-100 risk score, but the autoencoder's reconstruction
error never approaches 0: over the replay dataset it sits between roughly 0.16
and 1.8, clustered around 0.37. Mapping that linearly from zero would waste the
bottom of the scale and park the median right on the warning line, so the score
is anchored on the observed distribution instead:

    error <= threshold : 0  .. 60   linear from DISPLAY_SCALE_MIN_ERROR
    error >  threshold : 60 .. 100  linear up to DISPLAY_SCALE_MAX_ERROR

This script recomputes those anchors (a low and a high percentile of the error
distribution) so they can be refreshed if the model is retrained. It only
reports numbers; update src/lib/constants.ts by hand.

Usage:
    pip install h5py numpy
    python scripts/calibrate_display_scale.py --secom-data path/to/secom.data
"""

from __future__ import annotations

import argparse
import io
import json
import zipfile
from pathlib import Path

import h5py
import numpy as np

from export_feature_space import MAX_MISSING_FRACTION, load_raw

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_REPO = REPO_ROOT.parent / "secom_failure_prediction"
DEFAULT_CSV = REPO_ROOT / "public" / "data" / "secom_cleaned_dataset.csv"

LOW_PERCENTILE = 5
HIGH_PERCENTILE = 99


def reconstruction_errors(csv_path: Path, model_repo: Path, secom_data: Path | None) -> np.ndarray:
    raw = load_raw(secom_data)
    kept = np.where(np.isnan(raw).mean(axis=0) <= MAX_MISSING_FRACTION)[0]
    minimum = np.nanmin(raw[:, kept], axis=0)
    maximum = np.nanmax(raw[:, kept], axis=0)
    span = np.where(maximum > minimum, maximum - minimum, 1.0)

    columns = raw.shape[1]
    normalized = np.genfromtxt(csv_path, delimiter=",", skip_header=1, usecols=range(1, columns + 1))
    samples = normalized[:, kept] * span + minimum

    scaler = json.loads((model_repo / "training" / "scaler_params.json").read_text(encoding="utf-8"))
    scaled = ((samples - np.asarray(scaler["mean"])) / np.asarray(scaler["scale"])).astype(np.float32)

    archive = zipfile.ZipFile(model_repo / "models" / "secom_autoencoder_model.keras")
    weights = h5py.File(io.BytesIO(archive.read("model.weights.h5")), "r")
    config = json.loads(archive.read("config.json"))["config"]

    activations = scaled
    for layer in config["layers"]:
        if layer["class_name"] != "Dense":
            continue
        name = layer["config"]["name"]
        activations = (
            activations @ np.asarray(weights[f"layers/{name}/vars/0"])
            + np.asarray(weights[f"layers/{name}/vars/1"])
        )
        if layer["config"]["activation"] == "relu":
            activations = np.maximum(activations, 0)

    return np.mean(np.abs(activations - scaled), axis=1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--secom-data", type=Path, default=None, help="Local copy of secom.data.")
    parser.add_argument("--model-repo", type=Path, default=DEFAULT_MODEL_REPO)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--threshold", type=float, default=0.45)
    args = parser.parse_args()

    errors = reconstruction_errors(args.csv, args.model_repo, args.secom_data)

    low = float(np.percentile(errors, LOW_PERCENTILE))
    high = float(np.percentile(errors, HIGH_PERCENTILE))

    print(f"samples: {errors.size}")
    print(f"  min {errors.min():.4f}  median {np.median(errors):.4f}  max {errors.max():.4f}")
    print(f"  p{LOW_PERCENTILE} {low:.4f}   p{HIGH_PERCENTILE} {high:.4f}")
    print()
    # Round outward to the nearest 0.05 so fewer samples clamp at the ends.
    anchor_low = np.floor(low * 20) / 20
    anchor_high = np.ceil(high * 20) / 20

    print("Suggested constants:")
    print(f"  DISPLAY_SCALE_MIN_ERROR = {anchor_low:g}")
    print(f"  DISPLAY_SCALE_MAX_ERROR = {anchor_high:g}")
    print()
    below = 60 * (errors - anchor_low) / (args.threshold - anchor_low)
    above = 60 + 40 * (errors - args.threshold) / (anchor_high - args.threshold)
    display = np.clip(np.round(np.where(errors <= args.threshold, below, above)), 0, 100)

    print("Resulting display distribution:")
    print("  p5 %d  p25 %d  median %d  p75 %d  p95 %d" % tuple(np.percentile(display, [5, 25, 50, 75, 95])))
    print(
        "  Normal %.1f%%  Warning %.1f%%  Critical %.1f%%"
        % (
            100 * (display < 50).mean(),
            100 * ((display >= 50) & (display < 60)).mean(),
            100 * (display >= 60).mean(),
        )
    )
    print("  clamped at 0: %.1f%%   clamped at 100: %.1f%%" % (100 * (display == 0).mean(), 100 * (display == 100).mean()))


if __name__ == "__main__":
    main()
