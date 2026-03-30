const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const {
  getNextAvailableTime,
  isExactMatch,
} = require("../utils/searchAvailability");

/* -----------------------------
   helpers
------------------------------ */
const parseBool = (v) => {
  if (v === undefined) return undefined;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
};

const parseCsv = (v) => {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};



function shapeWorker(w, nextAvailableTime = null, matchType = "exact") {
  const avg =
    w.RatingsReceived.length > 0
      ? w.RatingsReceived.reduce((sum, r) => sum + r.score, 0) /
        w.RatingsReceived.length
      : 0;

  return {
    worker_id: w.id.toString(),
    is_online: w.is_online,
    pickup_available: w.pickup_available,
    delivery_available: w.delivery_available,
    is_professional: w.is_professional,
    image_url: w.image_url,

    profile: {
      name: `${w.user.first_name} ${w.user.last_name}`.trim(),
      city: w.user.city_name,
      street: w.user.street_name,
      building_number: w.user.building_number,
      phone: w.user.phone,
      description: w.description || w.user.description,
    },

    rating: {
      avg,
      count: w.RatingsReceived.length,
    },

    hours: w.Hours.map((h) => ({
      day_of_week: h.day_of_week,
      start_hhmm: h.start_hhmm,
      end_hhmm: h.end_hhmm,
    })),

    services: w.Services.map((s) => ({
      service_code: s.service_code,
      name: s.Service.display_name,
      unit: s.Service.unit,
      base_price: s.base_price ?? null,
      notes: s.notes,
    })),

    match_type: matchType,
    next_available_time: nextAvailableTime ? nextAvailableTime.toISOString() : null,
  };
}

/* -----------------------------
   GET /api/search/cities
------------------------------ */
router.get("/search/cities", async (_req, res) => {
  try {
    const rows = await prisma.user.findMany({
      select: { city_name: true },
      distinct: ["city_name"],
      orderBy: { city_name: "asc" },
    });

    const cities = rows.map((r) => (r.city_name || "").trim()).filter(Boolean);

    res.json({ ok: true, data: cities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* -----------------------------
   GET /api/search/workers
   Required:
   - city
   - pickup_at (ISO datetime)
------------------------------ */
router.get("/search/workers", async (req, res) => {
  try {
    const {
      q,
      city,
      pickup_at,

      // services
      service_code, // legacy (single)
      service_codes, // NEW (csv list)

      is_professional,
      pickup,
      delivery,
      minRating,
      maxPrice,

      limit = 12,
      cursor,
      worker_id,
    } = req.query;

    // required fields
    if (!city || String(city).trim() === "") {
      return res.status(400).json({ ok: false, error: "city is required" });
    }
    if (!pickup_at || String(pickup_at).trim() === "") {
      return res.status(400).json({ ok: false, error: "pickup_at is required" });
    }

    const pickupDate = new Date(pickup_at);
    if (Number.isNaN(pickupDate.getTime())) {
      return res
        .status(400)
        .json({ ok: false, error: "pickup_at must be a valid datetime" });
    }


    const idFilter = worker_id ? BigInt(worker_id) : null;

    // services wanted: multi + legacy single
    const multi = parseCsv(service_codes);
    const servicesWanted = [
      ...multi,
      ...(service_code ? [String(service_code).trim()] : []),
    ].filter(Boolean);

    const take = Math.min(Number(limit) || 12, 50);

    const maxPriceNum =
      maxPrice !== undefined && maxPrice !== ""
        ? Number(maxPrice)
        : undefined;
    if (maxPriceNum !== undefined && Number.isNaN(maxPriceNum)) {
      return res.status(400).json({ ok: false, error: "maxPrice must be a number" });
    }

    const baseWhere  = {
      ...(idFilter ? { id: idFilter } : {}),

      ...(parseBool(is_professional) !== undefined
        ? { is_professional: parseBool(is_professional) }
        : {}),

      ...(parseBool(pickup) !== undefined
        ? { pickup_available: parseBool(pickup) }
        : {}),

      ...(parseBool(delivery) !== undefined
        ? { delivery_available: parseBool(delivery) }
        : {}),

      // city is required => always filter it
      user: {
        city_name: { equals: String(city).trim(), mode: "insensitive" },

        ...(q
          ? {
              OR: [
                { first_name: { contains: q, mode: "insensitive" } },
                { last_name: { contains: q, mode: "insensitive" } },
                { street_name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },     

      // ✅ optional services filter (multi)
      ...(servicesWanted.length
        ? {
            Services: {
              some: {
                service_code: { in: servicesWanted },
                is_active: true,
                ...(maxPriceNum !== undefined ? { base_price: { lte: maxPriceNum } } : {}),
              },
            },
          }
        : {}),
    };

    // Fetch candidates
    const workersRaw = await prisma.worker.findMany({
      where: baseWhere,
      take,
      ...(cursor ? { skip: 1, cursor: { id: BigInt(cursor) } } : {}),
      orderBy: [{ is_online: "desc" }, { id: "asc" }],
      include: {
        user: true,
        Hours: true,
        Services: {
          where: {
            is_active: true,
            ...(servicesWanted.length ? { service_code: { in: servicesWanted } } : {}),
            ...(maxPriceNum !== undefined ? { base_price: { lte: maxPriceNum } } : {}),
          },
          include: { Service: true }, // ServiceCatalog via relation field "Service"
        },
        RatingsReceived: true,
      },
    });

    

    // Filter by min_notice_minutes (worker-specific notice)
    const now = new Date();
  

    // Filter by max_orders_per_day (capacity)
    // Count scheduled_pickup on the pickup day per worker
    const startOfDay = new Date(pickupDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(pickupDate);
    endOfDay.setHours(23, 59, 59, 999);

    const workerIds = workersRaw.map((w) => w.id);
    let ordersCountByWorker = new Map();

    if (workerIds.length) {
      const orders = await prisma.order.findMany({
        where: {
          worker_id: { in: workerIds },
          scheduled_pickup: { gte: startOfDay, lte: endOfDay },
          // ignore cancelled
          status: { notIn: ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"] },
        },
        select: { worker_id: true },
      });

      for (const o of orders) {
        const key = o.worker_id.toString();
        ordersCountByWorker.set(key, (ordersCountByWorker.get(key) || 0) + 1);
      }
    }
const minR =
  minRating !== undefined && minRating !== "" ? Number(minRating) : undefined;

if (minR !== undefined && Number.isNaN(minR)) {
  return res.status(400).json({ ok: false, error: "minRating must be a number" });
}

const workersAfterRating = workersRaw.filter((w) => {
  const avg =
    w.RatingsReceived.length > 0
      ? w.RatingsReceived.reduce((sum, r) => sum + r.score, 0) /
        w.RatingsReceived.length
      : 0;

  return minR === undefined || avg >= minR;
});

const matchedItems = workersAfterRating
  .filter((w) => isExactMatch(w, pickupDate, now, ordersCountByWorker))
  .map((w) => shapeWorker(w, pickupDate, "exact"));

  let alternativeItems = [];

if (matchedItems.length === 0) {
  alternativeItems = workersAfterRating
    .filter((w) => !isExactMatch(w, pickupDate, now, ordersCountByWorker))
    .map((w) => {
      const nextAvailableTime = getNextAvailableTime(w.Hours || [], pickupDate);

      if (!nextAvailableTime) return null;

      return shapeWorker(w, nextAvailableTime, "alternative");
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(a.next_available_time).getTime() -
        new Date(b.next_available_time).getTime()
    );
}

    const nextCursor =
      workersRaw.length > 0 ? workersRaw[workersRaw.length - 1].id.toString() : null;

  res.json({
  ok: true,
  data: {
    matchedItems,
    alternativeItems,
    meta: {
      hasMatches: matchedItems.length > 0,
      requestedCity: String(city).trim(),
      requestedPickupAt: pickupDate.toISOString(),
    },
  },
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
