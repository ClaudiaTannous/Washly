const prisma = require("../prisma");

// ---------------------------
// ADD (CREATE)
// ---------------------------
exports.addWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { day_of_week, start_hhmm, end_hhmm } = req.body;

    if (!day_of_week || !start_hhmm || !end_hhmm) {
      return res.status(400).json({ error: "Missing required fields" });
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
      orderBy: [
        { day_of_week: "asc" },
        { start_hhmm: "asc" }
      ]
    });

    return res.json(hours);
  } catch (error) {
    console.error("Get Worker Hours Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// UPDATE HOURS
// ---------------------------
exports.updateWorkerBusinessHours = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { day_of_week, start_hhmm } = req.query;
    const { new_start_hhmm, new_end_hhmm } = req.body;

    if (!day_of_week || !start_hhmm) {
      return res.status(400).json({ error: "Missing query parameters" });
    }

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
