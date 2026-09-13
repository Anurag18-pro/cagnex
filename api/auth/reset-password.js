const bcrypt = require("bcryptjs");
const { createHash } = require("node:crypto");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !/^\d{6}$/.test(otp) || password.length < 8) {
    return res.status(400).json({ error: "Email, six-digit code, and a password of at least 8 characters are required" });
  }

  try {
    const sql = getDatabase();
    const [token] = await sql`
      select pr.id, pr.user_id
      from password_reset_tokens pr
      join users u on u.id = pr.user_id
      where u.email = ${email}
        and pr.token_hash = ${createHash("sha256").update(otp).digest("hex")}
        and pr.expires_at > now()
        and pr.used_at is null
        and pr.attempts < 5
    `;
    if (!token) return res.status(400).json({ error: "The code is invalid or expired. Request a new code." });

    const passwordHash = await bcrypt.hash(password, 12);
    await sql`update users set password_hash = ${passwordHash} where id = ${token.user_id}`;
    await sql`update password_reset_tokens set used_at = now() where id = ${token.id}`;
    setSessionCookie(res, await createSession(token.user_id));
    return res.status(200).json({ message: "Password updated", user_id: token.user_id });
  } catch (error) {
    if (error.code === "42P01") return res.status(503).json({ error: "Password reset is not configured yet. Run the latest database migration." });
    throw error;
  }
};
