const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, fullName, teamName, role, inviteUrl, inviterName } = req.body || {};

  if (!to || !inviteUrl) {
    return res.status(400).json({ error: 'Missing required fields: to or inviteUrl' });
  }

  const normalizedTo = to.toLowerCase().trim();
  const testDomains = ['@newtonite.io', '@example.com', '@example.org', '@example.net', '@test.com', '@localhost'];
  if (testDomains.some((domain) => normalizedTo.endsWith(domain))) {
    console.log(`[Email Service] Mocking delivery for internal domain: ${to}`);
    return res.status(200).json({ success: true, mocked: true, message: `Mocked for ${to}` });
  }

  const smtpUser = process.env.SMTP_USER || 'aryandubey825@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || 'luuf kqll diuc bmbh').replace(/\s+/g, '');
  const smtpFrom = process.env.SMTP_FROM || 'Newtonite Operations <aryandubey825@gmail.com>';

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #0066ff; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">Newtonite Operations</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">High-Integrity Operational Dispatch & Coordination</p>
        </div>

        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello <strong>${fullName || 'Colleague'}</strong>,</p>

        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          <strong>${inviterName || 'Alex Mercer (Global Admin)'}</strong> has invited you to join the <strong>${teamName || 'Newtonite Operations'}</strong> team as a <strong>${role || 'MEMBER'}</strong> on the Newtonite Operations workspace.
        </p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteUrl}" style="background-color: #0066ff; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation & Set Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
          Or copy and paste this link into your browser:<br/>
          <a href="${inviteUrl}" style="color: #0066ff; word-break: break-all;">${inviteUrl}</a>
        </p>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; color: #94a3b8; font-size: 11px;">
          This invitation was dispatched securely via Newtonite Operations Platform (Vercel Cloud Serverless).
        </div>
      </div>
    `;

    const mailOptions = {
      from: smtpFrom,
      to,
      subject: `Invitation: Join ${teamName || 'Newtonite Operations'} team`,
      html: htmlContent,
    };

    if (to.toLowerCase().trim() !== smtpUser.toLowerCase().trim()) {
      mailOptions.bcc = smtpUser;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Dispatch] Successfully sent to ${to}, messageId: ${info.messageId}`);
    return res.status(200).json({ success: true, messageId: info.messageId, to });
  } catch (err) {
    console.error('[Email Dispatch Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
};
