const { getDatabase } = require("../_lib/db");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = await requireUser(req);
  const sql = getDatabase();
  const [user] = await sql`select id, name, email, phone_number, created_at from users where id = ${userId}`;
  if (!user) return res.status(404).json({ error: "User not found" });
  const [organization] = await sql`
    select o.id, o.name, o.slug, om.role
    from organizations o
    join organization_members om on om.organization_id = o.id
    where om.user_id = ${userId}
    order by o.created_at asc
    limit 1
  `;
  return res.status(200).json({ user, organization: organization || null });
};
