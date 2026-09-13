const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { getDatabase } = require("../_lib/db");
const { createSession, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, email, phone_number: phoneNumber, password, account_type: accountType = "client", organization_name: organizationName = `${name || "New"} Workspace` } = req.body || {};
  if (!name || !email || !phoneNumber || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Name, phone number, email, and a password of at least 8 characters are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const role = { admin: "managing_director", employee: "credit_analyst", client: "external_auditor" }[accountType];
  if (!role) return res.status(400).json({ error: "Choose a valid account type" });
  if (accountType !== "client" && process.env.ALLOW_ROLE_REGISTRATION !== "true") {
    return res.status(403).json({ error: "Employee and admin accounts must be provisioned by an administrator" });
  }
  try {
    const sql = getDatabase();
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      insert into users (name, email, phone_number, password_hash)
      values (${name.trim()}, ${normalizedEmail}, ${phoneNumber.trim()}, ${passwordHash})
      returning id, name, email, phone_number
    `;
    const slug = `${organizationName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace"}-${randomUUID().slice(0, 8)}`;
    const [organization] = await sql`
      insert into organizations (name, slug)
      values (${organizationName.trim()}, ${slug})
      returning id, name, slug
    `;
    await sql`
      insert into organization_members (organization_id, user_id, role)
      values (${organization.id}, ${user.id}, ${role})
    `;
    setSessionCookie(res, await createSession(user.id));
    return res.status(201).json({ user, organization: { ...organization, role } });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "An account with that email already exists" });
    if (error.code === "42703" || error.code === "42P01") {
      return res.status(503).json({ error: "CAGNEX database schema is not up to date. Run the latest schema migration, then try again." });
    }
    if (error.message === "DATABASE_URL is not configured" || error.message === "SESSION_SECRET must contain at least 32 characters") {
      return res.status(503).json({ error: "CAGNEX backend is not configured. Add DATABASE_URL and a 32+ character SESSION_SECRET in Vercel." });
    }
    throw error;
  }
};
