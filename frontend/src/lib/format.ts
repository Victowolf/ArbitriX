export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;

export const pad2 = (i: number) => String(i + 1).padStart(2, "0");

const hex = "0123456789abcdef";
export const randomHash = () => {
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) a += hex[Math.floor(Math.random() * 16)];
  for (let i = 0; i < 4; i++) b += hex[Math.floor(Math.random() * 16)];
  return `0x${a}…${b}`;
};

export const randomWallet = () => {
  let a = "";
  let b = "";
  for (let i = 0; i < 2; i++) a += (hex[Math.floor(Math.random() * 16)] ?? "0").toUpperCase();
  for (let i = 0; i < 4; i++) b += (hex[Math.floor(Math.random() * 16)] ?? "0").toUpperCase();
  return `0x${a}…${b}`;
};

export const relativeTime = (ts: number) => {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s} sec ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
};

export const mockApiKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `sk-arbx-${s}`;
};
