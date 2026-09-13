const bcrypt = require("bcryptjs");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = getDatabase();
  const [user] = await sql`select id, name, email, password_hash from users where email = ${email.trim().toLowerCase()}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  setSessionCookie(res, await createSession(user.id));
  return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
};
