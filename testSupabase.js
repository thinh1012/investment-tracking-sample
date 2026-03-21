
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log('Testing data fetch from Supabase...');

    // We need a user_id. Let's try to find one from the table first.
    const { data: firstEntry } = await supabase.from('user_vaults').select('user_id').limit(1).single();

    if (!firstEntry) {
        console.log('No data in user_vaults to test fetch.');
        return;
    }

    console.log('Fetching data for user:', firstEntry.user_id);
    const start = Date.now();
    try {
        const { data, error } = await supabase
            .from('user_vaults')
            .select('encrypted_data')
            .eq('user_id', firstEntry.user_id)
            .single();

        const duration = Date.now() - start;

        if (error) {
            console.error('❌ Fetch error:', error);
        } else {
            console.log('✅ Success! Data fetched.');
            console.log('Data size:', data.encrypted_data.length, 'chars');
            console.log('Duration:', duration, 'ms');
        }
    } catch (e) {
        console.error('💥 Exception during fetch:', e);
    }
}

testFetch();
