import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and Anon Key
const supabaseUrl = 'https://aiitfeybdnhktgmrkmwg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaXRmZXliZG5oa3RnbXJrbXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjQxNTYsImV4cCI6MjA3NTUwMDE1Nn0.mZvnwTcGc5VLa4xoL6dTGusyjUmn9w4P8W5bQ_1ErD4';

// FIX: Removed comparison to placeholder string which caused a TypeScript error.
if (!supabaseUrl) {
    console.error("Supabase URL is not configured. Please add it to services/supabaseClient.ts");
}
// FIX: Removed comparison to placeholder string which caused a TypeScript error.
if (!supabaseAnonKey) {
    console.error("Supabase Anon Key is not configured. Please add it to services/supabaseClient.ts");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);