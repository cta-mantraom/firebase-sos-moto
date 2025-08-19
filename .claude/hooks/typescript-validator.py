#!/usr/bin/env python3
"""
TypeScript Validator Hook - SOS Moto
Validates TypeScript files after edits
Focuses on maintaining code quality with existing architecture
"""

import json
import sys
import subprocess
import os
import re

def validate_sos_moto_patterns(file_path: str, content: str) -> list:
    """Validates SOS Moto specific patterns"""
    issues = []
    
    # 1. Check for proper service usage
    if 'mercadopago' in content.lower() and file_path.endswith('.ts'):
        if 'https://api.mercadopago.com' in content:
            issues.append("🚨 CRITICAL: Use MercadoPagoService, not direct API calls")
    
    # 2. Check for proper Firebase usage
    if 'firebase' in content.lower() and file_path.endswith('.ts'):
        if 'initializeApp' in content and 'getApps()' not in content:
            issues.append("⚠️ Use Factory Pattern for Firebase initialization")
    
    # 3. Check for Zod validation in API endpoints
    if file_path.startswith('api/') and file_path.endswith('.ts'):
        if 'req.body' in content and '.parse(' not in content:
            issues.append("🚨 CRITICAL: Use Zod validation for API endpoints")
    
    # 4. Check for correlation IDs in logging
    if 'logInfo' in content or 'logError' in content:
        if 'correlationId' not in content:
            issues.append("⚠️ Include correlationId in logging")
    
    # 5. Check Device ID in payment components
    if ('mercadopago' in file_path.lower() or 'payment' in file_path.lower()) and file_path.endswith('.tsx'):
        if 'MP_DEVICE_SESSION_ID' not in content and 'device_id' not in content:
            issues.append("⚠️ Device ID required for MercadoPago payments")
    
    return issues

def run_typescript_check() -> tuple:
    """Runs TypeScript compilation check"""
    try:
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            capture_output=True,
            text=True,
            cwd=os.environ.get('CLAUDE_PROJECT_DIR'),
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "TypeScript check timeout"
    except Exception as e:
        return 1, "", str(e)

def main():
    try:
        # Read hook data
        input_data = json.load(sys.stdin)
        file_path = input_data.get('tool_input', {}).get('file_path', '')
        
        # Only validate TypeScript files
        if not file_path.endswith(('.ts', '.tsx')):
            sys.exit(0)
        
        print(f"🔍 Validating TypeScript: {file_path}")
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading file: {e}", file=sys.stderr)
            sys.exit(1)
        
        # Validate SOS Moto patterns
        issues = validate_sos_moto_patterns(file_path, content)
        
        # Run TypeScript check
        returncode, stdout, stderr = run_typescript_check()
        
        # Report critical issues
        critical_issues = [issue for issue in issues if '🚨 CRITICAL' in issue]
        if critical_issues:
            print("❌ CRITICAL ISSUES found:", file=sys.stderr)
            for issue in critical_issues:
                print(f"  • {issue}", file=sys.stderr)
            print("🛑 Fix critical issues before continuing", file=sys.stderr)
            sys.exit(2)  # Block execution
        
        # Report warnings
        warnings = [issue for issue in issues if '⚠️' in issue]
        if warnings:
            print("⚠️ Warnings found:")
            for warning in warnings:
                print(f"  • {warning}")
        
        # Check TypeScript compilation
        if returncode != 0:
            print("❌ TypeScript errors detected:", file=sys.stderr)
            print(stdout, file=sys.stderr)
            print(stderr, file=sys.stderr)
            print("📋 Fix TypeScript errors before continuing", file=sys.stderr)
            sys.exit(2)
        
        print("✅ TypeScript validation passed!")
        
        # Auto-fix with ESLint if available
        try:
            subprocess.run(
                ['npx', 'eslint', file_path, '--fix'],
                capture_output=True,
                cwd=os.environ.get('CLAUDE_PROJECT_DIR'),
                timeout=15
            )
            print("✨ ESLint auto-fix applied")
        except:
            pass  # Silent fail for linting
    
    except Exception as e:
        print(f"Error in TypeScript validation: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()