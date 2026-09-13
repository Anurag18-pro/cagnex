const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const accessToken = typeof req.body?.access_token === "string" ? req.body.access_token : "";
  if (!email || !/^\d{6}$/.test(otp) || !accessToken || password.length < 8) {
    return res.status(400).json({ error: "Email, six-digit code, and a password of at least 8 characters are required" });
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: "Supabase email OTP is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel." });
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || authData.user?.email?.toLowerCase() !== email) {
      return res.status(401).json({ error: "The email OTP is invalid or expired. Request a new code." });
    }

    const sql = getDatabase();
    const [token] = await sql`
      select id
      from users
      where email = ${email}
    `;
    if (!token) return res.status(400).json({ error: "The code is invalid or expired. Request a new code." });

    const passwordHash = await bcrypt.hash(password, 12);
    await sql`update users set password_hash = ${passwordHash} where id = ${token.id}`;
    setSessionCookie(res, await createSession(token.id));
    return res.status(200).json({ message: "Password updated", user_id: token.id });
  } catch (error) {
    if (error.code === "42703" || error.code === "42P01") return res.status(503).json({ error: "CAGNEX database schema is not up to date." });
    throw error;
  }
};
