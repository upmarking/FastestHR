const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read config to extract credentials (assuming local dev)
const content = fs.readFileSync('supabase/.env', 'utf-8');
console.log(content);
