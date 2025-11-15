const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

exports.createWorker = async (req, res) => {
  try {
    const {
      user_id,
      is_professional,
      pickup_available,
      delivery_available,
      description,
      image_url,
    } = req.body;

    if (!user_id || !/^\d+$/.test(String(user_id))) {
      return res.status(400).json({ error: "Valid user_id is required" });
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found for this user_id" });
    }
    const existingWorker = await prisma.worker.findUnique({
      where: { id: userIdBigInt },
    });

    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Worker already exists for this user" });
    }
    const newWorker = await prisma.worker.create({
      data: {
        id: userIdBigInt,
        is_professional:
          typeof is_professional === "boolean" ? is_professional : false,
        pickup_available:
          typeof pickup_available === "boolean" ? pickup_available : false,
        delivery_available:
          typeof delivery_available === "boolean" ? delivery_available : false,
        description,
        image_url,
      },
      include: {
        user: true,
      },
    });
    return res.status(201).json(newWorker);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
exports.getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
        Services: true,
        Hours: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.json(worker);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const {
      is_professional,
      pickup_available,
      delivery_available,
      description,
      image_url,
    } = req.body;

    const updateData = {};

    if (typeof is_professional === "boolean") {
      updateData.is_professional = is_professional;
    }
    if (typeof pickup_available === "boolean") {
      updateData.pickup_available = pickup_available;
    }
    if (typeof delivery_available === "boolean") {
      updateData.delivery_available = delivery_available;
    }

    if (description !== undefined) {
      updateData.description = description;
    }
    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        user: true,
        Services: true,
        Hours: true,
      },
    });

    return res.json(updatedWorker);
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    await prisma.worker.delete({
      where: { id: BigInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};
