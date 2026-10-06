// Helper tanggal berbasis zona waktu lokal (bukan UTC) agar pencatatan
// dini hari (mis. sahur) tidak jatuh ke tanggal kemarin.

export function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateStr(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dateStr, delta) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}

// Senin sebagai awal minggu
export function startOfWeekStr(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return localDateStr(d);
}

export function formatDateLabel(dateStr, opts = { weekday: 'long', day: 'numeric', month: 'short' }) {
  return parseDateStr(dateStr).toLocaleDateString('id-ID', opts);
}
