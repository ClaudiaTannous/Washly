const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

// GET /api/search/workers
router.get("/search/workers", async (req, res) => {
  try {
    const {
      q,
      city,
      service_code,
      is_professional,
      pickup,
      delivery,
      minRating,
      maxPrice,
      limit = 12,
      cursor,
      worker_id, // 👈 NEW: allow filtering by a specific worker
    } = req.query;

    const idFilter = worker_id ? BigInt(worker_id) : null;

    const where = {
      ...(idFilter ? { id: idFilter } : {}), // 👈 filter by worker id if provided

      ...(is_professional !== undefined
        ? { is_professional: is_professional === "true" }
        : {}),
      ...(pickup !== undefined
        ? { pickup_available: pickup === "true" }
        : {}),
      ...(delivery !== undefined
        ? { delivery_available: delivery === "true" }
        : {}),

      user: {
        ...(city
          ? { city_name: { equals: city, mode: "insensitive" } }
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

      ...(service_code
        ? {
            Services: {
              some: {
                service_code,
                is_active: true,
                ...(maxPrice
                  ? { base_price: { lte: maxPrice.toString() } }
                  : {}),
              },
            },
          }
        : {}),
    };

    const workers = await prisma.worker.findMany({
      where,
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: BigInt(cursor) } } : {}),
      orderBy: [{ is_online: "desc" }, { id: "asc" }],
      include: {
        user: true,
        Services: {
          where: {
            is_active: true,
            ...(service_code ? { service_code } : {}),
          },
          include: { Service: true },
        },
        RatingsReceived: true,
      },
    });

    // compute rating avg + shape result
    const result = workers
      .map((w) => {
        const avg =
          w.RatingsReceived.length > 0
            ? w.RatingsReceived.reduce(
                (sum, r) => sum + r.score,
                0
              ) / w.RatingsReceived.length
            : 0;

        if (minRating && avg < Number(minRating)) return null;

        return {
          worker_id: w.id.toString(),
          is_online: w.is_online,
          pickup_available: w.pickup_available,
          delivery_available: w.delivery_available,
          is_professional: w.is_professional,
          image_url: w.image_url,
          profile: {
            name: `${w.user.first_name} ${w.user.last_name}`,
            city: w.user.city_name,
            street: w.user.street_name,
            building_number: w.user.building_number,
            phone: w.user.phone,
            description: w.description || w.user.description,
          },
          rating: {
            avg: avg,
            count: w.RatingsReceived.length,
          },
          services: w.Services.map((s) => ({
            service_code: s.service_code,
            name: s.Service.display_name,
            unit: s.Service.unit,
            base_price: s.base_price
              ? s.base_price.toString()
              : null, // 👈 handle nullable Decimal
            notes: s.notes,
          })),
        };
      })
      .filter(Boolean);

    const nextCursor =
      workers.length > 0
        ? workers[workers.length - 1].id.toString()
        : null;

    res.json({ ok: true, data: { items: result, nextCursor } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
