function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function shiftDate(base: Date, unit: "minute" | "hour" | "day" | "week" | "month" | "year", amount: number) {
  const next = new Date(base);

  switch (unit) {
    case "minute":
      next.setMinutes(next.getMinutes() - amount);
      return next;
    case "hour":
      next.setHours(next.getHours() - amount);
      return next;
    case "day":
      next.setDate(next.getDate() - amount);
      return next;
    case "week":
      next.setDate(next.getDate() - amount * 7);
      return next;
    case "month":
      next.setMonth(next.getMonth() - amount);
      return next;
    case "year":
      next.setFullYear(next.getFullYear() - amount);
      return next;
  }
}

function parseChineseAbsoluteDate(value: string) {
  const match = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return isValidDate(parsed) ? parsed : null;
}

function parseRelativeDate(value: string, now: Date) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  const relativePatterns: Array<{ regex: RegExp; unit: "minute" | "hour" | "day" | "week" | "month" | "year" }> = [
    { regex: /^(\d+)(分钟前|min(?:ute)?s?ago)$/, unit: "minute" },
    { regex: /^(\d+)(小时前|hours?ago|hrs?ago|hago)$/, unit: "hour" },
    { regex: /^(\d+)(天前|days?ago|dago)$/, unit: "day" },
    { regex: /^(\d+)(周前|weeks?ago|wago)$/, unit: "week" },
    { regex: /^(\d+)(个月前|months?ago|mo(?:nth)?s?ago)$/, unit: "month" },
    { regex: /^(\d+)(年前|years?ago|yago)$/, unit: "year" },
  ];

  for (const pattern of relativePatterns) {
    const match = normalized.match(pattern.regex);
    if (!match) {
      continue;
    }

    return shiftDate(now, pattern.unit, Number(match[1]));
  }

  return null;
}

export function parsePublishedAt(value: string | null | undefined, now = new Date()) {
  if (!value) {
    return now;
  }

  const raw = value.trim();
  if (!raw) {
    return now;
  }

  const absoluteChinese = parseChineseAbsoluteDate(raw);
  if (absoluteChinese) {
    return absoluteChinese;
  }

  const relative = parseRelativeDate(raw, now);
  if (relative) {
    return relative;
  }

  const parsed = new Date(raw);
  if (isValidDate(parsed)) {
    return parsed;
  }

  return now;
}
