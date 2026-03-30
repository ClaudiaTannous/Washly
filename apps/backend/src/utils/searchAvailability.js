// backend/src/utils/searchAvailability.js

function hhmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;

  const [hh, mm] = hhmm.split(":").map(Number);

  if (
    !Number.isInteger(hh) ||
    !Number.isInteger(mm) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59
  ) {
    return null;
  }

  return hh * 60 + mm;
}

function getDaySlots(hours, dayOfWeek) {
  if (!Array.isArray(hours)) return [];

  return hours
    .filter((h) => h.day_of_week === dayOfWeek)
    .map((h) => ({
      day_of_week: h.day_of_week,
      start_hhmm: h.start_hhmm,
      end_hhmm: h.end_hhmm,
      startMinutes: hhmmToMinutes(h.start_hhmm),
      endMinutes: hhmmToMinutes(h.end_hhmm),
    }))
    .filter((slot) => slot.startMinutes !== null && slot.endMinutes !== null)
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

function combineDateAndHHMM(date, hhmm) {
  const minutes = hhmmToMinutes(hhmm);
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || minutes === null) {
    return null;
  }

  const result = new Date(date);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  result.setHours(hh, mm, 0, 0);
  return result;
}

function isWithinWorkingHours(hours, requestedDate) {
  if (!(requestedDate instanceof Date) || Number.isNaN(requestedDate.getTime())) {
    return false;
  }

  const dayOfWeek = requestedDate.getDay();
  const requestedMinutes = requestedDate.getHours() * 60 + requestedDate.getMinutes();
  const daySlots = getDaySlots(hours, dayOfWeek);

  return daySlots.some(
    (slot) =>
      requestedMinutes >= slot.startMinutes &&
      requestedMinutes < slot.endMinutes
  );
}

function passesMinNotice(worker, requestedDate, now = new Date()) {
  if (!(requestedDate instanceof Date) || Number.isNaN(requestedDate.getTime())) {
    return false;
  }

  const minNotice = Number(worker?.min_notice_minutes ?? 0);
  const diffMinutes = (requestedDate.getTime() - now.getTime()) / 60000;

  return diffMinutes >= minNotice;
}

function passesCapacity(worker, ordersCountByWorker) {
  const workerId = worker?.id?.toString?.();
  if (!workerId) return false;

  const currentCount = ordersCountByWorker.get(workerId) || 0;
  const maxPerDay = Number(worker?.max_orders_per_day ?? 0);

  return currentCount < maxPerDay;
}

function getNextAvailableTime(hours, requestedDate) {
  if (!(requestedDate instanceof Date) || Number.isNaN(requestedDate.getTime())) {
    return null;
  }

  const requestedDay = requestedDate.getDay();
  const requestedMinutes =
    requestedDate.getHours() * 60 + requestedDate.getMinutes();

  // 1) same day: find first slot that starts after requested time
  const sameDaySlots = getDaySlots(hours, requestedDay);

  for (const slot of sameDaySlots) {
    if (slot.startMinutes > requestedMinutes) {
      return combineDateAndHHMM(requestedDate, slot.start_hhmm);
    }
  }

  // 2) next days: search up to 7 days ahead
  for (let offset = 1; offset <= 7; offset++) {
    const candidateDate = new Date(requestedDate);
    candidateDate.setDate(candidateDate.getDate() + offset);

    const dayOfWeek = candidateDate.getDay();
    const slots = getDaySlots(hours, dayOfWeek);

    if (slots.length > 0) {
      return combineDateAndHHMM(candidateDate, slots[0].start_hhmm);
    }
  }

  return null;
}

function isExactMatch(worker, requestedDate, now, ordersCountByWorker) {
  return (
    isWithinWorkingHours(worker?.Hours || [], requestedDate) &&
    passesMinNotice(worker, requestedDate, now) &&
    passesCapacity(worker, ordersCountByWorker)
  );
}

module.exports = {
  hhmmToMinutes,
  getDaySlots,
  combineDateAndHHMM,
  isWithinWorkingHours,
  passesMinNotice,
  passesCapacity,
  getNextAvailableTime,
  isExactMatch,
};