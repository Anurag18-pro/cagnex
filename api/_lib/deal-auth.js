const { getDatabase } = require("./db");
const { requireUser } = require("./auth");

async function requireDealAccess(req, dealId) {
  const userId = await requireUser(req);
  const sql = getDatabase();
  const [membership] = await sql`
    select om.organization_id, om.role
    from organization_members om
    join deals d on d.organization_id = om.organization_id
    where om.user_id = ${userId} and d.id = ${dealId}
  `;
  if (!membership) {
    const error = new Error("Deal not found");
    error.statusCode = 404;
    throw error;
  }
  return { userId, organizationId: membership.organization_id, role: membership.role, sql };
}

module.exports = { requireDealAccess };
