const { randomUUID } = require("node:crypto");
const { requireDealAccess } = require("../../../../_lib/deal-auth");
const { getStorage } = require("../../../../_lib/storage");

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
  const { filename, content_type: contentType = "application/octet-stream", document_type_hint: documentTypeHint = null } = req.body || {};
  if (typeof filename !== "string" || !filename.trim()) return res.status(400).json({ error: "filename is required" });
  if (filename.length > 255 || !/^[\w .()\-]+$/.test(filename)) return res.status(400).json({ error: "filename contains unsupported characters" });
  if (!/^(application\/pdf|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|image\/(png|jpeg))/.test(contentType)) {
    return res.status(415).json({ error: "Only PDF, Excel, PNG, and JPEG documents are accepted" });
  }
  const storageKey = `${organizationId}/${id}/${randomUUID()}-${filename.trim()}`;
  let storage;
  try {
    storage = getStorage();
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.message });
  }
  const { data: upload, error: uploadError } = await storage.storage.from(process.env.SUPABASE_STORAGE_BUCKET).createSignedUploadUrl(storageKey);
  if (uploadError) return res.status(502).json({ error: "Supabase could not prepare the secure upload URL" });
  const [document] = await sql`
    insert into deal_documents (deal_id, filename, storage_key, document_type)
    values (${id}, ${filename.trim()}, ${storageKey}, ${documentTypeHint})
    returning id as document_id, filename, processing_status as status, progress_pct
  `;
  return res.status(202).json({ ...document, storage_key: storageKey, upload_url: upload.signedUrl, upload_token: upload.token });
};
