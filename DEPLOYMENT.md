# Deployment Guide - Moto SOS Guardian App

## Production Domain
- **Primary Domain**: https://memoryys.com
- **Contact Email**: contact@memoryys.com

## Environment Configuration

### Important Notice ⚠️
Firebase's `functions.config()` is **DEPRECATED** and will stop working after December 31, 2025.
We use `.env` files for all environment variables.

### Setting Up Environment Variables

1. **Development Environment**:
   ```bash
   cd functions
   cp .env.example .env
   # Edit .env with your development credentials
   ```

2. **Production Environment**:
   ```bash
   cd functions
   cp .env.production.example .env.production
   # Edit .env.production with production credentials
   ```

### Required Environment Variables

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_token
MERCADOPAGO_WEBHOOK_SECRET=your_secret

# AWS SES (Note: _ID suffix is required!)
AWS_SES_ACCESS_KEY_ID=your_key_id
AWS_SES_SECRET_ACCESS_KEY=your_secret
AWS_SES_REGION=sa-east-1

# URLs and Email
SES_FROM_EMAIL=contact@memoryys.com
FRONTEND_URL=https://memoryys.com
```

## Deployment Steps

### 1. Build Functions
```bash
cd functions
npm run build
```

### 2. Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy specific function
firebase deploy --only functions:functionName
```

### 3. Production Checklist

- [ ] Domain DNS configured (memoryys.com → Firebase Hosting)
- [ ] SSL certificate valid for memoryys.com
- [ ] contact@memoryys.com verified in AWS SES
- [ ] MercadoPago webhook URL configured
- [ ] Environment variables set in .env
- [ ] Firebase project configured correctly
- [ ] All functions tested in staging

## URLs by Environment

### Production
- Frontend: https://memoryys.com
- Functions: https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net
- Email: contact@memoryys.com

### Staging/Development
- Frontend: https://moto-sos-guardian-app-78272.web.app
- Functions: Same as production (use different project for true staging)
- Email: Use test email address

## Monitoring

- Firebase Console: https://console.firebase.google.com/project/moto-sos-guardian-app-78272
- Check function logs: `firebase functions:log`
- Monitor Firestore: Check Firebase Console → Firestore Database

## Troubleshooting

### Function Deployment Fails
- Check `.env` file exists and is properly formatted
- Verify all required environment variables are set
- Run `npm run build` before deploying

### Email Not Sending
- Verify contact@memoryys.com is verified in AWS SES
- Check AWS SES is in production mode (not sandbox)
- Verify AWS credentials are correct

### Payment Webhook Not Working
- Check MercadoPago webhook URL is correct
- Verify MERCADOPAGO_WEBHOOK_SECRET matches
- Check function logs for errors

## Security Notes

- **NEVER** commit `.env` files with real credentials
- Use different credentials for dev/staging/production
- Rotate secrets regularly
- Monitor Firebase usage and set up alerts