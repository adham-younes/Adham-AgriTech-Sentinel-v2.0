# Test API Integrations Script
# Usage: .\scripts\test-integrations.ps1

Write-Host "🔍 Testing API Integrations for Adham AgriTech Platform" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Load environment variables from .env.local if exists
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "📄 Loading environment variables from $envFile" -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host ""
}

$results = @()

# Test OpenWeather API
Write-Host "1️⃣  Testing OpenWeather API..." -ForegroundColor White
$apiKey = $env:OPENWEATHER_API_KEY
if ($apiKey) {
    try {
        $uri = "https://api.openweathermap.org/data/2.5/weather?q=Cairo" + "&appid=" + $apiKey
        $response = Invoke-RestMethod -Uri $uri -ErrorAction Stop
        Write-Host "   ✅ OpenWeather API: Working" -ForegroundColor Green
        Write-Host "   📍 Location: $($response.name)" -ForegroundColor Gray
        Write-Host "   🌡️  Temperature: $([math]::Round($response.main.temp - 273.15, 1))°C" -ForegroundColor Gray
        $results += @{Service="OpenWeather"; Status="✅ Working"}
    } catch {
        Write-Host "   ❌ OpenWeather API: Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{Service="OpenWeather"; Status="❌ Failed"}
    }
} else {
    Write-Host "   ⚠️  OpenWeather API: Not configured" -ForegroundColor Yellow
    $results += @{Service="OpenWeather"; Status="⚠️ Not configured"}
}
Write-Host ""

# Test OpenAI API
Write-Host "2️⃣  Testing OpenAI API..." -ForegroundColor White
$apiKey = $env:OPENAI_API_KEY
if ($apiKey) {
    try {
        $headers = @{
            "Authorization" = "Bearer $apiKey"
        }
        $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/models" -Headers $headers -ErrorAction Stop
        Write-Host "   ✅ OpenAI API: Working" -ForegroundColor Green
        Write-Host "   📊 Available models: $($response.data.Count)" -ForegroundColor Gray
        $results += @{Service="OpenAI"; Status="✅ Working"}
    } catch {
        Write-Host "   ❌ OpenAI API: Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Message -match "401") {
            Write-Host "   💡 Hint: Check if API key is valid" -ForegroundColor Yellow
        } elseif ($_.Exception.Message -match "429") {
            Write-Host "   💡 Hint: Rate limit exceeded or billing issue" -ForegroundColor Yellow
        }
        $results += @{Service="OpenAI"; Status="❌ Failed"}
    }
} else {
    Write-Host "   ⚠️  OpenAI API: Not configured" -ForegroundColor Yellow
    $results += @{Service="OpenAI"; Status="⚠️ Not configured"}
}
Write-Host ""

# Test ESD API
Write-Host "3️⃣  Testing ESD API..." -ForegroundColor White
$clientId = $env:ESD_CLIENT_ID
$clientSecret = $env:ESD_CLIENT_SECRET
$authUrl = $env:ESD_AUTH_URL
if ($clientId -and $clientSecret -and $authUrl) {
    try {
        $body = "grant_type=client_credentials&client_id=$clientId&client_secret=$clientSecret"
        $response = Invoke-RestMethod -Uri $authUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
        Write-Host "   ✅ ESD API: Working" -ForegroundColor Green
        if ($response.expires_in) {
            Write-Host "   🔑 Token obtained (expires in $($response.expires_in)s)" -ForegroundColor Gray
        }
        $results += @{Service="ESD"; Status="✅ Working"}
    } catch {
        Write-Host "   ❌ ESD API: Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{Service="ESD"; Status="❌ Failed"}
    }
} else {
    Write-Host "   ⚠️  ESD API: Not configured" -ForegroundColor Yellow
    $results += @{Service="ESD"; Status="⚠️ Not configured"}
}
Write-Host ""

# Test Mapbox API
Write-Host "4️⃣  Testing Mapbox API..." -ForegroundColor White
$token = $env:NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
if ($token) {
    try {
        $uri = "https://api.mapbox.com/geocoding/v5/mapbox.places/Cairo.json?access_token=" + $token
        $response = Invoke-RestMethod -Uri $uri -ErrorAction Stop
        Write-Host "   ✅ Mapbox API: Working" -ForegroundColor Green
        Write-Host "   📍 Features found: $($response.features.Count)" -ForegroundColor Gray
        $results += @{Service="Mapbox"; Status="✅ Working"}
    } catch {
        Write-Host "   ❌ Mapbox API: Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{Service="Mapbox"; Status="❌ Failed"}
    }
} else {
    Write-Host "   ⚠️  Mapbox API: Not configured" -ForegroundColor Yellow
    $results += @{Service="Mapbox"; Status="⚠️ Not configured"}
}
Write-Host ""

# Test Supabase
Write-Host "5️⃣  Testing Supabase..." -ForegroundColor White
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
if ($supabaseUrl -and $supabaseKey) {
    try {
        $headers = @{
            "apikey" = $supabaseKey
            "Authorization" = "Bearer $supabaseKey"
        }
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers $headers -ErrorAction Stop
        Write-Host "   ✅ Supabase: Working" -ForegroundColor Green
        Write-Host "   🔗 Connected to: $supabaseUrl" -ForegroundColor Gray
        $results += @{Service="Supabase"; Status="✅ Working"}
    } catch {
        # 404 is actually OK for Supabase root endpoint
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   ✅ Supabase: Working (connection successful)" -ForegroundColor Green
            $results += @{Service="Supabase"; Status="✅ Working"}
        } else {
            Write-Host "   ❌ Supabase: Failed" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $results += @{Service="Supabase"; Status="❌ Failed"}
        }
    }
} else {
    Write-Host "   ⚠️  Supabase: Not configured" -ForegroundColor Yellow
    $results += @{Service="Supabase"; Status="⚠️ Not configured"}
}
Write-Host ""

# Summary
Write-Host "=" * 60
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "=" * 60

$working = ($results | Where-Object { $_.Status -like "*Working*" }).Count
$failed = ($results | Where-Object { $_.Status -like "*Failed*" }).Count
$notConfigured = ($results | Where-Object { $_.Status -like "*Not configured*" }).Count

foreach ($result in $results) {
    Write-Host "   $($result.Service): $($result.Status)"
}

Write-Host ""
Write-Host "Total: $($results.Count) services" -ForegroundColor White
Write-Host "  ✅ Working: $working" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red
Write-Host "  ⚠️  Not configured: $notConfigured" -ForegroundColor Yellow

Write-Host ""
if ($failed -gt 0) {
    Write-Host "⚠️  Action Required: Fix failed integrations" -ForegroundColor Yellow
    Write-Host "   See docs/ENVIRONMENT_VARIABLES.md for details" -ForegroundColor Gray
} elseif ($notConfigured -gt 0) {
    Write-Host "Tip: Configure missing services for full functionality" -ForegroundColor Yellow
} else {
    Write-Host "🎉 All integrations are working!" -ForegroundColor Green
}

Write-Host ""
Write-Host "For detailed documentation, see: docs/ENVIRONMENT_VARIABLES.md" -ForegroundColor Gray
