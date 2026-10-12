export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(d) {
  if (!d) return 'never';
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}

export const OUTCOME = {
  RP1_success: { label: 'Success: trial order', tone: 'ok' },
  RP2_success: { label: 'Success: big order', tone: 'ok' },
  WP1: { label: 'Postponed', tone: 'warn' },
  WP2: { label: 'Declined', tone: 'bad' },
  incomplete: { label: 'Incomplete', tone: 'gray' },
};
export const outcomeInfo = (o) => OUTCOME[o] || { label: o || '—', tone: 'gray' };

export const ACTION_LABEL = {
  'company.create': 'Created company', 'company.update': 'Updated company', 'company.suspend': 'Suspended company',
  'company.activate': 'Reactivated company', 'company.delete': 'Deleted company',
  'employee.invite': 'Invited a person', 'employee.invite_renew': 'Renewed an invitation', 'employee.invite_cancel': 'Cancelled an invitation',
  'employee.update': 'Edited a person', 'employee.delete': 'Deleted a person',
  'assignment.create': 'Created an assignment', 'assignment.delete': 'Deleted an assignment',
  'persona.create': 'Created a persona', 'persona.update': 'Edited a persona', 'persona.delete': 'Deleted a persona',
  'user.enable': 'Enabled an account', 'user.disable': 'Disabled an account', 'user.delete': 'Deleted an account',
  'lead.convert': 'Approved a company request', 'announcement.send': 'Sent an announcement',
};
