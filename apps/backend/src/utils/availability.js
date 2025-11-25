function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function toHHMM(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function canWorkerTakeOrder(worker, pickupDate) {
  if (!worker.is_online) return false;

  const now = new Date();

  //  minimum notice
  const minStart = new Date(now.getTime() + worker.min_notice_minutes * 60000);
  if (pickupDate < minStart) return false;

  //  daily capacity
  const startDay = new Date(pickupDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(pickupDate);
  endDay.setHours(23, 59, 59, 999);

  const countToday = worker.Orders.filter((o) => {
    if (!o.scheduled_pickup) return false;
    const d = new Date(o.scheduled_pickup);
    return (
      d >= startDay &&
      d <= endDay &&
      ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(o.status)
    );
  }).length;

  if (countToday >= worker.max_orders_per_day) return false;

  //  weekly schedule check
  const jsDay = pickupDate.getDay();
  const pickupHHMM = toHHMM(pickupDate);

  const match = worker.Hours.some(
    (h) =>
      h.day_of_week === jsDay &&
      h.start_hhmm <= pickupHHMM &&
      h.end_hhmm >= pickupHHMM
  );

  return match;
}

module.exports = { canWorkerTakeOrder };
