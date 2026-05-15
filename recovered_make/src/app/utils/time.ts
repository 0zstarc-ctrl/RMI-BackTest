const KST_TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getTodayDateInputKst() {
  return formatDateInputKst(new Date());
}

export function addMonthsToDateInput(value: string, months: number) {
  const { year, month, day } = parseDateInput(value);
  const date = new Date(Date.UTC(year, month - 1 + months, day, 12));
  return formatDateInputParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function dateInputToKstStartDate(value: string) {
  const { year, month, day } = parseDateInput(value);
  return new Date(Date.UTC(year, month - 1, day) - KST_OFFSET_MS);
}

export function dateInputToKstEndDate(value: string) {
  const { year, month, day } = parseDateInput(value);
  return new Date(Date.UTC(year, month - 1, day + 1) - KST_OFFSET_MS - 1);
}

export function formatKstDate(timestamp: Date | number) {
  const parts = getDateParts(timestamp);
  return formatDateInputParts(parts.year, parts.month, parts.day);
}

export function formatKstMonthDay(timestamp: Date | number) {
  const parts = getDateParts(timestamp);
  return `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatKstDateTime(timestamp: Date | number) {
  const dateParts = getDateParts(timestamp);
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(timestamp);

  const rawHour = Number(timeParts.find((part) => part.type === "hour")?.value);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(timeParts.find((part) => part.type === "minute")?.value);

  return `${formatDateInputParts(dateParts.year, dateParts.month, dateParts.day)} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDateInputKst(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return formatDateInputParts(year, month, day);
}

function formatDateInputParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateParts(timestamp: Date | number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Invalid date input.");
  }

  return { year, month, day };
}
