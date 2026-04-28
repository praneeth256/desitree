export function formatViews(views) {
  if (!views && views !== 0) return '0';
  const num = Number(views);
  if (num >= 1000000) {
    const m = num / 1000000;
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (num >= 1000) {
    const k = num / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
  }
  return num.toString();
}

