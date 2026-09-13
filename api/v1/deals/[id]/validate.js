const { requireDealAccess } = require("../../../_lib/deal-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id } = req.query;
  const { organizationId, sql } = await requireDealAccess(req, id);
  const scope = req.body?.scope || "all";
  if (!["all", "covenants", "financials"].includes(scope)) return res.status(400).json({ error: "Invalid validation scope" });
  const [job] = await sql`insert into jobs (organization_id, deal_id, type) values (${organizationId}, ${id}, ${"validate:" + scope}) returning id, status`;
  await sql`update deals set status = 'parsing', updated_at = now() where id = ${id}`;
  return res.status(202).json({ job_id: job.id, status: job.status });
};
