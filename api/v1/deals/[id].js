const { requireDealAccess } = require("../../_lib/deal-auth");

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const { sql } = await requireDealAccess(req, id);
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const [deal] = await sql`select id, name, borrower_name, facility_type, facility_amount, status, flags_count, updated_at from deals where id = ${id}`;
  const documents = await sql`select id, filename, document_type, page_count, processing_status, progress_pct from deal_documents where deal_id = ${id} order by created_at`;
  const covenants = await sql`select id as covenant_id, category, covenant_type as type, operator, threshold_value, unit, actual_value, headroom_pct, test_frequency, source_reference_id from covenants where deal_id = ${id} order by created_at`;
  const financials = await sql`select id as item_id, gaap_tag, period, reported_value, audited_value, variance_pct, source_reference_id from financial_line_items where deal_id = ${id} order by created_at`;
  return res.status(200).json({ deal, documents, covenants, financials });
};
