async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("Email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [to], subject, text })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email delivery failed (${response.status}): ${details.slice(0, 200)}`);
  }
}

module.exports = { sendEmail };
