export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function formatDateInUserTimeZone(date, options = {}) {
  const safeDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(safeDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: getUserTimeZone(),
    ...options,
  }).format(safeDate);
}

export function formatDashboardDateLabel(date = new Date()) {
  return formatDateInUserTimeZone(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getGreetingForDate(date = new Date()) {
  const hour = Number(
    formatDateInUserTimeZone(date, {
      hour: "numeric",
      hour12: false,
      timeZone: getUserTimeZone(),
    }).split(" ")[0],
  );

  if (Number.isNaN(hour)) {
    return "Good day";
  }

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
