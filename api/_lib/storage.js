const { createClient } = require("@supabase/supabase-js");

function getStorage() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_STORAGE_BUCKET) {
    const error = new Error("Supabase Storage is not configured. Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.");
    error.statusCode = 503;
    throw error;
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { getStorage };
