#!/usr/bin/env python3
"""
Script to set up voice samples from a folder containing many voice files.
This script will copy or link voice files from a source directory to the voice_samples directory.
"""

import os
import sys
import shutil
import argparse
from pathlib import Path

def setup_voice_samples(source_dir, target_dir, max_files=None, symlink=False):
    """
    Copy or symlink voice files from source_dir to target_dir
    
    Args:
        source_dir: Directory containing voice files
        target_dir: Directory to copy/link files to (voice_samples)
        max_files: Maximum number of files to process (None = all)
        symlink: If True, create symlinks instead of copying files
    """
    # Create target directory if it doesn't exist
    os.makedirs(target_dir, exist_ok=True)
    
    # Get all audio files in the source directory
    audio_files = []
    for ext in ['.mp3', '.wav']:
        audio_files.extend(list(Path(source_dir).glob(f'**/*{ext}')))
    
    # Limit number of files if specified
    if max_files and len(audio_files) > max_files:
        audio_files = audio_files[:max_files]
    
    print(f"Found {len(audio_files)} audio files in {source_dir}")
    
    # Process each file
    for i, file_path in enumerate(audio_files):
        # Create a simple numbered filename if needed
        target_filename = file_path.name
        
        # Ensure unique filenames by adding index if needed
        if (Path(target_dir) / target_filename).exists():
            base_name = file_path.stem
            extension = file_path.suffix
            target_filename = f"{base_name}_{i}{extension}"
        
        target_path = Path(target_dir) / target_filename
        
        # Copy or symlink the file
        if symlink:
            # Use relative path for symlink if possible
            try:
                target_path.symlink_to(file_path.resolve())
                print(f"Created symlink: {target_path} -> {file_path}")
            except Exception as e:
                print(f"Error creating symlink for {file_path}: {e}")
        else:
            try:
                shutil.copy2(file_path, target_path)
                print(f"Copied: {file_path} -> {target_path}")
            except Exception as e:
                print(f"Error copying {file_path}: {e}")
    
    print(f"\nDone! {len(audio_files)} voice samples are now available in {target_dir}")

def main():
    parser = argparse.ArgumentParser(description="Set up voice samples for the Breeze Celebrity Sounds app")
    parser.add_argument("source_dir", help="Directory containing voice files")
    parser.add_argument("--max", type=int, help="Maximum number of files to process")
    parser.add_argument("--symlink", action="store_true", help="Create symlinks instead of copying files")
    args = parser.parse_args()
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Target directory is voice_samples in the same directory as this script
    target_dir = os.path.join(script_dir, "voice_samples")
    
    # Process the files
    setup_voice_samples(args.source_dir, target_dir, args.max, args.symlink)

if __name__ == "__main__":
    main()
