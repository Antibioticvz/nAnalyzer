#!/usr/bin/env python3
"""
Script to fix test files to use the new httpx AsyncClient API with fixtures
"""
import os
import re
from pathlib import Path


def fix_test_file(filepath):
    """Fix a single test file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Remove the AsyncClient and app imports
    content = re.sub(r'from httpx import AsyncClient\n', '', content)
    content = re.sub(r'from app\.main import app\n', '', content)
    
    # Replace async with AsyncClient(app=app, base_url="http://test") as client:
    # with just the function parameter (client)
    content = re.sub(
        r'async def (test_\w+)\(\):\n(.*?)async with AsyncClient\(app=app, base_url="http://test"\) as client:',
        r'async def \1(client):\n\2',
        content,
        flags=re.DOTALL
    )
    
    # Fix indentation - remove 4 spaces from lines that were inside the async with block
    lines = content.split('\n')
    fixed_lines = []
    in_test_function = False
    removed_with = False
    
    for i, line in enumerate(lines):
        if line.strip().startswith('async def test_'):
            in_test_function = True
            removed_with = False
            fixed_lines.append(line)
        elif in_test_function and not removed_with:
            # Skip empty lines and docstrings until we find real code
            if line.strip() and not line.strip().startswith('"""') and not line.strip().startswith("'''"):
                # This should be the first real line of the test
                # Check if it needs dedentation (was inside async with)
                if line.startswith('        ') and not line.strip().startswith('assert'):
                    # Dedent this and following lines
                    removed_with = True
                    if len(line) >= 4:
                        fixed_lines.append(line[4:])
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        elif in_test_function and removed_with:
            # Continue dedenting until we reach another function or end
            if line and not line.strip():
                fixed_lines.append(line)
            elif line.strip().startswith('async def') or line.strip().startswith('def ') or line.strip().startswith('@'):
                in_test_function = False
                removed_with = False
                fixed_lines.append(line)
            else:
                # Dedent by 4 spaces if the line has at least 4 spaces of indentation
                if line.startswith('        '):
                    fixed_lines.append(line[4:])
                else:
                    fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    content = '\n'.join(fixed_lines)
    
    # Only write if content changed
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    return False


def main():
    """Fix all test files"""
    tests_dir = Path(__file__).parent / 'tests'
    test_files = list(tests_dir.rglob('test_*.py'))
    
    fixed_count = 0
    for test_file in test_files:
        if test_file.name == '__init__.py':
            continue
        if fix_test_file(test_file):
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} out of {len(test_files)} test files")


if __name__ == '__main__':
    main()
