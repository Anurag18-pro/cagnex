const { requireDealAccess } = require("../../../../../_lib/deal-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });
  const { id, documentId } = req.query;
  const { sql } = await requireDealAccess(req, id);
  const deleted = await sql`delete from deal_documents where id = ${documentId} and deal_id = ${id} returning id`;
  if (deleted.length !== 1) return res.status(404).json({ error: "Document not found" });
  return res.status(204).end();
};
