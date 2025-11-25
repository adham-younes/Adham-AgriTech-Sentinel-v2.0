# استخدام صورة Python خفيفة
FROM python:3.9-slim

# إعداد مجلد العمل
WORKDIR /app

# نسخ المتطلبات وتثبيتها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ باقي الكود
COPY . .

# فتح المنفذ (Google Cloud Run يتطلب الاستماع للمنفذ المحدد في المتغير PORT)
ENV PORT=8080
EXPOSE 8080

# تشغيل التطبيق
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
