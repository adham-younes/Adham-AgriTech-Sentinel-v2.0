#!/bin/bash
# ===========================================
# Vercel API Usage Script
# ===========================================
# Simple script to interact with Vercel API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for VERCEL_TOKEN
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not found${NC}"
    echo ""
    echo "📝 To get your Vercel token:"
    echo "   1. Go to https://vercel.com/account/tokens"
    echo "   2. Create a new token"
    echo "   3. Export it: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

PROJECT_ID="prj_adham-agritech"
TEAM_ID="${VERCEL_TEAM_ID:-}"

# Base URL
API_BASE="https://api.vercel.com"
TEAM_PARAM="${TEAM_ID:+?teamId=${TEAM_ID}}"

echo -e "${GREEN}🚀 Vercel API Manager${NC}"
echo ""

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_BASE}${endpoint}${TEAM_PARAM}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            "${API_BASE}${endpoint}${TEAM_PARAM}"
    fi
}

# List environment variables
list_env() {
    echo -e "${YELLOW}📦 Environment Variables:${NC}"
    api_request "GET" "/v10/projects/${PROJECT_ID}/env" | jq -r '.envs[] | "  \(.key) (\(.target | join(", ")))"'
    echo ""
}

# Add/Update environment variable
add_env() {
    local key=$1
    local value=$2
    local targets=${3:-"production,preview"}
    
    echo -e "${YELLOW}➕ Adding/Updating: ${key}${NC}"
    
    # Check if exists
    local existing=$(api_request "GET" "/v10/projects/${PROJECT_ID}/env" | jq -r ".envs[] | select(.key == \"${key}\") | .id")
    
    if [ -n "$existing" ]; then
        # Update
        api_request "PATCH" "/v10/projects/${PROJECT_ID}/env/${existing}" \
            "{\"value\":\"${value}\",\"target\":[$(echo $targets | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]}" > /dev/null
        echo -e "${GREEN}✅ Updated ${key}${NC}"
    else
        # Create
        local type="encrypted"
        if [[ "$key" == NEXT_PUBLIC_* ]]; then
            type="plain"
        fi
        
        api_request "POST" "/v10/projects/${PROJECT_ID}/env" \
            "{\"key\":\"${key}\",\"value\":\"${value}\",\"target\":[$(echo $targets | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')],\"type\":\"${type}\"}" > /dev/null
        echo -e "${GREEN}✅ Created ${key}${NC}"
    fi
    echo ""
}

# List deployments
list_deployments() {
    echo -e "${YELLOW}🚀 Recent Deployments:${NC}"
    api_request "GET" "/v6/deployments?projectId=${PROJECT_ID}&limit=5" | \
        jq -r '.deployments[] | "  \(.state | ascii_upcase) \(.url) \(.createdAt | todate)"'
    echo ""
}

# Create deployment
create_deployment() {
    local ref=${1:-"main"}
    echo -e "${YELLOW}🚀 Creating deployment from ${ref}...${NC}"
    
    local response=$(api_request "POST" "/v13/deployments" \
        "{\"name\":\"${PROJECT_ID}\",\"project\":\"${PROJECT_ID}\",\"gitSource\":{\"type\":\"github\",\"repo\":\"adhamlouxors-projects/adham-agritech\",\"ref\":\"${ref}\"},\"target\":\"production\"}")
    
    local url=$(echo "$response" | jq -r '.url // .urls[0] // "N/A"')
    echo -e "${GREEN}✅ Deployment created: ${url}${NC}"
    echo ""
}

# Main menu
case "${1:-menu}" in
    list-env)
        list_env
        ;;
    add-env)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 add-env KEY VALUE [targets]"
            echo "Example: $0 add-env NEXT_PUBLIC_EOSDA_API_URL 'https://api-connect.eos.com' 'production,preview'"
            exit 1
        fi
        add_env "$2" "$3" "${4:-production,preview}"
        ;;
    list-deployments)
        list_deployments
        ;;
    deploy)
        create_deployment "${2:-main}"
        ;;
    menu|*)
        echo "Vercel API Manager"
        echo ""
        echo "Usage:"
        echo "  $0 list-env                    # List environment variables"
        echo "  $0 add-env KEY VALUE [targets]  # Add/Update environment variable"
        echo "  $0 list-deployments            # List recent deployments"
        echo "  $0 deploy [ref]                  # Create new deployment"
        echo ""
        echo "Examples:"
        echo "  export VERCEL_TOKEN=your_token"
        echo "  $0 list-env"
        echo "  $0 add-env NEXT_PUBLIC_EOSDA_API_URL 'https://api-connect.eos.com' 'production,preview'"
        echo "  $0 deploy main"
        ;;
esac

