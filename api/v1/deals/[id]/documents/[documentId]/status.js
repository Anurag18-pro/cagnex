const { requireDealAccess } = require("../../../../../_lib/deal-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id, documentId } = req.query;
  const { sql } = await requireDealAccess(req, id);
  const [document] = await sql`
    select processing_status as status, progress_pct, d.flags_count
    from deal_documents dd join deals d on d.id = dd.deal_id
    where dd.id = ${documentId} and dd.deal_id = ${id}
  `;
  if (!document) return res.status(404).json({ error: "Document not found" });
  return res.status(200).json({ ...document, flags_count: document.flags_count || 0 });
};
