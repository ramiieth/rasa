export function formatToman(rials: number | string | null | undefined): string {
  const num = Math.round(Number(rials ?? 0) / 10);
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export function formatRial(rials: number | string | null | undefined): string {
  const num = Number(rials ?? 0);
  return `${num.toLocaleString("fa-IR")} ریال`;
}

export function formatFaDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}
