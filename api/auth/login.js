const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: "CAGNEX backend is not configured: DATABASE_URL is missing from the Vercel Production environment." });
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return res.status(503).json({ error: "CAGNEX backend is not configured: SESSION_SECRET must be at least 32 characters in the Vercel Production environment." });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: "Supabase email OTP is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel." });
    }
    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, password, account_type: accountType = "client", action, otp, access_token: accessToken } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    if (action === "reset-password") {
      if (typeof otp !== "string" || !/^\d{6}$/.test(otp) || typeof accessToken !== "string" || password.length < 8) {
        return res.status(400).json({ error: "Email, six-digit code, and a password of at least 8 characters are required" });
      }
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return res.status(503).json({ error: "Supabase email OTP is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel." });
      }
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || authData.user?.email?.toLowerCase() !== email.trim().toLowerCase()) {
        return res.status(401).json({ error: "The email OTP is invalid or expired. Request a new code." });
      }
      const sql = getDatabase();
      const [user] = await sql`select id from users where email = ${email.trim().toLowerCase()}`;
      if (!user) return res.status(400).json({ error: "The code is invalid or expired. Request a new code." });
      const passwordHash = await bcrypt.hash(password, 12);
      await sql`update users set password_hash = ${passwordHash} where id = ${user.id}`;
      setSessionCookie(res, await createSession(user.id));
      return res.status(200).json({ message: "Password updated", user_id: user.id });
    }

    const sql = getDatabase();
    const [user] = await sql`select id, name, email, phone_number, password_hash from users where email = ${email.trim().toLowerCase()}`;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const [organization] = await sql`
      select o.id, o.name, o.slug, om.role
      from organizations o join organization_members om on om.organization_id = o.id
      where om.user_id = ${user.id} order by o.created_at asc limit 1
    `;
    const roleGroups = { admin: ["super_admin", "managing_director"], employee: ["lead_underwriter", "credit_analyst"], client: ["external_auditor"] };
    if (!organization || !roleGroups[accountType]?.includes(organization.role)) {
      return res.status(403).json({ error: "This account is not enabled for the selected workspace" });
    }
    setSessionCookie(res, await createSession(user.id));
    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number }, organization });
  } catch (error) {
    if (error.code === "42703" || error.code === "42P01") return res.status(503).json({ error: "CAGNEX database schema is not up to date. Run the latest schema migration, then try again." });
    if (error.message === "DATABASE_URL is not configured" || error.message === "SESSION_SECRET must contain at least 32 characters") return res.status(503).json({ error: "CAGNEX backend is not configured. Add DATABASE_URL and a 32+ character SESSION_SECRET in Vercel." });
    throw error;
  }
};
