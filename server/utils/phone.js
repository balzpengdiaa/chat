// Normalisasi nomor ke format 62xxxxxxxxxx. Return null jika tidak valid.
export const normalizePhone = (input) => {
  let p = String(input || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8')) p = '62' + p;
  if (!p.startsWith('62')) return null;
  if (p.length < 10 || p.length > 15) return null;
  return p;
};
