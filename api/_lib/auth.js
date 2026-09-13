const { jwtVerify, SignJWT } = require("jose");

function getSecret() {
  const secret = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function createSession(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

async function requireUser(req) {
  const token = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("cagnex_session="))
    ?.slice("cagnex_session=".length);

  if (!token) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string") throw new Error("Invalid session");
    return payload.userId;
  } catch {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `cagnex_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "cagnex_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
}

module.exports = { createSession, requireUser, setSessionCookie, clearSessionCookie };
