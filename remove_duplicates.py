#!/usr/bin/env python3
"""
Script to remove duplicate spells from markdown files.
This script identifies and removes perfect duplicates in spell documents.
"""

import os
import re
from pathlib import Path

def remove_duplicates_from_file(file_path):
    """Remove duplicate spells from a markdown file."""
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by ### headers to get individual spells
    sections = content.split('### ')
    
    if len(sections) <= 1:
        print(f"No spells found in {file_path}")
        return
    
    # Remove empty first section if it exists
    if not sections[0].strip():
        sections = sections[1:]
    
    # Track seen spells
    seen_spells = set()
    unique_sections = []
    duplicates_removed = 0
    
    for section in sections:
        if not section.strip():
            continue
            
        # Get the spell name (first line)
        lines = section.strip().split('\n')
        if not lines:
            continue
            
        spell_name = lines[0].strip()
        
        # Create a normalized version for comparison
        normalized_section = section.strip()
        
        if normalized_section in seen_spells:
            print(f"  Found duplicate: {spell_name}")
            duplicates_removed += 1
        else:
            seen_spells.add(normalized_section)
            unique_sections.append(section)
    
    if duplicates_removed > 0:
        # Reconstruct the file content
        new_content = '### ' + '### '.join(unique_sections)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  Removed {duplicates_removed} duplicate spells from {file_path}")
    else:
        print(f"  No duplicates found in {file_path}")

def main():
    """Main function to process all spell documents."""
    documents_dir = Path("frontend/public/documents")
    
    if not documents_dir.exists():
        print(f"Documents directory not found: {documents_dir}")
        return
    
    # Process all spell markdown files
    spell_files = [
        "spells_a_d.md",
        "spells_e_h.md", 
        "spells_i_p.md",
        "spells_q_t.md",
        "spells_u_z.md"
    ]
    
    for filename in spell_files:
        file_path = documents_dir / filename
        if file_path.exists():
            remove_duplicates_from_file(file_path)
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    main()

