const { createHash, randomInt } = require("node:crypto");
const { getDatabase } = require("../_lib/db");
const { sendEmail } = require("../_lib/email");

const hashOtp = (otp) => createHash("sha256").update(otp).digest("hex");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const sql = getDatabase();
    const [user] = await sql`select id, name, email from users where email = ${email}`;
    if (user) {
      const otp = String(randomInt(100000, 1000000));
      await sql`delete from password_reset_tokens where user_id = ${user.id}`;
      await sql`
        insert into password_reset_tokens (user_id, token_hash, expires_at)
        values (${user.id}, ${hashOtp(otp)}, now() + interval '10 minutes')
      `;
      await sendEmail({
        to: user.email,
        subject: "Your CAGNEX password reset code",
        text: `Hi ${user.name},\n\nYour CAGNEX password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`
      });
    }
    return res.status(200).json({ message: "If an account exists for that email, a reset code has been sent." });
  } catch (error) {
    if (error.code === "42P01") return res.status(503).json({ error: "Password reset is not configured yet. Run the latest database migration." });
    if (error.message.startsWith("Email delivery")) return res.status(503).json({ error: error.message });
    throw error;
  }
};
