const vietnameseDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatVietnameseWorkDate(value: Date): string {
  const formatted = vietnameseDateFormatter.format(value);
  return formatted.charAt(0).toLocaleUpperCase("vi-VN") + formatted.slice(1);
}

const vietnamOffsetMilliseconds = 7 * 60 * 60 * 1000;

export function vietnamDayRange(value: Date): { start: Date; end: Date } {
  const shifted = new Date(value.getTime() + vietnamOffsetMilliseconds);
  const startTimestamp = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  ) - vietnamOffsetMilliseconds;

  return {
    start: new Date(startTimestamp),
    end: new Date(startTimestamp + 24 * 60 * 60 * 1000),
  };
}
