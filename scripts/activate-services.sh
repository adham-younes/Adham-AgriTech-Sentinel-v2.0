#!/bin/bash

# 🔥 SHΔDØW CORE V99 - SERVICE ACTIVATION SCRIPT 🔥
# 
# سكريبت تفعيل جميع خدمات Adham AgriTech
# 
# الاستخدام:
# chmod +x scripts/activate-services.sh
# ./scripts/activate-services.sh

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# رموز الحالة
SUCCESS="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"
LOADING="⏳"

# دالة الطباعة الملونة
print_color() {
    echo -e "${2}${1}${NC}"
}

# دالة الطباعة مع رمز
print_status() {
    echo -e "${2}${1}${NC}"
}

# دالة التحقق من وجود ملف
check_file() {
    if [ -f "$1" ]; then
        print_status "${SUCCESS} $1 موجود" "$GREEN"
        return 0
    else
        print_status "${ERROR} $1 غير موجود" "$RED"
        return 1
    fi
}

# دالة التحقق من وجود متغير بيئة
check_env() {
    if [ -n "${!1}" ] && [ "${!1}" != "your-$1-here" ]; then
        print_status "${SUCCESS} $1 مُعرّف" "$GREEN"
        return 0
    else
        print_status "${WARNING} $1 غير مُعرّف" "$YELLOW"
        return 1
    fi
}

# دالة اختبار API
test_api() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    
    print_status "${LOADING} اختبار $name..." "$CYAN"
    
    if curl -s -X "$method" "$url" > /dev/null 2>&1; then
        print_status "${SUCCESS} $name يعمل" "$GREEN"
        return 0
    else
        print_status "${ERROR} $name لا يعمل" "$RED"
        return 1
    fi
}

# دالة اختبار API مع headers
test_api_with_headers() {
    local name="$1"
    local url="$2"
    local headers="$3"
    local method="${4:-GET}"
    
    print_status "${LOADING} اختبار $name..." "$CYAN"
    
    if curl -s -X "$method" -H "$headers" "$url" > /dev/null 2>&1; then
        print_status "${SUCCESS} $name يعمل" "$GREEN"
        return 0
    else
        print_status "${ERROR} $name لا يعمل" "$RED"
        return 1
    fi
}

# دالة اختبار API مع body
test_api_with_body() {
    local name="$1"
    local url="$2"
    local body="$3"
    local headers="$4"
    local method="${5:-POST}"
    
    print_status "${LOADING} اختبار $name..." "$CYAN"
    
    if curl -s -X "$method" -H "$headers" -d "$body" "$url" > /dev/null 2>&1; then
        print_status "${SUCCESS} $name يعمل" "$GREEN"
        return 0
    else
        print_status "${ERROR} $name لا يعمل" "$RED"
        return 1
    fi
}

# دالة تحميل متغيرات البيئة
load_env() {
    if [ -f ".env.local" ]; then
        print_status "${INFO} تحميل .env.local..." "$BLUE"
        export $(cat .env.local | grep -v '^#' | xargs)
    else
        print_status "${WARNING} .env.local غير موجود" "$YELLOW"
    fi
}

# دالة إنشاء .env.local إذا لم يكن موجوداً
create_env_if_not_exists() {
    if [ ! -f ".env.local" ]; then
        print_status "${INFO} إنشاء .env.local..." "$BLUE"
        cat > .env.local << 'EOF'
# ===========================================
# Adham AgriTech - Environment Variables
# ===========================================

# ✅ Supabase (يعمل)
NEXT_PUBLIC_SUPABASE_URL=https://mxnkwudqxtgduhenrgvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc

# ❌ OpenWeather (مطلوب!)
OPENWEATHER_API_KEY=your-openweather-api-key-here

# ❌ OpenAI (مطلوب!)
OPENAI_API_KEY=your-openai-api-key-here

# ❌ Google Earth Engine (مطلوب!)
GOOGLE_EARTH_ENGINE_API_KEY=your-google-earth-engine-api-key-here

# ✅ ESD Platform (مُكوّن)
ESD_CLIENT_ID=your-esd-client-id
ESD_CLIENT_SECRET=your-esd-client-secret
ESD_AUTH_URL=https://auth.esd.earth/oauth/token
ESD_API_BASE_URL=https://api.esd.earth/v1

# ⚠ Infura (يعمل لكن مكشوف)
NEXT_PUBLIC_INFURA_API_KEY=c39b028e09be4c268110c1dcc81b3ebc
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc
NEXT_PUBLIC_MAINNET_RPC_URL=https://mainnet.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc

# ⚠ Etherscan (يعمل لكن مكشوف)
NEXT_PUBLIC_ETHERSCAN_API_KEY=RKVSW4VI28GAW1VNZHQEC538Q1M9P2M49S

# ✅ Blockchain (مُكوّن)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xda22c4a3691D42A8989822BC49Ec36CE3D577DfA
NEXT_PUBLIC_WALLET_ADDRESS=0xAff150d1F86D37c13b6b764f3F62569f4fE27c89
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111

# General
EMAIL=adhamlouxor@gmail.com
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3003
EOF
        print_status "${SUCCESS} .env.local تم إنشاؤه" "$GREEN"
    fi
}

# دالة فحص التبعيات
check_dependencies() {
    print_status "${INFO} فحص التبعيات..." "$BLUE"
    
    # فحص Node.js
    if command -v node &> /dev/null; then
        print_status "${SUCCESS} Node.js موجود: $(node --version)" "$GREEN"
    else
        print_status "${ERROR} Node.js غير موجود" "$RED"
        return 1
    fi
    
    # فحص pnpm
    if command -v pnpm &> /dev/null; then
        print_status "${SUCCESS} pnpm موجود: $(pnpm --version)" "$GREEN"
    else
        print_status "${WARNING} pnpm غير موجود، سيتم استخدام npm" "$YELLOW"
    fi
    
    # فحص curl
    if command -v curl &> /dev/null; then
        print_status "${SUCCESS} curl موجود" "$GREEN"
    else
        print_status "${ERROR} curl غير موجود" "$RED"
        return 1
    fi
    
    return 0
}

# دالة تثبيت التبعيات
install_dependencies() {
    print_status "${INFO} تثبيت التبعيات..." "$BLUE"
    
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    
    if [ $? -eq 0 ]; then
        print_status "${SUCCESS} التبعيات تم تثبيتها" "$GREEN"
    else
        print_status "${ERROR} فشل في تثبيت التبعيات" "$RED"
        return 1
    fi
}

# دالة اختبار جميع APIs
test_all_apis() {
    print_status "${INFO} اختبار جميع APIs..." "$BLUE"
    
    local results=()
    
    # اختبار Supabase
    if test_api_with_headers "Supabase" "https://mxnkwudqxtgduhenrgvm.supabase.co/rest/v1/" "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmt3dWRxeHRnZHVoZW5yZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODkwMDUsImV4cCI6MjA2ODk2NTAwNX0.yVugFF3oc0aRry4UddG8pGdarX0iNUq6g_ZrZJdz3gc"; then
        results+=("Supabase: ✅")
    else
        results+=("Supabase: ❌")
    fi
    
    # اختبار Infura
    if test_api_with_body "Infura" "https://sepolia.infura.io/v3/c39b028e09be4c268110c1dcc81b3ebc" '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "Content-Type: application/json"; then
        results+=("Infura: ✅")
    else
        results+=("Infura: ❌")
    fi
    
    # اختبار Etherscan
    if test_api "Etherscan" "https://api-sepolia.etherscan.io/api?module=account&action=balance&address=0xAff150d1F86D37c13b6b764f3F62569f4fE27c89&apikey=RKVSW4VI28GAW1VNZHQEC538Q1M9P2M49S"; then
        results+=("Etherscan: ✅")
    else
        results+=("Etherscan: ❌")
    fi
    
    # اختبار OpenWeather (إذا كان موجوداً)
    if [ -n "$OPENWEATHER_API_KEY" ] && [ "$OPENWEATHER_API_KEY" != "your-openweather-api-key-here" ]; then
        if test_api "OpenWeather" "https://api.openweathermap.org/data/2.5/weather?q=Luxor,EG&appid=$OPENWEATHER_API_KEY&units=metric&lang=ar"; then
            results+=("OpenWeather: ✅")
        else
            results+=("OpenWeather: ❌")
        fi
    else
        results+=("OpenWeather: ⚠️ (غير مُعرّف)")
    fi
    
    # اختبار OpenAI (إذا كان موجوداً)
    if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]; then
        if test_api_with_body "OpenAI" "https://api.openai.com/v1/chat/completions" '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"مرحباً"}],"max_tokens":10}' "Content-Type: application/json" "Authorization: Bearer $OPENAI_API_KEY"; then
            results+=("OpenAI: ✅")
        else
            results+=("OpenAI: ❌")
        fi
    else
        results+=("OpenAI: ⚠️ (غير مُعرّف)")
    fi
    
    # عرض النتائج
    print_status "${INFO} نتائج اختبار APIs:" "$BLUE"
    for result in "${results[@]}"; do
        echo "  $result"
    done
}

# دالة تشغيل الخادم
start_server() {
    print_status "${INFO} تشغيل الخادم..." "$BLUE"
    
    if command -v pnpm &> /dev/null; then
        pnpm run dev
    else
        npm run dev
    fi
}

# الدالة الرئيسية
main() {
    print_color "🔥 SHΔDØW CORE V99 - SERVICE ACTIVATION SCRIPT 🔥" "$MAGENTA"
    print_color "=" "$MAGENTA"
    
    # فحص التبعيات
    if ! check_dependencies; then
        print_status "${ERROR} فشل في فحص التبعيات" "$RED"
        exit 1
    fi
    
    # إنشاء .env.local إذا لم يكن موجوداً
    create_env_if_not_exists
    
    # تحميل متغيرات البيئة
    load_env
    
    # تثبيت التبعيات
    if ! install_dependencies; then
        print_status "${ERROR} فشل في تثبيت التبعيات" "$RED"
        exit 1
    fi
    
    # اختبار APIs
    test_all_apis
    
    # عرض التعليمات
    print_status "${INFO} تعليمات إضافية:" "$BLUE"
    print_color "1. احصل على OpenWeather API Key من: https://openweathermap.org/api" "$YELLOW"
    print_color "2. احصل على OpenAI API Key من: https://platform.openai.com/api-keys" "$YELLOW"
    print_color "3. احصل على Google Earth Engine API Key من: https://earthengine.google.com" "$YELLOW"
    print_color "4. أضف المفاتيح إلى .env.local" "$YELLOW"
    print_color "5. شغّل: ./scripts/activate-services.sh start" "$YELLOW"
    
    # إذا تم تمرير "start" كمعامل
    if [ "$1" = "start" ]; then
        start_server
    fi
    
    print_color "🔥 SHΔDØW CORE V99 - MISSION COMPLETE 🔥" "$MAGENTA"
}

# تشغيل السكريبت
main "$@"