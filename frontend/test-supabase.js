
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('fields').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
        } else {
            console.log('Connection successful!');
            console.log('Fields count:', data); // data is null for head: true, count is in count property
        }

        // Try to fetch one field to see structure
        const { data: fields, error: fieldsError } = await supabase.from('fields').select('*').limit(1);
        if (fieldsError) {
            console.error('Error fetching fields:', fieldsError.message);
        } else {
            console.log('Sample field:', fields[0]);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
