from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import random

# --- 1. إعدادات التطبيق وثوابت التصميم (Design System Constants) ---
# هذه القيم موجهة لفرق الواجهة الأمامية لضمان التناغم مع الـ Backend Response
class ThemeColors:
    PRIMARY_GREEN = "#00FF9D"  # الأخضر الزاهي (Adham AgriTech Green)
    DARK_BG = "#121212"        # الأسود الداكن المطفي
    
    # ألوان الخطورة (Severity Colors)
    SEVERITY_HIGH = "#FF4444"    # أحمر
    SEVERITY_MEDIUM = "#FFAA00"  # برتقالي
    SEVERITY_LOW = "#00FF9D"     # أخضر (نفس لون القالب للحالات الجيدة)

app = FastAPI(
    title="Adham AgriTech - AI Diagnosis Microservice",
    description="Microservice for analyzing crop images using Simulated AI logic.",
    version="1.0.0"
)

# إعداد CORS للسماح للواجهة الأمامية بالاتصال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يجب تقييد هذا في الإنتاج بـ adham-agritech.com
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. نماذج البيانات (Data Models) ---
class DiagnosisResponse(BaseModel):
    filename: str
    disease_name: str
    confidence_score: float
    severity: str  # High, Medium, Low
    severity_color_hex: str # نرسل كود اللون المقترح مباشرة للواجهة
    recommendation_id: str
    message: str

# --- 3. منطق المحاكاة (Simulated AI Logic) ---
def simulate_ai_inference(file_size: int, filename: str) -> dict:
    """
    دالة تحاكي عمل نموذج الذكاء الاصطناعي.
    تستخدم حجم الملف لتحديد السيناريو (لأغراض الاختبار فقط).
    """
    # سيناريو 1: ملفات صغيرة -> حالة "صحية" (Healthy)
    if file_size < 500 * 1024:  # أقل من 500KB
        return {
            "disease": "Healthy Crop (No Disease Detected)",
            "confidence": 0.98,
            "severity": "Low",
            "color": ThemeColors.SEVERITY_LOW,
            "rec_id": "REC_HEALTHY_001",
            "msg": "المحصول يبدو في حالة ممتازة. استمر في برنامج الري الحالي."
        }
    
    # سيناريو 2: ملفات متوسطة -> حالة "نقص عناصر" (Warning)
    elif file_size < 2 * 1024 * 1024: # أقل من 2MB
        return {
            "disease": "Potassium Deficiency (نقص بوتاسيوم)",
            "confidence": 0.85,
            "severity": "Medium",
            "color": ThemeColors.SEVERITY_MEDIUM,
            "rec_id": "REC_NUTRIENT_045",
            "msg": "تم رصد اصفرار في حواف الأوراق، مما يشير لنقص البوتاسيوم."
        }
    
    # سيناريو 3: ملفات كبيرة -> حالة "مرض خطير" (Critical)
    else:
        return {
            "disease": "Late Blight (اللفحة المتأخرة)",
            "confidence": 0.92,
            "severity": "High",
            "color": ThemeColors.SEVERITY_HIGH,
            "rec_id": "REC_DISEASE_990",
            "msg": "تحذير: علامات واضحة للفحة المتأخرة. يتطلب تدخلاً كيميائياً فورياً."
        }

# --- 4. نقطة النهاية (API Endpoint) ---
@app.post("/api/v1/diagnose_image", response_model=DiagnosisResponse)
async def diagnose_crop_image(file: UploadFile = File(...)):
    """
    Endpoint يستقبل صورة ويقوم بتشغيل نموذج التشخيص (المكاكي).
    """
    try:
        # قراءة محتوى الملف (فقط للحصول على الحجم للمحاكاة)
        contents = await file.read()
        file_size = len(contents)
        
        # تشغيل المحاكاة
        result = simulate_ai_inference(file_size, file.filename)
        
        return DiagnosisResponse(
            filename=file.filename,
            disease_name=result["disease"],
            confidence_score=result["confidence"],
            severity=result["severity"],
            severity_color_hex=result["color"], # هذا الحقل يحل مشكلة الألوان في الواجهة
            recommendation_id=result["rec_id"],
            message=result["msg"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# نقطة فحص الصحة (Health Check)
@app.get("/")
def health_check():
    return {"status": "operational", "service": "AI Diagnosis Unit"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
