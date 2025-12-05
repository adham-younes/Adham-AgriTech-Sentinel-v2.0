"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Settings,
  Loader2,
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Key,
  Mail,
  CreditCard,
  HelpCircle,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"

const professionalTranslations = {
  ar: {
    settings: "الإعدادات",
    general: "عام",
    account: "الحساب",
    notifications: "الإشعارات",
    security: "الأمان",
    privacy: "الخصوصية",
    appearance: "المظهر",
    dataManagement: "إدارة البيانات",
    billing: "الفواتير",
    help: "المساعدة",
    language: "اللغة",
    theme: "السمة",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    emailNotifications: "الإشعارات البريدية",
    pushNotifications: "الإشعارات الفورية",
    smsNotifications: "الإشعارات النصية",
    twoFactorAuth: "المصادقة الثنائية",
    changePassword: "تغيير كلمة المرور",
    exportData: "تصدير البيانات",
    deleteAccount: "حذف الحساب",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    success: "نجح",
    error: "خطأ",
    loading: "جاري التحميل...",
    profile: "الملف الشخصي",
    preferences: "التفضيلات",
    system: "النظام",
    notificationsEnabled: "الإشعارات مفعلة",
    notificationsDisabled: "الإشعارات معطلة",
    securityEnabled: "الأمان مفعّل",
    securityDisabled: "الأمان معطّل",
    dataExported: "تم تصدير البيانات",
    accountDeleted: "تم حذف الحساب",
    settingsSaved: "تم حفظ الإعدادات"
  },
  en: {
    settings: "Settings",
    general: "General",
    account: "Account",
    notifications: "Notifications",
    security: "Security",
    privacy: "Privacy",
    appearance: "Appearance",
    dataManagement: "Data Management",
    billing: "Billing",
    help: "Help",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    emailNotifications: "Email Notifications",
    pushNotifications: "Push Notifications",
    smsNotifications: "SMS Notifications",
    twoFactorAuth: "Two-Factor Authentication",
    changePassword: "Change Password",
    exportData: "Export Data",
    deleteAccount: "Delete Account",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    success: "Success",
    error: "Error",
    loading: "Loading...",
    profile: "Profile",
    preferences: "Preferences",
    system: "System",
    notificationsEnabled: "Notifications Enabled",
    notificationsDisabled: "Notifications Disabled",
    securityEnabled: "Security Enabled",
    securityDisabled: "Security Disabled",
    dataExported: "Data Exported",
    accountDeleted: "Account Deleted",
    settingsSaved: "Settings Saved"
  }
}

export default function ProfessionalSettingsPage() {
  const { language, setLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const t = professionalTranslations[lang]

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  const handleSaveSettings = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage({ type: "success", text: t.settingsSaved })
    } catch (error) {
      setMessage({ type: "error", text: t.error })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    setLoading(true)

    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000))

      setMessage({ type: "success", text: t.dataExported })
    } catch (error) {
      setMessage({ type: "error", text: t.error })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm(lang === "ar" ? "هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه." : "Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000))

      setMessage({ type: "success", text: t.accountDeleted })
    } catch (error) {
      setMessage({ type: "error", text: t.error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t.settings}
          </h1>
          <p className="text-gray-400 mt-2">
            {lang === "ar"
              ? "إدارة إعدادات حسابك وتفضيلات النظام"
              : "Manage your account settings and system preferences"
            }
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {[
                { icon: User, label: t.profile, id: "profile" },
                { icon: Bell, label: t.notifications, id: "notifications" },
                { icon: Shield, label: t.security, id: "security" },
                { icon: Globe, label: t.appearance, id: "appearance" },
                { icon: Database, label: t.dataManagement, id: "data" },
                { icon: CreditCard, label: t.billing, id: "billing" },
                { icon: HelpCircle, label: t.help, id: "help" }
              ].map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">{item.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.profile}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={lang === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={lang === "ar" ? "أدخل رقم هاتفك" : "Enter your phone number"}
                />
              </div>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.appearance}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.language}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLang("ar")
                      setLanguage("ar")
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${lang === "ar"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => {
                      setLang("en")
                      setLanguage("en")
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${lang === "en"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.theme}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${theme === "light"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    <Sun className="h-4 w-4" />
                    {t.lightMode}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${theme === "dark"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    <Moon className="h-4 w-4" />
                    {t.darkMode}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.notifications}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">{t.emailNotifications}</div>
                  <div className="text-sm text-gray-500">
                    {lang === "ar" ? "تلقي إشعارات عبر البريد الإلكتروني" : "Receive notifications via email"}
                  </div>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">{t.pushNotifications}</div>
                  <div className="text-sm text-gray-500">
                    {lang === "ar" ? "تلقي إشعارات فورية في المتصفح" : "Receive push notifications in browser"}
                  </div>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">{t.smsNotifications}</div>
                  <div className="text-sm text-gray-500">
                    {lang === "ar" ? "تلقي إشعارات عبر الرسائل النصية" : "Receive SMS notifications"}
                  </div>
                </div>
                <button
                  onClick={() => setSmsNotifications(!smsNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsNotifications ? "bg-blue-600" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.security}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">{t.twoFactorAuth}</div>
                  <div className="text-sm text-gray-500">
                    {lang === "ar" ? "إضافة طبقة إضافية من الأمان" : "Add an extra layer of security"}
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.changePassword}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={lang === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.dataManagement}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-700">{t.exportData}</div>
                  <div className="text-sm text-gray-500">
                    {lang === "ar" ? "تنزيل نسخة من بياناتك" : "Download a copy of your data"}
                  </div>
                </div>
                <Button
                  onClick={handleExportData}
                  disabled={loading}
                  variant="outline"
                  className="border-green-200 hover:bg-green-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <div className="font-medium text-red-700">{t.deleteAccount}</div>
                  <div className="text-sm text-red-600">
                    {lang === "ar" ? "حذف حسابك وجميع بياناتك بشكل دائم" : "Permanently delete your account and all data"}
                  </div>
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  variant="outline"
                  className="border-red-200 hover:bg-red-50 text-red-600"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t.loading}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t.saveChanges}
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1">
              {t.cancel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
