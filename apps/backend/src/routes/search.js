const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth } = require("../middlewares/auth");
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

const hhmmFromDate = (d) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

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

   Optional:
   - pickup_at (ISO datetime)
   If pickup_at exists -> apply availability filters
   If pickup_at missing -> return all workers in the city
------------------------------ */
router.get("/search/workers", requireAuth, async (req, res) => {
  try {
    const {
      q,
      city,
      pickup_at,

      // services
      service_code,
      service_codes,

      is_professional,
      pickup,
      delivery,
      minRating,
      maxPrice,

      limit = 12,
      cursor,
      worker_id,
    } = req.query;

    const hasPickupAt =
      pickup_at !== undefined && String(pickup_at).trim() !== "";

    let pickupDate = null;
    let dayOfWeek = null;
    let hhmm = null;

    if (hasPickupAt) {
      pickupDate = new Date(pickup_at);

      if (Number.isNaN(pickupDate.getTime())) {
        return res
          .status(400)
          .json({ ok: false, error: "pickup_at must be a valid datetime" });
      }

      dayOfWeek = pickupDate.getDay();
      hhmm = hhmmFromDate(pickupDate);
    }

    const idFilter = worker_id ? BigInt(worker_id) : null;

    const multi = parseCsv(service_codes);
    const servicesWanted = [
      ...multi,
      ...(service_code ? [String(service_code).trim()] : []),
    ].filter(Boolean);

    const take = Math.min(Number(limit) || 12, 50);

    const maxPriceNum =
      maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : undefined;

    if (maxPriceNum !== undefined && Number.isNaN(maxPriceNum)) {
      return res
        .status(400)
        .json({ ok: false, error: "maxPrice must be a number" });
    }
    const loggedInUserId = req.user?.userId ? BigInt(req.user.userId) : null;
    const where = {
      ...(idFilter ? { id: idFilter } : {}),

      ...(loggedInUserId && !idFilter ? { id: { not: loggedInUserId } } : {}),
      ...(parseBool(is_professional) !== undefined
        ? { is_professional: parseBool(is_professional) }
        : {}),

      ...(parseBool(pickup) !== undefined
        ? { pickup_available: parseBool(pickup) }
        : {}),

      ...(parseBool(delivery) !== undefined
        ? { delivery_available: parseBool(delivery) }
        : {}),

      user: {
        ...(city && String(city).trim() !== ""
          ? {
              city_name: {
                equals: String(city).trim(),
                mode: "insensitive",
              },
            }
          : {}),

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

      ...(hasPickupAt
        ? {
            Hours: {
              some: {
                day_of_week: dayOfWeek,
                start_hhmm: { lte: hhmm },
                end_hhmm: { gt: hhmm },
              },
            },
          }
        : {}),

      ...(servicesWanted.length
        ? {
            Services: {
              some: {
                service_code: { in: servicesWanted },
                is_active: true,
                ...(maxPriceNum !== undefined
                  ? { base_price: { lte: maxPriceNum } }
                  : {}),
              },
            },
          }
        : {}),
    };

    const workersRaw = await prisma.worker.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: BigInt(cursor) } } : {}),
      orderBy: [{ is_online: "desc" }, { id: "asc" }],
      include: {
        user: true,
        Hours: true,
        Services: {
          where: {
            is_active: true,
            ...(servicesWanted.length
              ? { service_code: { in: servicesWanted } }
              : {}),
            ...(maxPriceNum !== undefined
              ? { base_price: { lte: maxPriceNum } }
              : {}),
          },
          include: { Service: true },
        },
        RatingsReceived: true,
      },
    });

    let filteredWorkers = workersRaw;

    // Only apply notice + capacity checks if pickup_at exists
    if (hasPickupAt) {
      const now = new Date();

      filteredWorkers = filteredWorkers.filter((w) => {
        const diffMinutes = (pickupDate.getTime() - now.getTime()) / 60000;
        return diffMinutes >= (w.min_notice_minutes || 0);
      });

      const startOfDay = new Date(pickupDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(pickupDate);
      endOfDay.setHours(23, 59, 59, 999);

      const workerIds = filteredWorkers.map((w) => w.id);
      const ordersCountByWorker = new Map();

      if (workerIds.length) {
        const orders = await prisma.order.findMany({
          where: {
            worker_id: { in: workerIds },
            scheduled_pickup: { gte: startOfDay, lte: endOfDay },
            status: {
              notIn: ["CANCELLED_BY_WORKER", "CANCELLED_BY_CUSTOMER"],
            },
          },
          select: { worker_id: true },
        });

        for (const o of orders) {
          const key = o.worker_id.toString();
          ordersCountByWorker.set(key, (ordersCountByWorker.get(key) || 0) + 1);
        }
      }

      filteredWorkers = filteredWorkers.filter((w) => {
        const cnt = ordersCountByWorker.get(w.id.toString()) || 0;
        return cnt < (w.max_orders_per_day || 0);
      });
    }

    const minR =
      minRating !== undefined && minRating !== ""
        ? Number(minRating)
        : undefined;

    if (minR !== undefined && Number.isNaN(minR)) {
      return res
        .status(400)
        .json({ ok: false, error: "minRating must be a number" });
    }

    const result = filteredWorkers
      .map((w) => {
        const avg =
          w.RatingsReceived.length > 0
            ? w.RatingsReceived.reduce((sum, r) => sum + r.score, 0) /
              w.RatingsReceived.length
            : 0;

        if (minR !== undefined && avg < minR) return null;

        return {
          worker_id: w.id.toString(),

          is_online: w.is_online,
          pickup_available: w.pickup_available,
          delivery_available: w.delivery_available,
          is_professional: w.is_professional,
          image_url: w.image_url,

          // ADD THESE
          price_per_wash: w.price_per_wash,
          max_items_per_wash: w.max_items_per_wash,
          max_orders_per_day: w.max_orders_per_day,

          profile: {
            name: `${w.user.first_name} ${w.user.last_name}`,
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
        };
      })
      .filter(Boolean);

    const nextCursor =
      workersRaw.length > 0
        ? workersRaw[workersRaw.length - 1].id.toString()
        : null;

    res.json({ ok: true, data: { items: result, nextCursor } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
