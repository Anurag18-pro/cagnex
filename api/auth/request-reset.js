const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: "Supabase email OTP is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel." });
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return res.status(200).json({ message: "If the account exists, a Supabase email OTP has been sent." });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Unable to send the email OTP." });
  }
};
