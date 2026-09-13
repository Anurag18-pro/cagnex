const { getDatabase } = require("../_lib/db");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = await requireUser(req);
  const sql = getDatabase();
  const [user] = await sql`select id, name, email, created_at from users where id = ${userId}`;
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ user });
};
