// فحص قاعدة البيانات على Supabase
const { createClient } = require('@supabase/supabase-js')

const checkSupabaseDB = async () => {
  console.log('🔍 بدء فحص قاعدة البيانات على Supabase...\n')
  console.log('═══════════════════════════════════════════════════\n')

  const supabaseUrl = 'https://nptpmiljdljxjbgoxyqn.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdHBtaWxqZGxqeGpiZ294eXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQxNTIsImV4cCI6MjA3ODc5MDE1Mn0.jUEKrMu2xXQ5xLJABr8pJH1fuEDfSVPOjmFCmk5jOSA'

  const supabase = createClient(supabaseUrl, supabaseKey)

  const issues = []
  const success = []

  // 1. فحص الاتصال
  console.log('1️⃣ فحص الاتصال بـ Supabase...')
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('   ✅ الاتصال ناجح')
    success.push('الاتصال بـ Supabase')
  } catch (error) {
    console.error('   ❌ خطأ في الاتصال:', error.message)
    issues.push(`الاتصال: ${error.message}`)
  }

  // 2. فحص جدول profiles
  console.log('\n2️⃣ فحص جدول profiles...')
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`   ✅ جدول profiles موجود`)
    console.log(`   📊 عدد السجلات: ${count || 0}`)
    success.push('جدول profiles')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`جدول profiles: ${error.message}`)
  }

  // 3. فحص جدول farms
  console.log('\n3️⃣ فحص جدول farms...')
  try {
    const { data, error, count } = await supabase
      .from('farms')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`   ✅ جدول farms موجود`)
    console.log(`   📊 عدد السجلات: ${count || 0}`)
    success.push('جدول farms')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`جدول farms: ${error.message}`)
  }

  // 4. فحص جدول fields
  console.log('\n4️⃣ فحص جدول fields...')
  try {
    const { data, error, count } = await supabase
      .from('fields')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`   ✅ جدول fields موجود`)
    console.log(`   📊 عدد السجلات: ${count || 0}`)
    success.push('جدول fields')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`جدول fields: ${error.message}`)
  }

  // 5. فحص جدول soil_analysis
  console.log('\n5️⃣ فحص جدول soil_analysis...')
  try {
    const { data, error, count } = await supabase
      .from('soil_analysis')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`   ✅ جدول soil_analysis موجود`)
    console.log(`   📊 عدد السجلات: ${count || 0}`)
    success.push('جدول soil_analysis')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`جدول soil_analysis: ${error.message}`)
  }

  // 6. فحص جدول crop_monitoring
  console.log('\n6️⃣ فحص جدول crop_monitoring...')
  try {
    const { data, error, count } = await supabase
      .from('crop_monitoring')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`   ✅ جدول crop_monitoring موجود`)
    console.log(`   📊 عدد السجلات: ${count || 0}`)
    success.push('جدول crop_monitoring')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`جدول crop_monitoring: ${error.message}`)
  }

  // 7. فحص بنية جدول fields
  console.log('\n7️⃣ فحص بنية جدول fields...')
  try {
    const { data, error } = await supabase
      .from('fields')
      .select('id, name, latitude, longitude, boundary_coordinates, area, crop_type')
      .limit(1)
    
    if (error) throw error
    console.log('   ✅ بنية جدول fields صحيحة')
    if (data && data.length > 0) {
      const field = data[0]
      console.log('   📊 الأعمدة الموجودة:')
      Object.keys(field).forEach(key => {
        console.log(`      - ${key}: ${field[key] !== null ? '✅' : '⚠️ null'}`)
      })
    }
    success.push('بنية جدول fields')
  } catch (error) {
    console.error('   ❌ خطأ:', error.message)
    issues.push(`بنية جدول fields: ${error.message}`)
  }

  // النتيجة النهائية
  console.log('\n═══════════════════════════════════════════════════')
  console.log('📊 ملخص الفحص:\n')
  
  console.log(`✅ يعمل بشكل صحيح (${success.length}):`)
  success.forEach(item => console.log(`   - ${item}`))
  
  if (issues.length > 0) {
    console.log(`\n❌ مشاكل تحتاج إصلاح (${issues.length}):`)
    issues.forEach(item => console.log(`   - ${item}`))
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  
  if (issues.length === 0) {
    console.log('\n🎉 قاعدة البيانات تعمل بشكل ممتاز!')
  } else {
    console.log('\n⚠️  هناك مشاكل تحتاج إلى إصلاح')
  }
  
  return { success, issues }
}

// تشغيل الفحص
checkSupabaseDB().catch(console.error)
