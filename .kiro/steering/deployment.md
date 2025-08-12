# Deployment Guide - Steering Documentation

## 🚀 Production URLs
- **Domain**: https://memoryys.com
- **Email**: contact@memoryys.com
- **Functions**: https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net

## ⚠️ Critical Environment Setup

### DEPRECATED: functions.config()
```bash
# ❌ DON'T USE - Will stop working Dec 31, 2025:
firebase functions:config:set key=value
```

### NEW METHOD: .env Files
```bash
# ✅ USE THIS:
cd functions
cp .env.example .env
# Edit .env with real values
```

### Required Variables:
```env
MERCADOPAGO_ACCESS_TOKEN=your_token
MERCADOPAGO_WEBHOOK_SECRET=your_secret
AWS_SES_ACCESS_KEY_ID=your_key_id  # _ID is required!
AWS_SES_SECRET_ACCESS_KEY=your_secret
AWS_SES_REGION=sa-east-1
SES_FROM_EMAIL=contact@memoryys.com
FRONTEND_URL=https://memoryys.com
```

## 📋 Pre-Deploy Checklist

### Code Quality:
- [ ] No `any` types in production code
- [ ] All external data validated with Zod
- [ ] No test code mixed with production
- [ ] `.env` file configured (not committed)

### Infrastructure:
- [ ] DNS configured (memoryys.com → Firebase Hosting)
- [ ] contact@memoryys.com verified in AWS SES
- [ ] MercadoPago webhook URL configured
- [ ] Firebase APIs enabled

### Testing:
- [ ] Functions build successfully: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Local emulator tested: `firebase emulators:start`

## 🚀 Deployment Commands

```bash
# 1. Build
cd functions && npm run build

# 2. Deploy functions
firebase deploy --only functions

# 3. Deploy hosting  
firebase deploy --only hosting

# 4. Deploy everything
firebase deploy
```

## 🔍 Post-Deploy Verification

- [ ] Functions responding: Check Console logs
- [ ] Payments working: Test MercadoPago flow
- [ ] Emails sending: Test confirmation emails
- [ ] QR codes generating: Test profile creation

## 🚨 Troubleshooting

### Function Deploy Fails:
- Check `.env` file exists and formatted correctly
- Verify all required environment variables set
- Enable Firebase APIs in Console

### Payment Issues:
- Verify webhook URL is correct Functions URL
- Check MERCADOPAGO_WEBHOOK_SECRET matches
- Validate HMAC signature implementation

### Email Issues:
- Confirm contact@memoryys.com verified in AWS SES
- Check AWS SES is in production mode
- Verify AWS credentials are correct

## 📊 Monitoring

- **Firebase Console**: https://console.firebase.google.com/project/moto-sos-guardian-app-78272
- **Function Logs**: `firebase functions:log`
- **Real-time Firestore**: Monitor collections in Console