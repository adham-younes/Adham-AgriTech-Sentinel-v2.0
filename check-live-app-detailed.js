// فحص شامل للتطبيق المنشور على adham-agritech.com
const checkLiveApp = async () => {
  console.log('🔍 بدء فحص شامل للتطبيق المنشور...\n')
  console.log('═══════════════════════════════════════════════════\n')

  const baseUrl = 'https://adham-agritech.com'
  const findings = {
    working: [],
    issues: [],
    warnings: []
  }

  // 1. فحص الصفحة الرئيسية
  console.log('1️⃣ فحص الصفحة الرئيسية...')
  try {
    const response = await fetch(baseUrl)
    const html = await response.text()
    console.log(`   ✅ Status: ${response.status}`)
    console.log(`   📊 Size: ${(html.length / 1024).toFixed(2)} KB`)
    
    // فحص Next.js version
    const nextMatch = html.match(/Next\.js (\d+\.\d+\.\d+)/)
    if (nextMatch) {
      console.log(`   📦 Next.js: ${nextMatch[1]}`)
    }
    
    findings.working.push('الصفحة الرئيسية')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    findings.issues.push(`الصفحة الرئيسية: ${error.message}`)
  }

  // 2. فحص صفحة إضافة مزرعة (المشكلة)
  console.log('\n2️⃣ فحص صفحة إضافة مزرعة...')
  try {
    const response = await fetch(`${baseUrl}/dashboard/farms/new`)
    const html = await response.text()
    console.log(`   📊 Status: ${response.status}`)
    
    // فحص وجود الأخطاء في HTML
    if (html.includes('Application error')) {
      console.log('   ❌ يحتوي على Application error')
      findings.issues.push('صفحة إضافة مزرعة: يحتوي على Application error')
    } else if (html.includes('error')) {
      console.log('   ⚠️  يحتوي على كلمة error')
      findings.warnings.push('صفحة إضافة مزرعة: يحتوي على كلمة error')
    } else {
      console.log('   ✅ لا توجد أخطاء ظاهرة')
      findings.working.push('صفحة إضافة مزرعة')
    }
    
    // فحص وجود eosda config
    if (html.includes('eosdaPublicConfig') || html.includes('eosda')) {
      console.log('   📍 يحتوي على eosda config')
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    findings.issues.push(`صفحة إضافة مزرعة: ${error.message}`)
  }

  // 3. فحص API Health
  console.log('\n3️⃣ فحص API Health...')
  try {
    const response = await fetch(`${baseUrl}/api/system/health`)
    const data = await response.json()
    console.log('   ✅ API Health يعمل')
    console.log(`   📊 الخدمات:`)
    if (data.services) {
      data.services.forEach(service => {
        console.log(`      - ${service.label}: ${service.status}`)
      })
    }
    findings.working.push('API Health')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    findings.issues.push(`API Health: ${error.message}`)
  }

  // 4. فحص API Farms
  console.log('\n4️⃣ فحص API Farms...')
  try {
    const response = await fetch(`${baseUrl}/api/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Farm',
        location: 'Test Location',
        total_area: 10,
        latitude: 26.8206,
        longitude: 30.8025
      })
    })
    
    const data = await response.json()
    console.log(`   📊 Status: ${response.status}`)
    console.log(`   📄 Response: ${JSON.stringify(data).substring(0, 100)}...`)
    
    if (response.status === 401) {
      console.log('   ℹ️  يحتاج تسجيل دخول (متوقع)')
      findings.working.push('API Farms (يحتاج auth)')
    } else if (data.error && data.error.includes('not defined')) {
      console.log('   ❌ يحتوي على خطأ "not defined"')
      findings.issues.push('API Farms: يحتوي على خطأ "not defined"')
    } else {
      console.log('   ✅ يعمل بشكل صحيح')
      findings.working.push('API Farms')
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    findings.issues.push(`API Farms: ${error.message}`)
  }

  // 5. فحص JavaScript bundles
  console.log('\n5️⃣ فحص JavaScript bundles...')
  try {
    const response = await fetch(`${baseUrl}/dashboard/farms/new`)
    const html = await response.text()
    
    // استخراج script tags
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"[^>]*>/g) || []
    console.log(`   📦 عدد Scripts: ${scriptMatches.length}`)
    
    // فحص أول script
    if (scriptMatches.length > 0) {
      const firstScript = scriptMatches[0].match(/src="([^"]+)"/)
      if (firstScript) {
        const scriptUrl = firstScript[1].startsWith('http') 
          ? firstScript[1] 
          : `${baseUrl}${firstScript[1]}`
        
        try {
          const scriptResponse = await fetch(scriptUrl)
          const scriptContent = await scriptResponse.text()
          console.log(`   📊 حجم أول script: ${(scriptContent.length / 1024).toFixed(2)} KB`)
          
          // فحص وجود eosda في الكود
          if (scriptContent.includes('eosdaPublicConfig')) {
            console.log('   📍 يحتوي على eosdaPublicConfig')
          }
          
          // فحص وجود process.env
          if (scriptContent.includes('process.env')) {
            console.log('   ⚠️  يحتوي على process.env (قد يسبب مشاكل)')
            findings.warnings.push('JavaScript: يحتوي على process.env')
          }
        } catch (e) {
          console.log('   ⚠️  لا يمكن فحص محتوى script')
        }
      }
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
  }

  // 6. فحص Build ID
  console.log('\n6️⃣ فحص Build ID...')
  try {
    const response = await fetch(`${baseUrl}/_next/static/chunks/webpack.js`)
    if (response.ok) {
      console.log('   ✅ Webpack chunk موجود')
    }
    
    // محاولة الحصول على build ID
    const htmlResponse = await fetch(baseUrl)
    const html = await htmlResponse.text()
    const buildIdMatch = html.match(/"buildId":"([^"]+)"/)
    if (buildIdMatch) {
      console.log(`   🏗️  Build ID: ${buildIdMatch[1]}`)
    }
  } catch (error) {
    console.log('   ⚠️  لا يمكن تحديد Build ID')
  }

  // النتيجة النهائية
  console.log('\n═══════════════════════════════════════════════════')
  console.log('📊 ملخص الفحص:\n')
  
  console.log(`✅ يعمل بشكل صحيح (${findings.working.length}):`)
  findings.working.forEach(item => console.log(`   - ${item}`))
  
  if (findings.warnings.length > 0) {
    console.log(`\n⚠️  تحذيرات (${findings.warnings.length}):`)
    findings.warnings.forEach(item => console.log(`   - ${item}`))
  }
  
  if (findings.issues.length > 0) {
    console.log(`\n❌ مشاكل (${findings.issues.length}):`)
    findings.issues.forEach(item => console.log(`   - ${item}`))
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  
  // التوصية
  if (findings.issues.length > 0) {
    console.log('\n🎯 التوصية:')
    console.log('   التطبيق المنشور يحتوي على أخطاء')
    console.log('   يجب نشر الإصلاحات المحلية')
  } else {
    console.log('\n🎉 التطبيق المنشور يعمل بشكل جيد!')
  }
  
  return findings
}

// تشغيل الفحص
checkLiveApp().catch(console.error)
