const bcrypt = require("bcryptjs");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, password, account_type: accountType = "client" } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = getDatabase();
  const [user] = await sql`select id, name, email, phone_number, password_hash from users where email = ${email.trim().toLowerCase()}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const [organization] = await sql`
    select o.id, o.name, o.slug, om.role
    from organizations o join organization_members om on om.organization_id = o.id
    where om.user_id = ${user.id} order by o.created_at asc limit 1
  `;
  const roleGroups = { admin: ["super_admin", "managing_director"], employee: ["lead_underwriter", "credit_analyst"], client: ["external_auditor"] };
  if (!organization || !roleGroups[accountType]?.includes(organization.role)) {
    return res.status(403).json({ error: "This account is not enabled for the selected workspace" });
  }
  setSessionCookie(res, await createSession(user.id));
  return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number }, organization });
};
