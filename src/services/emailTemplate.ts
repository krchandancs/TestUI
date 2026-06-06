/**
 * services/emailTemplate.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds HTML + plain-text email bodies for enhancement request submissions.
 * Used by both the frontend (preview) and the backend handler (send).
 *
 * Drop-in path: src/services/emailTemplate.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EnhancementRequestPayload } from './enhancementRequestService';

// ─── Subject line ─────────────────────────────────────────────────────────────

export function buildSubject(title: string): string {
  return `Enhancement Request – ${title}`;
}

// ─── HTML template ────────────────────────────────────────────────────────────

export function buildHtmlEmail(payload: EnhancementRequestPayload): string {
  const { title, description, category, priority, metadata, includeSystem } = payload;


  const metaRows = includeSystem && metadata ? `
    <tr><td style="padding:6px 0;color:#64748b;font-size:12px;width:140px">Submitted by</td><td style="padding:6px 0;color:#1e293b;font-size:12px">${metadata.userName} (${metadata.userRole})</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:12px">Timestamp</td><td style="padding:6px 0;color:#1e293b;font-size:12px">${new Date(metadata.timestamp).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:12px">App Version</td><td style="padding:6px 0;color:#1e293b;font-size:12px">${metadata.appVersion}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:12px">Browser / OS</td><td style="padding:6px 0;color:#1e293b;font-size:12px">${metadata.browser} on ${metadata.os}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;font-size:12px">Page</td><td style="padding:6px 0;color:#1e293b;font-size:12px;font-family:monospace">${metadata.currentPage}</td></tr>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${buildSubject(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">PathScribe AI</div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Enhancement Request</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 14px;border-radius:99px;background:rgba(8,145,178,0.2);color:#38bdf8;font-size:11px;font-weight:700;border:1px solid rgba(8,145,178,0.3);">
                      💡 New Request
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title band -->
          <tr>
            <td style="background:#0891B2;padding:16px 32px;">
              <div style="font-size:18px;font-weight:800;color:#ffffff;line-height:1.3;">${escHtml(title)}</div>
              <div style="margin-top:8px;display:flex;gap:8px;">
                <span style="display:inline-block;padding:3px 12px;border-radius:99px;background:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:700;">
                  ${category}
                </span>
                ${priority ? `<span style="display:inline-block;padding:3px 12px;border-radius:99px;background:rgba(255,255,255,0.15);color:#ffffff;font-size:11px;font-weight:700;margin-left:6px;">
                  ${priority} Priority
                </span>` : ''}
              </div>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Description</div>
              <div style="font-size:14px;color:#1e293b;line-height:1.75;white-space:pre-wrap;background:#f8fafc;border-left:3px solid #0891B2;padding:14px 18px;border-radius:0 8px 8px 0;">
                ${escHtml(description)}
              </div>
            </td>
          </tr>

          <!-- System details -->
          ${includeSystem && metadata ? `
          <tr>
            <td style="padding:24px 32px 0;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">System Details</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <td colspan="2" style="padding:8px 16px;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #e2e8f0;">
                    Auto-captured metadata
                  </td>
                </tr>
                <tbody style="padding:0 16px;">
                  ${metaRows}
                </tbody>
              </table>
            </td>
          </tr>` : ''}

          <!-- Attachments note -->
          ${payload.attachments.length > 0 ? `
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Attachments</div>
              <div style="font-size:13px;color:#475569;">
                ${payload.attachments.map(f => `📎 ${escHtml(f.name)}`).join('<br/>')}
              </div>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;margin-top:24px;border-top:1px solid #e2e8f0;margin:24px 32px 0;">
              <div style="font-size:11px;color:#94a3b8;line-height:1.6;">
                This request was submitted via PathScribe AI. To configure routing preferences, visit
                <strong>Configuration → System → Enhancement Request Routing</strong>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

export function buildPlainTextEmail(payload: EnhancementRequestPayload): string {
  const { title, description, category, priority, metadata, includeSystem, attachments } = payload;
  const lines: string[] = [
    'PATHSCRIBE AI — ENHANCEMENT REQUEST',
    '═'.repeat(40),
    '',
    `Title:       ${title}`,
    `Category:    ${category}`,
    priority ? `Priority:    ${priority}` : '',
    '',
    'DESCRIPTION',
    '─'.repeat(40),
    description,
    '',
  ];

  if (includeSystem && metadata) {
    lines.push('SYSTEM DETAILS', '─'.repeat(40));
    lines.push(`Submitted by: ${metadata.userName} (${metadata.userRole})`);
    lines.push(`Timestamp:    ${new Date(metadata.timestamp).toLocaleString()}`);
    lines.push(`App Version:  ${metadata.appVersion}`);
    lines.push(`Browser/OS:   ${metadata.browser} on ${metadata.os}`);
    lines.push(`Page:         ${metadata.currentPage}`);
    lines.push('');
  }

  if (attachments.length > 0) {
    lines.push('ATTACHMENTS', '─'.repeat(40));
    attachments.forEach(f => lines.push(`  • ${f.name}`));
    lines.push('');
  }

  lines.push('─'.repeat(40));
  lines.push('Sent from PathScribe AI — Configuration → System → Enhancement Request Routing');

  return lines.filter(l => l !== null).join('\n');
}

// ─── HTML escape helper ───────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
