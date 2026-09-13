const { randomUUID } = require("node:crypto");
const { requireDealAccess } = require("../../../../_lib/deal-auth");

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const { sql } = await requireDealAccess(req, id);
  if (req.method === "GET") {
    const documents = await sql`
      select id as document_id, filename, document_type, version_label, page_count,
             processing_status as status, progress_pct, created_at, updated_at
      from deal_documents where deal_id = ${id} order by created_at desc
    `;
    return res.status(200).json({ documents });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { filename, document_type_hint: documentTypeHint = null, storage_key: storageKey = randomUUID() } = req.body || {};
  if (typeof filename !== "string" || !filename.trim()) return res.status(400).json({ error: "filename is required" });
  const [document] = await sql`
    insert into deal_documents (deal_id, filename, storage_key, document_type)
    values (${id}, ${filename.trim()}, ${storageKey}, ${documentTypeHint})
    returning id as document_id, filename, processing_status as status, progress_pct
  `;
  return res.status(202).json(document);
};
