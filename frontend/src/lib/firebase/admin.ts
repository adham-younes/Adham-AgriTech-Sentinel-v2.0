import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// تحميل المفاتيح من ملف التكوين
const serviceAccount = require('../../config/firebase-admin-config.json');

// تهيئة Firebase Admin SDK
const adminApp = !getApps().length 
  ? initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    })
  : getApps()[0];

// تصدير الخدمات
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };

// دالة مساعدة للتحقق من صلاحيات المستخدم
export const verifyUserRole = async (uid: string, requiredRole: string) => {
  try {
    const user = await adminAuth.getUser(uid);
    const token = await adminAuth.createCustomToken(uid);
    const idTokenResult = await adminAuth.verifyIdToken(token);
    
    return idTokenResult.role === requiredRole;
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات المستخدم:', error);
    return false;
  }
};
