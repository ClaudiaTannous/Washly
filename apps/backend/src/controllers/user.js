const prisma = require("../prisma");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      country_name,
      city_name,
      street_name,
      building_number,
      apartment_house_number,
      floor_number,
      description,
    } = req.body;

    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone ||
      !country_name ||
      !city_name ||
      !street_name
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone,
        country_name,
        city_name,
        street_name,
        building_number,
        apartment_house_number,
        floor_number,
        description,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        country_name: true,
        city_name: true,
        street_name: true,
        building_number: true,
        apartment_house_number: true,
        floor_number: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user id format" });
    }
    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        country_name: true,
        city_name: true,
        street_name: true,
        building_number: true,
        apartment_house_number: true,
        floor_number: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user id format" });
    }
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      country_name,
      city_name,
      street_name,
      building_number,
      apartment_house_number,
      floor_number,
      description,
    } = req.body;
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (country_name) updateData.country_name = country_name;
    if (city_name) updateData.city_name = city_name;
    if (street_name) updateData.street_name = street_name;
    if (building_number !== undefined)
      updateData.building_number = building_number;
    if (apartment_house_number !== undefined)
      updateData.apartment_house_number = apartment_house_number;
    if (floor_number !== undefined) updateData.floor_number = floor_number;
    if (description !== undefined) updateData.description = description;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        country_name: true,
        city_name: true,
        street_name: true,
        building_number: true,
        apartment_house_number: true,
        floor_number: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user id format" });
    }

    await prisma.user.delete({
      where: { id: BigInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};
exports.checkIfUserIsWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid user id format" });
    }

    const userId = BigInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found in USER table" });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: userId },
      select: {
        id: true,
        is_professional: true,
        pickup_available: true,
        delivery_available: true,
        description: true,
        image_url: true,
      },
    });

    const response = {
      isUser: true,
      isWorker: !!worker,
      workerData: worker || null,
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
