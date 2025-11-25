# 🔑 Adham AgriTech - Environment Variables Setup Guide

## Quick Start

1. **Copy the template:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Fill in your API keys** (see sections below)

3. **Restart the development server:**
   \`\`\`bash
   pnpm run dev
   \`\`\`

---

## Active Services ✅

### Supabase (Database & Authentication)
- **Status:** ✅ Working 100%
- **URL:** https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm
- **Already configured** - No action needed

### ESD Platform (Satellite Imagery)
- **Status:** ✅ Working 100%
- **Provider:** Earth Satellite Data (ESD)
- **Already configured** - No action needed

---

## Required Services ❌

### OpenWeather API (Weather Data)

**Why needed:** Current weather, 7-day forecasts, frost alerts, rain predictions

**Setup (5 minutes):**

1. Go to: https://openweathermap.org/api
2. Click "Sign Up"
3. Fill in:
   - Username: `adham_agritech`
   - Email: `adhamlouxor@gmail.com`
   - Password: (choose a strong password)
4. Verify your email
5. Go to: https://home.openweathermap.org/api_keys
6. Copy your API key
7. Add to `.env.local`:
   \`\`\`env
   OPENWEATHER_API_KEY=your-key-here
   \`\`\`
8. Wait 10 minutes for activation
9. Test:
   \`\`\`bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=Luxor,EG&appid=YOUR_KEY&units=metric&lang=ar"
   \`\`\`

**Free tier:** 1,000 requests/day, 60 requests/minute

---

### OpenAI API (AI Assistant)

**Why needed:** Smart agricultural advisor, disease diagnosis, fertilizer recommendations

**Setup (10 minutes):**

1. Go to: https://platform.openai.com/signup
2. Sign up with `adhamlouxor@gmail.com`
3. Verify your email
4. Add payment method:
   - Go to: https://platform.openai.com/account/billing
   - Add credit/debit card
   - Add $5-10 credit
5. Create API key:
   - Go to: https://platform.openai.com/api-keys
   - Click "+ Create new secret key"
   - Name: "Adham AgriTech Production"
   - Copy the key (shown only once!)
6. Add to `.env.local`:
   \`\`\`env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxx
   \`\`\`
7. Set spending limit:
   - Go to: https://platform.openai.com/account/limits
   - Set Hard Limit: $10/month
   - Enable email alerts at 75%
8. Test:
   \`\`\`bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{
       "model": "gpt-4o-mini",
       "messages": [{"role": "user", "content": "مرحباً"}],
       "max_tokens": 50
     }'
   \`\`\`

**Pricing:** $0.15/1M input tokens, $0.60/1M output tokens (GPT-4o-mini)

**Estimated cost:** $2-5/month for light usage

---

## Exposed Services ⚠️ (Renew Before Production)

### Infura (Blockchain RPC)
- **Status:** ⚠️ Exposed - Renew before production
- **Renew at:** https://infura.io/dashboard
- **Create new project** and update `.env.local`

### Etherscan (Blockchain Explorer)
- **Status:** ⚠️ Exposed - Renew before production
- **Renew at:** https://etherscan.io/myapikey
- **Create new key** and update `.env.local`

---

## Testing Checklist

After setting up all keys, test each feature:

\`\`\`bash
# Start development server
pnpm run dev

# Test Weather
# Visit: http://localhost:3003/dashboard/weather

# Test AI Assistant
# Visit: http://localhost:3003/dashboard/ai-assistant

# Test Satellite Imagery
# Visit: http://localhost:3003/dashboard/crop-monitoring

# Test Blockchain
# Visit: http://localhost:3003/dashboard/agronomy-insights
\`\`\`

---

## Security Best Practices

1. **Never commit `.env.local`:**
   \`\`\`bash
   # Verify it's in .gitignore
   cat .gitignore | grep env.local
   \`\`\`

2. **Use different keys for production:**
   - Development: `.env.local`
   - Production: Vercel Environment Variables

3. **Rotate keys monthly:**
   - Check usage
   - Renew exposed keys
   - Delete unused keys

4. **Enable alerts:**
   - OpenAI: Alert at $7.50
   - Infura: Alert at 80,000 requests
   - Supabase: Alert at 400MB

5. **Never share this file:**
   - Don't email it
   - Don't paste in chat
   - Don't commit to Git

---

## Troubleshooting

### Weather not working?
- Check `OPENWEATHER_API_KEY` is set
- Wait 10 minutes after signup
- Verify key at: https://home.openweathermap.org/api_keys

### AI Assistant not responding?
- Check `OPENAI_API_KEY` is set
- Verify credit at: https://platform.openai.com/account/billing
- Check usage at: https://platform.openai.com/account/usage

### Satellite imagery not loading?
- ESD keys are already set
- Check browser console for errors
- Verify at: https://dataspace.copernicus.eu

### Blockchain features not working?
- Check `NEXT_PUBLIC_INFURA_API_KEY` is set
- Verify at: https://infura.io/dashboard
- Check network is set to `sepolia`

---

## Support Links

- **Supabase:** https://supabase.com/dashboard/project/mxnkwudqxtgduhenrgvm/settings/support
- **OpenWeather:** https://openweathermap.org/faq
- **OpenAI:** https://help.openai.com/
- **ESD Support:** https://portal.esd.earth/support
- **Infura:** https://support.infura.io/
- **Etherscan:** https://etherscan.io/contactus

---

**Last updated:** October 21, 2025
