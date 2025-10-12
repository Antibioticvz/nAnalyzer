#!/usr/bin/env python3
"""Voice model demo script.

Train the Gaussian Mixture speaker identification model using sample WAV
recordings and optionally evaluate additional clips to verify predictions.

Usage examples:

    python scripts/voice_model_demo.py --train-dir data/uploads/my_user/train \
        --save-path models/voice/my_user.pkl --evaluate data/uploads/my_user/check.wav

    python scripts/voice_model_demo.py --train sample1.wav sample2.wav sample3.wav \
        sample4.wav sample5.wav
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable, List

import numpy as np
import soundfile as sf

# Ensure backend package is importable when running from repo root
REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # noqa: E402
from app.ml.audio_processing import extract_mfcc  # noqa: E402
from app.ml.speaker_id import (  # noqa: E402
    identify_speaker,
    save_model,
    train_user_voice_model,
)


def collect_training_files(values: Iterable[str], directory: str | None) -> List[Path]:
    files: List[Path] = []

    if directory:
        dir_path = Path(directory).expanduser().resolve()
        if not dir_path.exists():
            raise FileNotFoundError(f"Training directory not found: {dir_path}")
        files.extend(sorted(dir_path.glob("*.wav")))

    for value in values or []:
        files.append(Path(value).expanduser().resolve())

    # Deduplicate in original order
    seen: set[Path] = set()
    unique: List[Path] = []
    for file_path in files:
        if file_path in seen:
            continue
        if not file_path.exists():
            raise FileNotFoundError(f"Training file not found: {file_path}")
        unique.append(file_path)
        seen.add(file_path)

    return unique


def load_audio_bytes(file_path: Path) -> bytes:
    return file_path.read_bytes()


def load_audio_array(file_path: Path) -> tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(file_path)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    return audio.astype(np.float32), int(sample_rate)


def resample_if_needed(audio: np.ndarray, sample_rate: int, target_rate: int) -> np.ndarray:
    if sample_rate == target_rate:
        return audio

    # Lazy import to avoid unnecessary dependency load if not required
    import librosa

    return librosa.resample(audio, orig_sr=sample_rate, target_sr=target_rate)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and evaluate the speaker model")
    parser.add_argument(
        "--train",
        nargs="*",
        default=None,
        help="Explicit WAV files to use for training (need at least five in total)",
    )
    parser.add_argument(
        "--train-dir",
        default=None,
        help="Directory containing additional training WAV files",
    )
    parser.add_argument(
        "--evaluate",
        nargs="*",
        default=None,
        help="Optional WAV files to score after training",
    )
    parser.add_argument(
        "--save-path",
        default=None,
        help="Optional path to persist the trained model (defaults to models/voice/demo_user.pkl)",
    )

    args = parser.parse_args()

    training_files = collect_training_files(args.train or [], args.train_dir)

    if len(training_files) < 5:
        raise SystemExit(
            f"Need at least five training clips (got {len(training_files)}). "
            "Provide more paths via --train or --train-dir."
        )

    print("Training speaker model on the following clips:")
    for path in training_files:
        print(f"  • {path}")

    audio_samples = [load_audio_bytes(path) for path in training_files]
    model = train_user_voice_model(audio_samples, sample_rate=settings.SAMPLE_RATE)

    default_output = Path(settings.MODELS_DIR) / "voice" / "demo_user.pkl"
    output_path = Path(args.save_path).expanduser().resolve() if args.save_path else default_output

    save_model(model, str(output_path))
    print(f"\nModel saved to: {output_path}")
    print(f"Calibrated threshold: {model['threshold']:.4f}")

    if not args.evaluate:
        return

    print("\nEvaluation results:")
    for eval_path_raw in args.evaluate:
        eval_path = Path(eval_path_raw).expanduser().resolve()
        if not eval_path.exists():
            print(f"  • {eval_path}: file not found")
            continue

        audio_array, sr = load_audio_array(eval_path)
        audio_array = resample_if_needed(audio_array, sr, settings.SAMPLE_RATE)
        mfcc = extract_mfcc(audio_array, settings.SAMPLE_RATE)
        predicted = identify_speaker(mfcc.T, model)
        print(f"  • {eval_path}: {predicted}")


if __name__ == "__main__":
    main()
