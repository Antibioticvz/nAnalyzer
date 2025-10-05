"""
Script to download required ML models
"""
import os
import sys
import zipfile
import urllib.request
from pathlib import Path

def download_models():
    """Download and cache ML models"""
    models_dir = Path("./models/vosk")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("Downloading Vosk speech recognition models...")
    print("This may take a few minutes depending on your internet connection.\n")
    
    # Vosk model URLs
    models = {
        "vosk-model-small-ru-0.22": "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip",
        "vosk-model-small-en-us-0.15": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    }
    
    for model_name, model_url in models.items():
        model_path = models_dir / model_name
        
        if model_path.exists():
            print(f"✓ {model_name} already exists")
            continue
            
        print(f"Downloading {model_name}...")
        zip_path = models_dir / f"{model_name}.zip"
        
        try:
            # Download the model
            urllib.request.urlretrieve(model_url, zip_path)
            print(f"  Downloaded {model_name}.zip")
            
            # Extract the model
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(models_dir)
            print(f"  Extracted {model_name}")
            
            # Remove the zip file
            zip_path.unlink()
            print(f"✓ {model_name} ready\n")
            
        except Exception as e:
            print(f"✗ Failed to download {model_name}: {e}")
            if zip_path.exists():
                zip_path.unlink()
            return False
    
    print("✓ All models downloaded successfully!")
    print(f"Models cached in: {models_dir.absolute()}")
    return True

if __name__ == "__main__":
    success = download_models()
    sys.exit(0 if success else 1)
