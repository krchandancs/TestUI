/**
 * services/communications/emailTemplates/synopticEmailTemplates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds email subjects and HTML/text bodies for synoptic template events.
 * Called by synopticNotificationService — no transport logic here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SynopticAuditEvent } from '../../../types/SynopticAuditEvents';

export function buildSubject(event: SynopticAuditEvent): string {
  const name = event.templateName ?? event.templateId;
  switch (event.action) {
    case 'sync.new_template_found':       return `[pathscribe] New ${event.source ?? 'standard'} checklist available — ${name}`;
    case 'sync.template_updated':         return `[pathscribe] Checklist updated — ${name} v${event.version ?? ''}`;
    case 'sync.auto_failed':              return `[pathscribe] ⚠️ Nightly protocol sync failed`;
    case 'sync.manual_upload':            return `[pathscribe] Protocol manually uploaded — ${name}`;
    case 'template.submitted_for_review': return `[pathscribe] Protocol submitted for review — ${name}`;
    case 'template.needs_changes':        return `[pathscribe] Changes requested — ${name}`;
    case 'template.approved':             return `[pathscribe] Protocol approved — ${name}`;
    case 'template.published':            return `[pathscribe] Protocol published — ${name} is now live`;
    default:                              return `[pathscribe] Synoptic library update — ${name}`;
  }
}

function buildBodyCopy(event: SynopticAuditEvent): string {
  const name = event.templateName ?? event.templateId;
  const by   = event.user;
  switch (event.action) {
    case 'sync.new_template_found':
      return `The nightly auto-sync detected a new <strong>${event.source}</strong> checklist: <strong>${name}</strong>. It has been placed in the Review Queue and is ready for clinical and informatics verification.`;
    case 'sync.template_updated':
      return `An updated version of <strong>${name}</strong> (v${event.version}${event.prevVersion ? `, previously v${event.prevVersion}` : ''}) was detected by the nightly sync and placed in the Review Queue.`;
    case 'sync.auto_failed':
      return `The nightly protocol sync job failed and no templates were updated. Please check the sync log and consider uploading any pending protocols manually.`;
    case 'sync.manual_upload':
      return `<strong>${by}</strong> manually uploaded <strong>${name}</strong>. It has been placed in the Review Queue pending verification before it can be published.`;
    case 'template.submitted_for_review':
      return `<strong>${by}</strong> submitted <strong>${name}</strong> for clinical and informatics review. Please open the Review Queue to assess and action it.`;
    case 'template.needs_changes':
      return `<strong>${by}</strong> returned <strong>${name}</strong> requesting changes before it can be approved.<br><br><strong>Reason:</strong> <em>${event.note ?? 'No reason provided.'}</em>`;
    case 'template.approved':
      return `<strong>${by}</strong> approved <strong>${name}</strong>. It is now ready to be published to the reporting workflow.`;
    case 'template.published':
      return `<strong>${by}</strong> published <strong>${name}</strong>. It is now <strong>live</strong> and available to all pathologists in the synoptic reporting workflow.`;
    default:
      return `A synoptic library action was recorded for <strong>${name}</strong>.`;
  }
}

function buildCta(event: SynopticAuditEvent, baseUrl: string): { label: string; url: string; color: string } {
  const reviewUrl = `${baseUrl}/configuration?tab=protocols&section=review`;
  if (event.action === 'sync.auto_failed') {
    return { label: 'Upload Protocol Manually →', url: `${baseUrl}/configuration?tab=protocols`, color: '#fbbf24' };
  }
  if (event.action === 'template.needs_changes') {
    return { label: 'Open Editor →', url: `${baseUrl}/template-editor/${event.templateId}`, color: '#f87171' };
  }
  return { label: 'Open Review Queue →', url: reviewUrl, color: '#0891B2' };
}

export function buildHtml(event: SynopticAuditEvent, baseUrl: string): string {
  const name = event.templateName ?? event.templateId;
  const ts   = new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  const cta  = buildCta(event, baseUrl);
  const copy = buildBodyCopy(event);
  const chip = [event.source, name, event.version ? `v${event.version}` : null].filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0c4a6e,#0e7490);padding:22px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:20px;font-weight:800;color:#f0f9ff;letter-spacing:-0.02em;">pathscribe</span><span style="font-size:11px;color:#7dd3fc;margin-left:6px;font-weight:600;">AI</span></td>
            <td align="right"><span style="font-size:10px;color:#7dd3fc;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Synoptic Library</span></td>
          </tr></table>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:28px 32px;">
        <div style="display:inline-block;background:rgba(8,145,178,0.15);border:1px solid rgba(8,145,178,0.3);border-radius:6px;padding:3px 12px;font-size:11px;font-weight:700;color:#38bdf8;font-family:monospace;margin-bottom:16px;">${chip}</div>
        <h2 style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 12px;line-height:1.3;">${buildSubject(event).replace('[pathscribe] ', '')}</h2>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">${copy}</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="border-radius:8px;border:1px solid ${cta.color}40;background:${cta.color}15;">
            <a href="${cta.url}" style="display:inline-block;padding:11px 22px;font-size:13px;font-weight:700;color:${cta.color};text-decoration:none;">${cta.label}</a>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #334155;padding-top:14px;">
          <tr>
            <td style="font-size:11px;color:#475569;"><strong style="color:#64748b;">Triggered by</strong> ${event.user}</td>
            <td align="right" style="font-size:11px;color:#475569;">${ts}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0f172a;padding:14px 32px;border-top:1px solid #1e293b;">
        <p style="font-size:11px;color:#334155;margin:0;line-height:1.6;">
          Sent to admins and clinical leads in pathscribe. &nbsp;·&nbsp;
          <a href="${baseUrl}/configuration?tab=system" style="color:#475569;">Manage notification preferences</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

export function buildText(event: SynopticAuditEvent, baseUrl: string): string {
  const cta = buildCta(event, baseUrl);
  return [
    'pathscribe — Synoptic Library Notification',
    '===========================================',
    '',
    `Protocol : ${event.templateName ?? event.templateId}`,
    `Source   : ${event.source ?? 'Custom'}`,
    event.version ? `Version  : ${event.version}` : null,
    `Action   : ${event.action}`,
    `By       : ${event.user}`,
    `At       : ${new Date().toLocaleString()}`,
    event.note    ? `Note     : ${event.note}` : null,
    '',
    `${cta.label} ${cta.url}`,
    '',
    '---',
    'Sent to admins and clinical leads.',
    `Notification preferences: ${baseUrl}/configuration?tab=system`,
  ].filter((l): l is string => l !== null).join('\n');
}
