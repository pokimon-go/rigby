// Supabase client setup
// This file connects our frontend to the Supabase backend

const SUPABASE_URL = https://toxglihwfbfnnhfhjofr.supabase.co ;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGdsaWh3ZmJmbm5oZmhqb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTk5NjcsImV4cCI6MjA5NTE5NTk2N30.Kow-Kjvw8NmAuPe9nHJZKY3qb96mLz4niXYbZ3tNDrQ ;

// Load Supabase from CDN (no npm needed)
// This creates the `supabase` object used by all other JS files
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
