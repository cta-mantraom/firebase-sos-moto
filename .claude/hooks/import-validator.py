#!/usr/bin/env python3
"""
Import Validator Hook - SOS Moto
Validates imports in TypeScript/JavaScript files to prevent duplicates and incorrect paths
Suggests automatic fixes when possible
"""

import json
import sys
import os
import re
from pathlib import Path

def get_project_structure():
    """Get the project structure to understand available modules"""
    project_dir = os.environ.get('CLAUDE_PROJECT_DIR', '.')
    
    # Map of common duplicates to their correct locations
    correct_imports = {
        'logger': '../lib/utils/logger',
        'validation': '../lib/utils/validation',
        'firebase': '../lib/services/firebase',
        'mercadopago.service': '../lib/services/payment/mercadopago.service',
        'email.service': '../lib/services/notification/email.service',
        'profile.service': '../lib/services/profile/profile.service',
        'qstash.service': '../lib/services/queue/qstash.service',
        'payment.repository': '../lib/repositories/payment.repository',
        'profile.repository': '../lib/repositories/profile.repository',
    }
    
    return correct_imports

def check_duplicate_file_creation(file_path: str, content: str) -> list:
    """Check if trying to create a duplicate file"""
    issues = []
    filename = os.path.basename(file_path)
    dirname = os.path.dirname(file_path)
    
    # Check for backup file creation
    if any(ext in filename for ext in ['.bak', '.backup', '.old', '_backup_', '_old_']):
        issues.append({
            'type': 'CRITICAL',
            'message': f'🚨 BLOCKED: Never create backup files ({filename}). Git handles versioning.',
            'suggestion': 'Remove backup file creation. Use git for version control.'
        })
    
    # Check for logger duplication
    if 'logger' in filename.lower() and '/api/' in file_path:
        issues.append({
            'type': 'CRITICAL',
            'message': f'🚨 BLOCKED: Never duplicate logger in api/. Use lib/utils/logger.',
            'suggestion': "Import from '../lib/utils/logger' instead of creating local logger."
        })
    
    return issues

def validate_imports(file_path: str, content: str) -> list:
    """Validate imports in TypeScript/JavaScript files"""
    issues = []
    
    if not file_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
        return issues
    
    correct_imports = get_project_structure()
    
    # Find all import statements
    import_pattern = r'import\s+(?:{[^}]+}|[^;]+)\s+from\s+[\'"]([^\'"]+)[\'"]'
    imports = re.findall(import_pattern, content)
    
    for import_path in imports:
        # Check for local logger imports in api/ folder
        if '/api/' in file_path and './logger' in import_path:
            issues.append({
                'type': 'CRITICAL',
                'message': f'🚨 INCORRECT: Import from ./logger detected',
                'line': import_path,
                'suggestion': "Change to: import { logInfo, logError } from '../lib/utils/logger'"
            })
        
        # Check for duplicate service imports
        for key, correct_path in correct_imports.items():
            if key in import_path and import_path != correct_path:
                # Check if it's a relative path that needs correction
                if not import_path.startswith('../lib/'):
                    issues.append({
                        'type': 'WARNING',
                        'message': f'⚠️ SUBOPTIMAL: Import {key} from incorrect location',
                        'line': import_path,
                        'suggestion': f"Use: import from '{correct_path}'"
                    })
    
    # Check for direct API calls instead of using services
    if 'api.mercadopago.com' in content:
        issues.append({
            'type': 'CRITICAL',
            'message': '🚨 CRITICAL: Direct MercadoPago API call detected',
            'suggestion': 'Use MercadoPagoService from lib/services/payment/mercadopago.service'
        })
    
    if 'firebase.google.com/v1' in content or 'firebaseio.com' in content:
        issues.append({
            'type': 'CRITICAL',
            'message': '🚨 CRITICAL: Direct Firebase API call detected',
            'suggestion': 'Use Firebase services from lib/services/firebase'
        })
    
    return issues

def check_import_resolution(file_path: str, content: str) -> list:
    """Check if imports will resolve correctly in Vercel serverless environment"""
    issues = []
    
    if not file_path.endswith(('.ts', '.tsx')):
        return issues
    
    # Check for missing file extensions in relative imports (Vercel requirement)
    relative_imports = re.findall(r'from\s+[\'"](\.\./[^\'"\s]+)[\'"]', content)
    
    for import_path in relative_imports:
        # Skip if it's a directory import (has no extension and doesn't end with .js)
        if not import_path.endswith(('.js', '.ts', '.tsx', '.json')) and '/' in import_path:
            # In Vercel, we might need .js extension for TypeScript files
            if '/api/' in file_path and not import_path.endswith('.js'):
                issues.append({
                    'type': 'INFO',
                    'message': f'ℹ️ INFO: Consider adding .js extension for Vercel compatibility',
                    'line': import_path,
                    'suggestion': f"In Vercel functions, use '{import_path}.js' for better compatibility"
                })
    
    return issues

def main():
    try:
        # Read hook data from stdin
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool', '')
        tool_input = input_data.get('tool_input', {})
        
        # Get file path and content based on tool
        if tool_name in ['Edit', 'MultiEdit']:
            file_path = tool_input.get('file_path', '')
            # For Edit tool, we need to check the new_string
            new_content = tool_input.get('new_string', '')
            
            # For MultiEdit, check all edits
            if tool_name == 'MultiEdit':
                edits = tool_input.get('edits', [])
                for edit in edits:
                    new_content += edit.get('new_string', '')
        
        elif tool_name == 'Write':
            file_path = tool_input.get('file_path', '')
            new_content = tool_input.get('content', '')
        
        else:
            # Not a relevant tool for import validation
            sys.exit(0)
        
        if not file_path:
            sys.exit(0)
        
        print(f"🔍 Validating imports and file creation: {file_path}")
        
        all_issues = []
        
        # Check for duplicate file creation
        file_issues = check_duplicate_file_creation(file_path, new_content)
        all_issues.extend(file_issues)
        
        # Validate imports
        import_issues = validate_imports(file_path, new_content)
        all_issues.extend(import_issues)
        
        # Check import resolution
        resolution_issues = check_import_resolution(file_path, new_content)
        all_issues.extend(resolution_issues)
        
        # Report critical issues (block operation)
        critical_issues = [i for i in all_issues if i.get('type') == 'CRITICAL']
        if critical_issues:
            print("❌ CRITICAL ISSUES FOUND - BLOCKING OPERATION:", file=sys.stderr)
            for issue in critical_issues:
                print(f"  • {issue['message']}", file=sys.stderr)
                if 'suggestion' in issue:
                    print(f"    💡 FIX: {issue['suggestion']}", file=sys.stderr)
            print("\n🔧 Apply the suggested fixes and try again.", file=sys.stderr)
            sys.exit(2)  # Exit with error to block the operation
        
        # Report warnings (don't block)
        warnings = [i for i in all_issues if i.get('type') == 'WARNING']
        if warnings:
            print("⚠️ Warnings found (operation allowed):")
            for warning in warnings:
                print(f"  • {warning['message']}")
                if 'suggestion' in warning:
                    print(f"    💡 Suggestion: {warning['suggestion']}")
        
        # Report info (don't block)
        infos = [i for i in all_issues if i.get('type') == 'INFO']
        if infos:
            print("ℹ️ Information:")
            for info in infos:
                print(f"  • {info['message']}")
        
        if not all_issues:
            print("✅ Import validation passed! No issues found.")
        
        # Log to audit trail
        try:
            log_dir = Path(os.environ.get('CLAUDE_PROJECT_DIR', '.')) / '.claude' / 'logs'
            log_dir.mkdir(parents=True, exist_ok=True)
            
            log_entry = {
                'timestamp': __import__('datetime').datetime.now().isoformat(),
                'hook': 'import-validator',
                'file': file_path,
                'issues_found': len(all_issues),
                'critical': len(critical_issues),
                'warnings': len(warnings),
                'action': 'blocked' if critical_issues else 'allowed'
            }
            
            with open(log_dir / 'hook-executions.log', 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except:
            pass  # Don't fail the hook if logging fails
        
        sys.exit(0)
        
    except Exception as e:
        print(f"Error in import validation: {e}", file=sys.stderr)
        # Don't block on hook errors
        sys.exit(0)

if __name__ == "__main__":
    main()