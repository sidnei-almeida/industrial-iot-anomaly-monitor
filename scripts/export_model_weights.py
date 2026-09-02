#!/usr/bin/env python3
"""
Export the SECOM Keras autoencoder to a TypeScript module so inference can run
inside the Next.js runtime on Vercel (no Python/TensorFlow service required).

The model is a plain dense autoencoder (558 -> 128 -> 64 -> 32 -> 64 -> 128 -> 558),
so the forward pass is a handful of matrix multiplications that TypeScript can do
natively. This script reads the .keras archive directly with h5py, concatenates
every kernel/bias plus the StandardScaler parameters into a single little-endian
float32 buffer, and emits that buffer as base64 alongside a layout descriptor.

Usage:
    pip install h5py numpy
    python scripts/export_model_weights.py --source ../secom_failure_prediction

Requires, relative to --source:
    models/secom_autoencoder_model.keras
    training/scaler_params.json
    training/secom_autoencoder_metadata.json
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import zipfile
from pathlib import Path

import h5py
import numpy as np

DEFAULT_SOURCE = Path(__file__).resolve().parents[2] / "secom_failure_prediction"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "model" / "weights.ts"


def load_layers(keras_path: Path) -> tuple[list[dict], list[np.ndarray]]:
    """Read the layer graph and weight tensors out of a .keras archive."""
    archive = zipfile.ZipFile(keras_path)
    config = json.loads(archive.read("config.json"))["config"]

    dense_layers = [
        layer for layer in config["layers"] if layer["class_name"] == "Dense"
    ]
    unsupported = [
        layer["class_name"]
        for layer in config["layers"]
        if layer["class_name"] not in {"Dense", "InputLayer"}
    ]
    if unsupported:
        raise SystemExit(
            f"Unsupported layer types for the TypeScript runtime: {sorted(set(unsupported))}"
        )

    weights_file = h5py.File(io.BytesIO(archive.read("model.weights.h5")), "r")

    layout: list[dict] = []
    tensors: list[np.ndarray] = []

    for layer in dense_layers:
        name = layer["config"]["name"]
        activation = layer["config"]["activation"]
        if activation not in {"relu", "linear"}:
            raise SystemExit(f"Unsupported activation '{activation}' on layer '{name}'.")

        kernel = np.asarray(weights_file[f"layers/{name}/vars/0"], dtype=np.float32)
        bias = np.asarray(weights_file[f"layers/{name}/vars/1"], dtype=np.float32)

        layout.append(
            {
                "name": name,
                "inputSize": int(kernel.shape[0]),
                "outputSize": int(kernel.shape[1]),
                "activation": activation,
            }
        )
        # Row-major (inputSize x outputSize): out[j] = sum_i x[i] * kernel[i][j]
        tensors.append(kernel.reshape(-1))
        tensors.append(bias)

    return layout, tensors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help="Path to the secom_failure_prediction checkout (default: sibling directory).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="TypeScript file to write (default: src/lib/model/weights.ts).",
    )
    args = parser.parse_args()

    keras_path = args.source / "models" / "secom_autoencoder_model.keras"
    scaler_path = args.source / "training" / "scaler_params.json"
    metadata_path = args.source / "training" / "secom_autoencoder_metadata.json"

    for path in (keras_path, scaler_path, metadata_path):
        if not path.exists():
            raise SystemExit(f"Missing required file: {path}")

    layout, tensors = load_layers(keras_path)

    scaler = json.loads(scaler_path.read_text(encoding="utf-8"))
    scaler_mean = np.asarray(scaler["mean"], dtype=np.float32)
    scaler_scale = np.asarray(scaler["scale"], dtype=np.float32)
    n_features = int(scaler["n_features_in"])

    if layout[0]["inputSize"] != n_features or layout[-1]["outputSize"] != n_features:
        raise SystemExit(
            f"Scaler expects {n_features} features but the model maps "
            f"{layout[0]['inputSize']} -> {layout[-1]['outputSize']}."
        )
    if scaler_mean.shape != (n_features,) or scaler_scale.shape != (n_features,):
        raise SystemExit("Scaler mean/scale length does not match n_features_in.")

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    performance = metadata.get("final_performance_on_test_set", {})

    # Buffer order: scaler mean, scaler scale, then kernel/bias per layer.
    buffer = np.concatenate(
        [scaler_mean, scaler_scale, *tensors]
    ).astype("<f4", copy=False)
    encoded = base64.b64encode(buffer.tobytes()).decode("ascii")

    descriptor = {
        "featureCount": n_features,
        "defaultThreshold": metadata.get("final_anomaly_threshold", 0.45),
        "modelType": metadata.get("model_type", "Autoencoder"),
        "projectName": metadata.get("project_name", "SECOM Anomaly Detection"),
        "kerasVersion": json.loads(
            zipfile.ZipFile(keras_path).read("metadata.json")
        ).get("keras_version"),
        "metrics": {
            "precisionAnomaly": performance.get("precision_for_anomaly"),
            "recallAnomaly": performance.get("recall_for_anomaly"),
            "f1Anomaly": performance.get("f1_score_for_anomaly"),
            "accuracy": performance.get("accuracy"),
        },
        "layers": layout,
    }

    wrapped = "\n".join(
        encoded[index : index + 120] for index in range(0, len(encoded), 120)
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "// AUTO-GENERATED by scripts/export_model_weights.py — do not edit by hand.\n"
        f"// Source: {keras_path.name} (Keras {descriptor['kerasVersion']}), "
        f"{buffer.size} float32 values.\n\n"
        "import type { ModelDescriptor } from \"./types\";\n\n"
        f"export const MODEL_DESCRIPTOR: ModelDescriptor = {json.dumps(descriptor, indent=2)} as const;\n\n"
        "/** Little-endian float32 buffer: scaler mean, scaler scale, then kernel + bias per layer. */\n"
        "export const MODEL_WEIGHTS_BASE64 = `\n"
        + wrapped
        + "`.replace(/\\s+/g, \"\");\n",
        encoding="utf-8",
    )

    print(f"Wrote {args.output} ({args.output.stat().st_size / 1024:.0f} KB)")
    print(f"  features: {n_features}")
    print(f"  layers:   {' -> '.join(str(l['inputSize']) for l in layout)} -> {layout[-1]['outputSize']}")
    print(f"  floats:   {buffer.size}")


if __name__ == "__main__":
    main()
