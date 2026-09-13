const { getDatabase } = require("../_lib/db");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  const userId = await requireUser(req);
  const sql = getDatabase();
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { name, description, trigger, active } = req.body || {};
    const [workflow] = await sql`
      update workflows
      set name = coalesce(${typeof name === "string" ? name.trim() : null}, name),
          description = coalesce(${typeof description === "string" ? description.trim() : null}, description),
          trigger = coalesce(${typeof trigger === "string" ? trigger.trim() : null}, trigger),
          active = coalesce(${typeof active === "boolean" ? active : null}, active),
          updated_at = now()
      where id = ${id} and user_id = ${userId}
      returning id, name, description, trigger, active, runs, created_at, updated_at
    `;
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    return res.status(200).json({ workflow });
  }

  if (req.method === "DELETE") {
    const deleted = await sql`delete from workflows where id = ${id} and user_id = ${userId} returning id`;
    if (deleted.length !== 1) return res.status(404).json({ error: "Workflow not found" });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
};
