const { getDatabase } = require("../_lib/db");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  const userId = await requireUser(req);
  const sql = getDatabase();

  if (req.method === "GET") {
    const workflows = await sql`
      select id, name, description, trigger, active, runs, created_at, updated_at
      from workflows where user_id = ${userId} order by updated_at desc
    `;
    return res.status(200).json({ workflows });
  }

  if (req.method === "POST") {
    const { name, description = "", trigger } = req.body || {};
    if (typeof name !== "string" || !name.trim() || typeof trigger !== "string" || !trigger.trim()) {
      return res.status(400).json({ error: "Name and trigger are required" });
    }
    const [workflow] = await sql`
      insert into workflows (user_id, name, description, trigger)
      values (${userId}, ${name.trim()}, ${description.trim()}, ${trigger.trim()})
      returning id, name, description, trigger, active, runs, created_at, updated_at
    `;
    return res.status(201).json({ workflow });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
