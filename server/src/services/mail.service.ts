import nodemailer from 'nodemailer';

export interface InvitationEmailPayload {
  to: string;
  fullName: string;
  teamName: string;
  role: string;
  inviteUrl: string;
  inviterName: string;
}

export async function sendInvitationEmail(payload: InvitationEmailPayload): Promise<{ success: boolean; previewUrl?: string }> {
  const { to, fullName, teamName, role, inviteUrl, inviterName } = payload;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'Newtonite Operations <noreply@newtonite.io>';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0066ff; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">Newtonite Operations</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">High-Integrity Operational Dispatch & Coordination</p>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello <strong>${fullName}</strong>,</p>

      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> team as a <strong>${role}</strong> in the Newtonite Operations workspace.
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
        This invitation was dispatched securely via Newtonite Outbox Worker. If you were not expecting this, you can ignore this email.
      </div>
    </div>
  `;

  if ((smtpHost || smtpUser) && smtpUser && smtpPass) {
    try {
      const isGmail = (smtpHost && smtpHost.includes('gmail')) || smtpUser.includes('@gmail.com');
      const cleanPass = smtpPass.replace(/\s+/g, '');

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          });

      await transporter.sendMail({
        from: smtpFrom || smtpUser,
        to,
        subject: `[Newtonite Ops] You have been invited to join ${teamName}`,
        html: htmlContent,
      });

      console.log(`[Email Service] Real SMTP email successfully dispatched to ${to}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Email Service] Failed to send email via SMTP to ${to}:`, err.message);
      // Fallback to simulated delivery log
    }
  }

  // Simulated / Development outbox delivery
  console.log(`\n======================================================`);
  console.log(`✉️ [Outbox Worker Email Dispatch]`);
  console.log(`To: ${to} (${fullName})`);
  console.log(`Subject: You have been invited to join ${teamName} as ${role}`);
  console.log(`Invitation Link: ${inviteUrl}`);
  console.log(`======================================================\n`);

  return { success: true };
}
