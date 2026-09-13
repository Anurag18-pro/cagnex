const bcrypt = require("bcryptjs");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, email, password } = req.body || {};
  if (!name || !email || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Name, email, and a password of at least 8 characters are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const sql = getDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const [user] = await sql`
      insert into users (name, email, password_hash)
      values (${name.trim()}, ${normalizedEmail}, ${passwordHash})
      returning id, name, email
    `;
    setSessionCookie(res, await createSession(user.id));
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "An account with that email already exists" });
    throw error;
  }
};
