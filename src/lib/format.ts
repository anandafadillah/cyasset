function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatLastActivity(date: Date | string | null): string {
  if (!date) return "Belum pernah login";

  const value = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const time = value.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (isSameDay(value, now)) return `Hari ini · ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(value, yesterday)) return `Kemarin · ${time}`;

  return value.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
