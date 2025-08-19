#!/usr/bin/env python3
"""
Secrets Scanner Hook - SOS Moto
Scans for exposed secrets and dangerous commands
Prevents sensitive data exposure
"""

import json
import sys
import re

# Dangerous command patterns
DANGEROUS_PATTERNS = [
    (r'curl.*\|.*sh', 'Pipe to shell is dangerous'),
    (r'rm\s+-rf\s+/', 'rm -rf command is dangerous'),
    (r'chmod\s+777', '777 permissions are insecure'),
    (r'eval\s*\(', 'eval() usage is dangerous'),
    (r'sudo\s+', 'sudo usage requires confirmation'),
]

# SOS Moto specific secret patterns
SECRET_PATTERNS = [
    (r'MERCADOPAGO_ACCESS_TOKEN\s*=\s*["\'][^"\']+["\']', 'MercadoPago token exposed'),
    (r'FIREBASE_PRIVATE_KEY\s*=\s*["\'][^"\']+["\']', 'Firebase private key exposed'),
    (r'AWS_SECRET_ACCESS_KEY\s*=\s*["\'][^"\']+["\']', 'AWS secret key exposed'),
    (r'UPSTASH_REDIS_REST_TOKEN\s*=\s*["\'][^"\']+["\']', 'Upstash token exposed'),
    (r'WEBHOOK_SECRET\s*=\s*["\'][^"\']+["\']', 'Webhook secret exposed'),
    (r'APP_USR-\d+', 'MercadoPago access token in code'),
    (r'TEST-\d+', 'MercadoPago test token in code'),
    (r'PROD-\d+', 'MercadoPago production token in code'),
]

# Safe commands for SOS Moto
SAFE_COMMANDS = [
    'npm', 'npx', 'git', 'vercel', 'tsc', 'eslint', 'prettier',
    'jest', 'vitest', 'tailwind', 'node', 'cat', 'ls', 'pwd',
    'echo', 'grep', 'find', 'mkdir', 'cp', 'mv', 'touch'
]

def validate_command_safety(command: str) -> list:
    """Validates bash command safety"""
    issues = []
    
    # Check dangerous patterns
    for pattern, message in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            issues.append(f"🚨 {message}: {command}")
    
    # Check secret exposure
    for pattern, message in SECRET_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            issues.append(f"🚨 {message}: {command}")
    
    # Check if command is in safe list
    first_word = command.split()[0] if command.split() else ''
    if first_word and not any(safe in first_word for safe in SAFE_COMMANDS):
        if not first_word.startswith('./') and first_word not in ['python', 'python3']:
            issues.append(f"⚠️ Unwhitelisted command: {first_word}")
    
    # Check for environment variable exposure
    env_patterns = [
        r'echo\s+\$[A-Z_]+',
        r'printenv',
        r'env\s*$',
        r'cat.*\.env',
    ]
    
    for pattern in env_patterns:
        if re.search(pattern, command):
            issues.append(f"🔒 Environment variable exposure: {command}")
    
    return issues

def validate_serverless_compatibility(command: str) -> list:
    """Validates serverless compatibility"""
    issues = []
    
    # Patterns incompatible with Vercel Functions
    incompatible_patterns = [
        (r'pm2\s+start', 'PM2 not compatible with Vercel Functions'),
        (r'forever\s+start', 'Forever not compatible with serverless'),
        (r'systemctl\s+start', 'systemctl not available in serverless'),
        (r'service\s+\w+\s+start', 'Services not available in serverless'),
        (r'nginx\s+(start|restart)', 'Nginx not needed in Vercel'),
        (r'apache2\s+(start|restart)', 'Apache not needed in Vercel'),
    ]
    
    for pattern, message in incompatible_patterns:
        if re.search(pattern, command, re.IGNORECASE):
            issues.append(f"⚠️ {message}")
    
    return issues

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_name', '')
        
        if tool_name != 'Bash':
            sys.exit(0)
        
        command = input_data.get('tool_input', {}).get('command', '')
        if not command:
            sys.exit(0)
        
        print(f"🔒 Scanning command: {command[:50]}...")
        
        all_issues = []
        
        # Validate command safety
        all_issues.extend(validate_command_safety(command))
        
        # Validate serverless compatibility
        all_issues.extend(validate_serverless_compatibility(command))
        
        # Separate critical from warnings
        critical_issues = [issue for issue in all_issues if '🚨' in issue]
        warnings = [issue for issue in all_issues if '⚠️' in issue]
        info = [issue for issue in all_issues if '💡' in issue]
        
        # Block critical security issues
        if critical_issues:
            print("🔒 Security scan failed:", file=sys.stderr)
            for issue in critical_issues:
                print(f"  • {issue}", file=sys.stderr)
            print("❌ Command blocked by security policy", file=sys.stderr)
            sys.exit(2)  # Block command
        
        # Show warnings
        if warnings:
            print("⚠️ Security warnings:")
            for warning in warnings:
                print(f"  • {warning}")
        
        # Show info
        if info:
            for information in info:
                print(f"  • {information}")
        
        print(f"✅ Command approved: {command[:50]}...")
    
    except Exception as e:
        print(f"Error in security scan: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()