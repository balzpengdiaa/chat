// Kirim pesan WhatsApp lewat Fonnte (https://docs.fonnte.com)
export const sendWhatsApp = async (target, message) => {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: process.env.FONNTE_TOKEN },
    body: new URLSearchParams({ target, message, countryCode: '62' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === false) {
    throw new Error(data.reason || 'Gagal mengirim OTP via Fonnte');
  }
  return data;
};
