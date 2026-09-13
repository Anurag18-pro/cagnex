const { getDatabase } = require("../_lib/db");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = await requireUser(req);
  const sql = getDatabase();
  const [membership] = await sql`select organization_id, role from organization_members where user_id = ${userId} order by created_at asc limit 1`;
  if (!membership) return res.status(403).json({ error: "Workspace membership required" });
  const [organization] = await sql`select id, name, slug from organizations where id = ${membership.organization_id}`;
  const [people] = await sql`select count(*)::int as count from organization_members where organization_id = ${membership.organization_id}`;
  const [deals] = await sql`select count(*)::int as count, coalesce(sum(flags_count), 0)::int as flags from deals where organization_id = ${membership.organization_id}`;
  const team = await sql`
    select u.id, u.name, u.email, om.role, count(d.id)::int as assigned_deals,
           coalesce(sum(d.flags_count), 0)::int as assigned_flags
    from organization_members om
    join users u on u.id = om.user_id
    left join deals d on d.assigned_to = u.id and d.organization_id = om.organization_id
    where om.organization_id = ${membership.organization_id}
    group by u.id, u.name, u.email, om.role
    order by u.name
  `;
  return res.status(200).json({ organization, role: membership.role, people: people.count, deals: deals.count, flags: deals.flags, team });
};
