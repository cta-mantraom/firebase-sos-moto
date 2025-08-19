#!/usr/bin/env python3
"""
MercadoPago Validator Hook - SOS Moto  
Validates MercadoPago integration files
Ensures proper security and approval rate optimization
"""

import json
import sys
import re
import os

def validate_device_id_implementation(content: str) -> list:
    """Validates Device ID implementation (critical for approval)"""
    issues = []
    
    # Check if Device ID is being collected
    if 'MP_DEVICE_SESSION_ID' not in content and 'device_id' not in content:
        issues.append("🚨 CRITICAL: Device ID required for MercadoPago approval rate")
    
    # Check if Device ID is being validated
    if 'device_id' in content:
        if 'if (!device_id' not in content and 'if (!deviceId' not in content:
            issues.append("⚠️ Device ID should be validated before use")
    
    return issues

def validate_hmac_implementation(content: str) -> list:
    """Validates HMAC implementation for webhooks"""
    issues = []
    
    if 'webhook' in content.lower():
        # Check HMAC validation
        if 'validateWebhook' not in content and 'createHmac' not in content:
            issues.append("🚨 CRITICAL: HMAC validation required in webhooks")
        
        # Check required headers
        if 'x-signature' not in content and 'x-request-id' not in content:
            issues.append("⚠️ Headers x-signature and x-request-id required")
        
        # Check for direct API usage (should use service)
        if 'https://api.mercadopago.com' in content:
            issues.append("🚨 CRITICAL: Use MercadoPagoService, not direct API")
    
    return issues

def validate_payment_brick_setup(content: str) -> list:
    """Validates Payment Brick configuration"""
    issues = []
    
    if 'Payment' in content and 'Brick' in content:
        # Check email pre-fill
        if 'payer' in content and 'email' not in content:
            issues.append("⚠️ Email should be pre-filled in Payment Brick")
        
        # Check payment methods configuration
        if 'paymentMethods' not in content:
            issues.append("⚠️ Payment methods should be configured")
        
        # Check additional_info
        if 'additional_info' not in content and 'additionalInfo' not in content:
            issues.append("⚠️ additional_info required for better approval")
    
    return issues

def validate_async_processing(content: str) -> list:
    """Validates async processing in webhooks"""
    issues = []
    
    if 'webhook' in content.lower():
        # Check for sync processing (prohibited)
        prohibited_patterns = [
            'createProfile',
            'generateQRCode', 
            'sendEmail',
            'processApprovedPayment'
        ]
        
        for pattern in prohibited_patterns:
            if pattern in content and 'qstash' not in content.lower():
                issues.append(f"🚨 CRITICAL: {pattern} should be async via QStash")
        
        # Check if enqueueing jobs
        if 'approved' in content and 'enqueue' not in content:
            issues.append("🚨 CRITICAL: Webhooks should only enqueue jobs")
    
    return issues

def validate_sos_moto_plans(content: str) -> list:
    """Validates SOS Moto plan pricing"""
    issues = []
    
    # Check Basic plan price (R$ 55.00)
    if 'basic' in content.lower():
        if '55' not in content and '55.00' not in content:
            issues.append("⚠️ Basic plan should cost R$ 55.00")
    
    # Check Premium plan price (R$ 85.00)  
    if 'premium' in content.lower():
        if '85' not in content and '85.00' not in content:
            issues.append("⚠️ Premium plan should cost R$ 85.00")
    
    # Check product title
    if 'title' in content and 'SOS Moto' not in content:
        issues.append("⚠️ Product title should mention SOS Moto")
    
    return issues

def validate_correlation_tracking(content: str) -> list:
    """Validates correlation ID and tracking"""
    issues = []
    
    if any(keyword in content for keyword in ['payment', 'mercadopago', 'webhook']):
        # Check correlation ID usage
        if 'correlationId' not in content and 'correlation_id' not in content:
            issues.append("⚠️ Correlation ID required for tracking")
        
        # Check idempotency key
        if 'X-Idempotency-Key' not in content and 'idempotency' not in content:
            issues.append("⚠️ X-Idempotency-Key required for requests")
    
    return issues

def main():
    try:
        # Read hook data
        input_data = json.load(sys.stdin)
        file_path = input_data.get('tool_input', {}).get('file_path', '')
        
        # Only validate MercadoPago/payment related files
        mp_keywords = ['mercadopago', 'payment', 'checkout', 'webhook']
        if not any(keyword in file_path.lower() for keyword in mp_keywords):
            sys.exit(0)
        
        print(f"💳 Validating MercadoPago: {file_path}")
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading file: {e}", file=sys.stderr)
            sys.exit(1)
        
        # Run all validations
        all_issues = []
        all_issues.extend(validate_device_id_implementation(content))
        all_issues.extend(validate_hmac_implementation(content))
        all_issues.extend(validate_payment_brick_setup(content))
        all_issues.extend(validate_async_processing(content))
        all_issues.extend(validate_sos_moto_plans(content))
        all_issues.extend(validate_correlation_tracking(content))
        
        # Separate critical from warnings
        critical_issues = [issue for issue in all_issues if '🚨 CRITICAL' in issue]
        warnings = [issue for issue in all_issues if '⚠️' in issue]
        
        # Report critical issues
        if critical_issues:
            print("❌ CRITICAL MercadoPago issues:", file=sys.stderr)
            for issue in critical_issues:
                print(f"  • {issue}", file=sys.stderr)
            print("💳 Approval rate will be SEVERELY impacted!", file=sys.stderr)
            print("🛑 Fix critical issues before continuing", file=sys.stderr)
            sys.exit(2)  # Block execution
        
        # Report warnings
        if warnings:
            print("⚠️ MercadoPago warnings found:")
            for warning in warnings:
                print(f"  • {warning}")
            print("💡 Consider fixing for better approval rate")
        
        print("✅ MercadoPago validation passed!")
        
        # Specific tips based on file type
        if 'checkout' in file_path.lower():
            print("💡 Tip: Ensure Device ID is collected correctly")
        elif 'webhook' in file_path.lower():
            print("💡 Tip: Remember to only enqueue jobs, not process sync")
    
    except Exception as e:
        print(f"Error in MercadoPago validation: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()