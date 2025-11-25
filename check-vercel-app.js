// فحص التطبيق المنشور على Vercel
const checkVercelApp = async () => {
  console.log('🔍 بدء فحص التطبيق على Vercel...\n')
  console.log('═══════════════════════════════════════════════════\n')

  const baseUrl = 'https://adham-agritech.com'
  const errors = []
  const warnings = []
  const success = []

  // 1. فحص الصفحة الرئيسية
  console.log('1️⃣ فحص الصفحة الرئيسية...')
  try {
    const response = await fetch(baseUrl)
    if (response.ok) {
      console.log('   ✅ الصفحة الرئيسية تعمل')
      console.log(`   📊 Status: ${response.status}`)
      success.push('الصفحة الرئيسية')
    } else {
      console.log(`   ❌ خطأ: ${response.status}`)
      errors.push(`الصفحة الرئيسية: ${response.status}`)
    }
  } catch (error) {
    console.error('   ❌ خطأ في الاتصال:', error.message)
    errors.push(`الصفحة الرئيسية: ${error.message}`)
  }

  // 2. فحص API Health
  console.log('\n2️⃣ فحص API Health...')
  try {
    const response = await fetch(`${baseUrl}/api/system/health`)
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ API Health يعمل')
      console.log(`   📊 النتيجة: ${JSON.stringify(data).substring(0, 100)}...`)
      success.push('API Health')
    } else {
      console.log(`   ❌ خطأ: ${response.status}`)
      errors.push(`API Health: ${response.status}`)
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    errors.push(`API Health: ${error.message}`)
  }

  // 3. فحص صفحة Dashboard
  console.log('\n3️⃣ فحص صفحة Dashboard...')
  try {
    const response = await fetch(`${baseUrl}/dashboard`)
    if (response.ok) {
      console.log('   ✅ Dashboard يعمل')
      console.log(`   📊 Status: ${response.status}`)
      success.push('Dashboard')
    } else {
      console.log(`   ⚠️  Dashboard: ${response.status}`)
      warnings.push(`Dashboard: ${response.status} (قد يحتاج تسجيل دخول)`)
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    errors.push(`Dashboard: ${error.message}`)
  }

  // 4. فحص API EOSDA
  console.log('\n4️⃣ فحص API EOSDA...')
  try {
    const response = await fetch(`${baseUrl}/api/eosda?type=ndvi&lat=30.0444&lng=31.2357`)
    console.log(`   📊 Status: ${response.status}`)
    
    if (response.ok) {
      console.log('   ✅ EOSDA API يعمل')
      success.push('EOSDA API')
    } else if (response.status === 503) {
      console.log('   ⚠️  EOSDA API غير مُكوّن')
      warnings.push('EOSDA API: غير مُكوّن')
    } else {
      const data = await response.json()
      console.log(`   ⚠️  EOSDA: ${data.error || response.statusText}`)
      warnings.push(`EOSDA API: ${data.error || response.statusText}`)
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    errors.push(`EOSDA API: ${error.message}`)
  }

  // 5. فحص صفحة Soil Analysis
  console.log('\n5️⃣ فحص صفحة Soil Analysis...')
  try {
    const response = await fetch(`${baseUrl}/dashboard/soil-analysis`)
    if (response.ok) {
      console.log('   ✅ Soil Analysis يعمل')
      console.log(`   📊 Status: ${response.status}`)
      success.push('Soil Analysis')
    } else {
      console.log(`   ⚠️  Soil Analysis: ${response.status}`)
      warnings.push(`Soil Analysis: ${response.status}`)
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    errors.push(`Soil Analysis: ${error.message}`)
  }

  // 6. فحص صفحة Satellite
  console.log('\n6️⃣ فحص صفحة Satellite...')
  try {
    const response = await fetch(`${baseUrl}/dashboard/satellite`)
    if (response.ok) {
      console.log('   ✅ Satellite يعمل')
      console.log(`   📊 Status: ${response.status}`)
      success.push('Satellite')
    } else {
      console.log(`   ⚠️  Satellite: ${response.status}`)
      warnings.push(`Satellite: ${response.status}`)
    }
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    errors.push(`Satellite: ${error.message}`)
  }

  // النتيجة النهائية
  console.log('\n═══════════════════════════════════════════════════')
  console.log('📊 ملخص الفحص:\n')
  
  console.log(`✅ يعمل بشكل صحيح (${success.length}):`)
  success.forEach(item => console.log(`   - ${item}`))
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  تحذيرات (${warnings.length}):`)
    warnings.forEach(item => console.log(`   - ${item}`))
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ أخطاء (${errors.length}):`)
    errors.forEach(item => console.log(`   - ${item}`))
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  
  if (errors.length === 0) {
    console.log('\n🎉 التطبيق يعمل بشكل جيد!')
    if (warnings.length > 0) {
      console.log('⚠️  هناك بعض التحذيرات التي يمكن تحسينها')
    }
  } else {
    console.log('\n⚠️  هناك أخطاء تحتاج إلى إصلاح')
  }
  
  return { success, warnings, errors }
}

// تشغيل الفحص
checkVercelApp().catch(console.error)
