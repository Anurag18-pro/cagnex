const { getDatabase } = require("../../_lib/db");
const { requireUser } = require("../../_lib/auth");

module.exports = async function handler(req, res) {
  const userId = await requireUser(req);
  const sql = getDatabase();
  if (req.method === "GET") {
    const deals = await sql`
      select d.id, d.name, d.borrower_name, d.facility_type, d.facility_amount,
             d.status, d.flags_count, d.updated_at
      from deals d
      join organization_members om on om.organization_id = d.organization_id
      where om.user_id = ${userId}
      order by d.updated_at desc
    `;
    return res.status(200).json({ deals });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, workspace_id: workspaceId, facility_type: facilityType = "Term Loan B", borrower_name: borrowerName = "", facility_amount: facilityAmount = null } = req.body || {};
  if (typeof name !== "string" || !name.trim() || typeof workspaceId !== "string") {
    return res.status(400).json({ error: "name and workspace_id are required" });
  }
  const [membership] = await sql`select organization_id from organization_members where organization_id = ${workspaceId} and user_id = ${userId}`;
  if (!membership) return res.status(403).json({ error: "You do not have access to this workspace" });
  const [deal] = await sql`
    insert into deals (organization_id, name, borrower_name, facility_type, facility_amount, created_by)
    values (${workspaceId}, ${name.trim()}, ${borrowerName.trim()}, ${facilityType}, ${facilityAmount}, ${userId})
    returning id, name, status, created_at
  `;
  return res.status(201).json({ deal_id: deal.id, deal });
};
