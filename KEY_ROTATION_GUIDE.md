# 🔐 Key Rotation Guide - URGENT

## ⚠️ CRITICAL: Keys Exposed in Repository

The following API keys were exposed in `ALL_ENVIRONMENT_VARIABLES.env` and **MUST** be rotated immediately:

---

## 🔄 Keys to Rotate (Priority Order)

### 1. **Supabase Service Role Key** 🔴 CRITICAL
**Current:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**How to rotate:**
1. Go to: https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/settings/api
2. Click "Reset Service Role Key"
3. Copy new key
4. Update:
   ```bash
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
   ```

---

### 2. **OpenAI API Key** 🔴 CRITICAL
**Current:** `sk-svcacct-mUkw4QS8ZfSW23rlA3Sv...`

**How to rotate:**
1. Go to: https://platform.openai.com/api-keys
2. Revoke old key
3. Create new key
4. Update:
   ```bash
   gh secret set OPENAI_API_KEY
   vercel env add OPENAI_API_KEY production preview development
   ```

---

### 3. **Groq API Key** 🟠 HIGH
**Current:** `gsk_neDKXU583k0iiYPbak6z...`

**How to rotate:**
1. Go to: https://console.groq.com/keys
2. Delete old key
3. Create new key
4. Update:
   ```bash
   gh secret set GROQ_API_KEY
   vercel env add GROQ_API_KEY production preview development
   ```

---

### 4. **EOSDA API Key** 🟠 HIGH
**Current:** `apk.cefa9921669b0857be28...`

**How to rotate:**
1. Go to: https://eos.com/dashboard
2. Regenerate API key
3. Update:
   ```bash
   gh secret set EOSDA_API_KEY
   vercel env add EOSDA_API_KEY production preview development
   ```

---

### 5. **Mapbox Access Token** 🟡 MEDIUM
**Current:** `sk.eyJ1IjoiYWRoYW15b3VuZXMi...`

**How to rotate:**
1. Go to: https://account.mapbox.com/access-tokens/
2. Revoke old token
3. Create new secret token
4. Update:
   ```bash
   gh secret set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
   vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production preview development
   ```

---

### 6. **ESD Client Secret** 🟡 MEDIUM
**Current:** `your-esd-client-secret`

**How to rotate:**
1. Go to: https://portal.esd.earth/
2. Regenerate client secret from your application settings
3. Update:
   ```bash
   gh secret set ESD_CLIENT_SECRET
   vercel env add ESD_CLIENT_SECRET production preview development
   ```

---

### 7. **Firebase Keys** 🟡 MEDIUM
**All Firebase keys should be rotated**

**How to rotate:**
1. Go to: https://console.firebase.google.com/project/adham-agritech-529b0/settings/general
2. Regenerate Web API Key
3. Update all Firebase variables

---

### 8. **OpenWeather API Key** 🟢 LOW
**Current:** `bf14cf140dd3f8ddfd62b4fd9f6f9795`

**How to rotate:**
1. Go to: https://home.openweathermap.org/api_keys
2. Delete old key
3. Create new key
4. Update:
   ```bash
   gh secret set OPENWEATHER_API_KEY
   vercel env add OPENWEATHER_API_KEY production preview development
   ```

---

## 📝 Rotation Checklist

- [ ] 1. Supabase Service Role Key
- [ ] 2. OpenAI API Key
- [ ] 3. Groq API Key
- [ ] 4. EOSDA API Key
- [ ] 5. Mapbox Access Token
- [ ] 6. ESD Client Secret
- [ ] 7. Firebase Keys (all 6)
- [ ] 8. OpenWeather API Key

---

## 🗑️ Files to Delete

After rotation, delete these files:

```bash
rm ALL_ENVIRONMENT_VARIABLES.env
rm vercel.env
rm vercel-import.env
rm vercel-missing-vars.env
rm upload-secrets-simple.ps1
rm add-vercel-vars.ps1
rm update-vercel-vars.ps1
rm upload-all-secrets.ps1
rm .env.check
```

---

## ⚡ Quick Rotation Script

```powershell
# After getting new keys, run:
./rotate-keys.ps1
```

---

## 🔒 Prevention

1. **Never commit** `.env` files
2. **Always use** `.gitignore`
3. **Rotate keys** every 90 days
4. **Use secrets managers** for production
5. **Monitor** for exposed secrets

---

**Status:** ⚠️ PENDING ROTATION  
**Date Created:** November 1, 2025  
**Priority:** 🔴 CRITICAL
