const prisma = require("../prisma");

// ---------------------------
// ADD (CREATE)
// ---------------------------
exports.addWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { day_of_week, start_hhmm, end_hhmm } = req.body;

    if (day_of_week === undefined || !start_hhmm || !end_hhmm) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (start_hhmm >= end_hhmm) {
      return res.status(400).json({
        error: "start_hhmm must be before end_hhmm",
      });
    }

    const overlap = await prisma.workerBusinessHours.findFirst({
      where: {
        worker_id: BigInt(workerId),
        day_of_week,
        AND: [
          { start_hhmm: { lt: end_hhmm } },
          { end_hhmm: { gt: start_hhmm } },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({
        error: "Business hours overlap with existing range",
      });
    }

    const hours = await prisma.workerBusinessHours.create({
      data: {
        worker_id: BigInt(workerId),
        day_of_week,
        start_hhmm,
        end_hhmm,
      },
    });

    return res.status(201).json(hours);
  } catch (error) {
    console.error("Add Worker Hours Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET ALL HOURS FOR A WORKER
// ---------------------------
exports.getWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;

    const hours = await prisma.workerBusinessHours.findMany({
      where: { worker_id: BigInt(workerId) },
      orderBy: [{ day_of_week: "asc" }, { start_hhmm: "asc" }],
    });

    return res.json(hours);
  } catch (error) {
    console.error("Get Worker Hours Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { day_of_week, start_hhmm } = req.query;
    const { new_start_hhmm, new_end_hhmm } = req.body;

    if (!day_of_week || !start_hhmm || !new_start_hhmm || !new_end_hhmm) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 1️⃣ Validate time order
    if (new_start_hhmm >= new_end_hhmm) {
      return res.status(400).json({
        error: "start_hhmm must be before end_hhmm",
      });
    }

    // 2️⃣ Overlap check (exclude current record)
    const overlap = await prisma.workerBusinessHours.findFirst({
      where: {
        worker_id: BigInt(workerId),
        day_of_week: parseInt(day_of_week),
        NOT: { start_hhmm },
        AND: [
          { start_hhmm: { lt: new_end_hhmm } },
          { end_hhmm: { gt: new_start_hhmm } },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({
        error: "Updated hours overlap with existing range",
      });
    }

    // 3️⃣ Update
    const updated = await prisma.workerBusinessHours.update({
      where: {
        worker_id_day_of_week_start_hhmm: {
          worker_id: BigInt(workerId),
          day_of_week: parseInt(day_of_week),
          start_hhmm,
        },
      },
      data: {
        start_hhmm: new_start_hhmm,
        end_hhmm: new_end_hhmm,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update Worker Hours Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// DELETE HOURS
// ---------------------------
exports.deleteWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { day_of_week, start_hhmm } = req.query;

    if (!day_of_week || !start_hhmm) {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    await prisma.workerBusinessHours.delete({
      where: {
        worker_id_day_of_week_start_hhmm: {
          worker_id: BigInt(workerId),
          day_of_week: parseInt(day_of_week),
          start_hhmm,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete Worker Hours Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

// ------------------------------------
// BULK ADD BUSINESS HOURS
// ------------------------------------
exports.addWorkerBusinessHoursBulk = async (req, res) => {
  try {
    const { workerId } = req.params;
    const hours = req.body;

    if (!Array.isArray(hours) || hours.length === 0) {
      return res.status(400).json({ error: "Hours array is required" });
    }

    await prisma.workerBusinessHours.createMany({
      data: hours.map((h) => ({
        worker_id: BigInt(workerId),
        day_of_week: h.day_of_week,
        start_hhmm: h.start_hhmm,
        end_hhmm: h.end_hhmm,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("addWorkerBusinessHoursBulk error:", err);
    res.status(500).json({ error: err.message });
  }
};
