#!/usr/bin/env python3
"""
File Guardian Hook - SOS Moto
Prevents creation of backup files, duplicates, and unnecessary files
Enforces clean codebase practices
"""

import json
import sys
import os
from pathlib import Path
import re

def get_existing_files():
    """Get map of existing important files in the project"""
    project_dir = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.'))
    
    # Map of files that should not be duplicated
    protected_files = {
        'logger': str(project_dir / 'lib' / 'utils' / 'logger.ts'),
        'validation': str(project_dir / 'lib' / 'utils' / 'validation.ts'),
        'firebase': str(project_dir / 'lib' / 'services' / 'firebase.ts'),
        'mercadopago.service': str(project_dir / 'lib' / 'services' / 'payment' / 'mercadopago.service.ts'),
        'email.service': str(project_dir / 'lib' / 'services' / 'notification' / 'email.service.ts'),
        'profile.service': str(project_dir / 'lib' / 'services' / 'profile' / 'profile.service.ts'),
        'qstash.service': str(project_dir / 'lib' / 'services' / 'queue' / 'qstash.service.ts'),
    }
    
    return protected_files

def is_backup_file(file_path: str) -> bool:
    """Check if file path indicates a backup file"""
    filename = os.path.basename(file_path)
    
    # Patterns that indicate backup files
    backup_patterns = [
        r'\.bak$',
        r'\.backup$',
        r'\.old$',
        r'\.orig$',
        r'\.save$',
        r'\.tmp$',
        r'^_backup_',
        r'^backup_',
        r'^old_',
        r'_backup\.',
        r'_old\.',
        r'~$',  # Unix backup files
        r'\(copy\)',
        r'\.copy$',
    ]
    
    for pattern in backup_patterns:
        if re.search(pattern, filename, re.IGNORECASE):
            return True
    
    return False

def is_duplicate_file(file_path: str) -> tuple:
    """Check if file is a duplicate of an existing file"""
    filename = os.path.basename(file_path).lower()
    file_dir = os.path.dirname(file_path)
    protected_files = get_existing_files()
    
    # Check for logger duplication
    if 'logger' in filename and '/api/' in file_path:
        return (True, 'logger', protected_files.get('logger'))
    
    # Check for validation duplication
    if 'validation' in filename and '/api/' in file_path:
        return (True, 'validation', protected_files.get('validation'))
    
    # Check for service duplications
    for key, original_path in protected_files.items():
        if key in filename and file_path != original_path:
            # Check if it's in a different location
            if os.path.exists(original_path):
                return (True, key, original_path)
    
    return (False, None, None)

def check_unnecessary_file(file_path: str) -> list:
    """Check if file is unnecessary or should not be created"""
    issues = []
    
    # Check for test/temporary files that shouldn't be committed
    temp_patterns = [
        r'test\.ts$',
        r'temp\.ts$',
        r'tmp\.ts$',
        r'\.log$',
        r'\.pid$',
        r'\.lock$',
    ]
    
    filename = os.path.basename(file_path)
    for pattern in temp_patterns:
        if re.search(pattern, filename, re.IGNORECASE):
            issues.append({
                'type': 'WARNING',
                'message': f'⚠️ WARNING: Creating temporary/test file: {filename}',
                'suggestion': 'Consider if this file is really needed. Use proper test directories.'
            })
    
    return issues

def update_agent_memory(action: str, file_path: str, blocked: bool):
    """Update agent memory with action taken"""
    try:
        state_dir = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.')) / '.claude' / 'state'
        state_dir.mkdir(parents=True, exist_ok=True)
        
        memory_file = state_dir / 'agent-memory.json'
        
        # Load existing memory
        if memory_file.exists():
            with open(memory_file, 'r') as f:
                memory = json.load(f)
        else:
            memory = {'file_operations': [], 'blocked_operations': []}
        
        # Add new entry
        entry = {
            'timestamp': __import__('datetime').datetime.now().isoformat(),
            'action': action,
            'file': file_path,
            'blocked': blocked
        }
        
        if blocked:
            memory['blocked_operations'].append(entry)
        else:
            memory['file_operations'].append(entry)
        
        # Keep only last 100 entries
        memory['file_operations'] = memory['file_operations'][-100:]
        memory['blocked_operations'] = memory['blocked_operations'][-100:]
        
        # Save updated memory
        with open(memory_file, 'w') as f:
            json.dump(memory, f, indent=2)
    except:
        pass  # Don't fail hook if memory update fails

def main():
    try:
        # Read hook data from stdin
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool', '')
        tool_input = input_data.get('tool_input', {})
        
        # Only check Write tool (for new file creation)
        if tool_name != 'Write':
            sys.exit(0)
        
        file_path = tool_input.get('file_path', '')
        if not file_path:
            sys.exit(0)
        
        print(f"🛡️ File Guardian checking: {file_path}")
        
        issues = []
        
        # Check if it's a backup file
        if is_backup_file(file_path):
            issues.append({
                'type': 'CRITICAL',
                'message': f'🚨 BLOCKED: Backup file creation not allowed: {os.path.basename(file_path)}',
                'suggestion': 'Git handles version control. Never create backup files manually.'
            })
        
        # Check if it's a duplicate
        is_dup, dup_type, original_path = is_duplicate_file(file_path)
        if is_dup:
            issues.append({
                'type': 'CRITICAL',
                'message': f'🚨 BLOCKED: Duplicate file detected. {dup_type} already exists.',
                'suggestion': f'Use existing file: {original_path}'
            })
        
        # Check for unnecessary files
        unnecessary_issues = check_unnecessary_file(file_path)
        issues.extend(unnecessary_issues)
        
        # Check if trying to create files in wrong locations
        if '/api/' in file_path:
            # API folder should only contain endpoint files
            filename = os.path.basename(file_path)
            if filename not in ['tsconfig.json'] and not filename.endswith(('-webhook.ts', '-processor.ts', '.ts')):
                if 'logger' in filename or 'utils' in filename or 'helper' in filename:
                    issues.append({
                        'type': 'CRITICAL',
                        'message': f'🚨 BLOCKED: Utility file in API folder: {filename}',
                        'suggestion': 'Utilities belong in lib/utils/. API folder is for endpoints only.'
                    })
        
        # Report critical issues (block operation)
        critical_issues = [i for i in issues if i.get('type') == 'CRITICAL']
        if critical_issues:
            print("❌ FILE CREATION BLOCKED:", file=sys.stderr)
            for issue in critical_issues:
                print(f"  • {issue['message']}", file=sys.stderr)
                print(f"    💡 {issue['suggestion']}", file=sys.stderr)
            
            print("\n📝 REMEMBER:", file=sys.stderr)
            print("  • Git already tracks file history", file=sys.stderr)
            print("  • Use existing utilities from lib/", file=sys.stderr)
            print("  • Never duplicate existing code", file=sys.stderr)
            
            # Update agent memory
            update_agent_memory('CREATE_BLOCKED', file_path, True)
            
            # Log to audit trail
            try:
                log_dir = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.')) / '.claude' / 'logs'
                log_dir.mkdir(parents=True, exist_ok=True)
                
                log_entry = {
                    'timestamp': __import__('datetime').datetime.now().isoformat(),
                    'hook': 'file-guardian',
                    'action': 'CREATE_BLOCKED',
                    'file': file_path,
                    'reason': critical_issues[0]['message']
                }
                
                with open(log_dir / 'agent-actions.log', 'a') as f:
                    f.write(json.dumps(log_entry) + '\n')
            except:
                pass
            
            sys.exit(2)  # Block the operation
        
        # Report warnings
        warnings = [i for i in issues if i.get('type') == 'WARNING']
        if warnings:
            print("⚠️ Warnings (operation allowed):")
            for warning in warnings:
                print(f"  • {warning['message']}")
        
        if not issues:
            print("✅ File creation approved!")
        
        # Update agent memory for allowed operations
        update_agent_memory('CREATE_ALLOWED', file_path, False)
        
        sys.exit(0)
        
    except Exception as e:
        print(f"Error in file guardian: {e}", file=sys.stderr)
        # Don't block on hook errors
        sys.exit(0)

if __name__ == "__main__":
    main()