import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DISEASES = [
    {
        name_en: 'Powdery Mildew',
        name_ar: 'البياض الدقيقي',
        type_en: 'Fungal',
        type_ar: 'فطري',
        conditions_en: 'High humidity and moderate temperatures',
        conditions_ar: 'رطوبة عالية ودرجات حرارة معتدلة',
        severity_en: 'Moderate',
        severity_ar: 'متوسط',
        cause_agent: 'Erysiphales fungi',
        symptoms_en: 'White powdery spots on leaves and stems',
        symptoms_ar: 'بقع بيضاء تشبه الدقيق على الأوراق والسيقان',
        recommended_treatment_en: 'Fungicides, Pruning',
        recommended_treatment_ar: 'مبيدات فطرية، التقليم'
    },
    {
        name_en: 'Root Rot',
        name_ar: 'عفن الجذور',
        type_en: 'Fungal',
        type_ar: 'فطري',
        conditions_en: 'Overwatering and poor drainage',
        conditions_ar: 'الري الزائد وسوء الصرف',
        severity_en: 'High',
        severity_ar: 'عالي',
        cause_agent: 'Pythium, Phytophthora',
        symptoms_en: 'Yellowing leaves, wilted plants, mushy roots',
        symptoms_ar: 'اصفرار الأوراق، ذبول النباتات، جذور طرية',
        recommended_treatment_en: 'Improve drainage, Fungicides',
        recommended_treatment_ar: 'تحسين الصرف، مبيدات فطرية'
    },
    {
        name_en: 'Aphids',
        name_ar: 'المن',
        type_en: 'Insect',
        type_ar: 'حشري',
        conditions_en: 'Warm weather',
        conditions_ar: 'طقس دافئ',
        severity_en: 'Low to Moderate',
        severity_ar: 'منخفض إلى متوسط',
        cause_agent: 'Aphidoidea',
        symptoms_en: 'Curled leaves, sticky honeydew',
        symptoms_ar: 'تجعد الأوراق، ندوة عسلية لزجة',
        recommended_treatment_en: 'Neem oil, Ladybugs',
        recommended_treatment_ar: 'زيت النيم، الدعسوقة'
    }
];

async function seed() {
    console.log('Seeding knowledge base...');

    for (const disease of DISEASES) {
        const { data, error } = await supabase
            .from('disease_pests')
            .upsert(disease, { onConflict: 'name_en' })
            .select();

        if (error) {
            console.error(`Error inserting ${disease.name_en}:`, error);
        } else {
            console.log(`Inserted/Updated: ${disease.name_en}`);
        }
    }

    console.log('Seeding complete.');
}

seed().catch(console.error);
