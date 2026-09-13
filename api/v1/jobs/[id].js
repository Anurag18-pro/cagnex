const { getDatabase } = require("../../_lib/db");
const { requireUser } = require("../../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = await requireUser(req);
  const sql = getDatabase();
  const [job] = await sql`
    select j.id, j.status, j.progress_pct, j.result_ref, j.error_message
    from jobs j join organization_members om on om.organization_id = j.organization_id
    where j.id = ${req.query.id} and om.user_id = ${userId}
  `;
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.status(200).json(job);
};
