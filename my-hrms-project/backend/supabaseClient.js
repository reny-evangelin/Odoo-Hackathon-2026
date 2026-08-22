const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://wtjqcxojeswnkgjqwkol.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_NtAoSoQy1c-Vu7BDeojC0Q_UbUOdrTG';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Missing SUPABASE_URL or SUPABASE_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase, supabaseUrl };
