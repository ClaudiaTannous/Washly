const prisma = require("./prisma");
const bcrypt = require("bcryptjs");

// Make BigInt JSON-safe
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const PASSWORD = "Washly123!";

async function createUser(data) {
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  return prisma.user.upsert({
    where: {
      email: data.email,
    },
    update: {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      country_name: data.country_name,
      city_name: data.city_name,
      street_name: data.street_name,
      building_number: data.building_number,
      apartment_house_number: data.apartment_house_number,
      floor_number: data.floor_number,
      description: data.description,
      updated_at: new Date(),
    },
    create: {
      ...data,
      password_hash,
    },
  });
}

async function createWorkerForUser(user, workerData) {
  return prisma.worker.upsert({
    where: {
      id: user.id,
    },
    update: workerData,
    create: {
      id: user.id,
      ...workerData,
    },
  });
}

async function main() {
  console.log("Seeding Washly demo data...");

  const customers = [
    {
      email: "mariam.khatib@washly.demo",
      first_name: "Mariam",
      last_name: "Khatib",
      phone: "0523457811",
      country_name: "Israel",
      city_name: "Haifa",
      street_name: "Abbas",
      building_number: 18,
      apartment_house_number: 7,
      floor_number: 2,
      description:
        "Customer from Haifa who usually books pickup and delivery laundry service.",
    },
    {
      email: "ahmad.mansour@washly.demo",
      first_name: "Ahmad",
      last_name: "Mansour",
      phone: "0546129083",
      country_name: "Israel",
      city_name: "Nazareth",
      street_name: "Paulus HaShishi",
      building_number: 44,
      apartment_house_number: 3,
      floor_number: 1,
      description:
        "Customer from Nazareth looking for fast weekly laundry service.",
    },
    {
      email: "noa.levi@washly.demo",
      first_name: "Noa",
      last_name: "Levi",
      phone: "0527789140",
      country_name: "Israel",
      city_name: "Tel Aviv",
      street_name: "Dizengoff",
      building_number: 126,
      apartment_house_number: 12,
      floor_number: 4,
      description:
        "Customer from Tel Aviv who prefers professional laundry workers.",
    },
    {
      email: "yonatan.cohen@washly.demo",
      first_name: "Yonatan",
      last_name: "Cohen",
      phone: "0534421765",
      country_name: "Israel",
      city_name: "Jerusalem",
      street_name: "Jaffa",
      building_number: 78,
      apartment_house_number: 21,
      floor_number: 6,
      description:
        "Customer from Jerusalem who often needs evening pickup times.",
    },
    {
      email: "lina.haddad@washly.demo",
      first_name: "Lina",
      last_name: "Haddad",
      phone: "0509364271",
      country_name: "Israel",
      city_name: "Acre",
      street_name: "Salah ad-Din",
      building_number: 9,
      apartment_house_number: 2,
      floor_number: 1,
      description: "Customer from Acre looking for affordable laundry service.",
    },
  ];

  const workers = [
    {
      user: {
        email: "samer.darwish@washly.demo",
        first_name: "Samer",
        last_name: "Darwish",
        phone: "0524918376",
        country_name: "Israel",
        city_name: "Haifa",
        street_name: "Hatzionut",
        building_number: 32,
        apartment_house_number: 5,
        floor_number: 2,
        description:
          "Independent laundry worker in Haifa specializing in wash and fold.",
      },
      worker: {
        is_professional: true,
        pickup_available: true,
        delivery_available: true,
        description:
          "Professional laundry service in Haifa. Careful washing, folding, pickup and delivery available.",
        is_online: true,
        max_orders_per_day: 6,
        min_notice_minutes: 120,
        max_items_per_wash: 12,
        price_per_wash: 35,
        image_url: "/default-avatar.png",
      },
    },
    {
      user: {
        email: "yael.benami@washly.demo",
        first_name: "Yael",
        last_name: "Ben Ami",
        phone: "0548201937",
        country_name: "Israel",
        city_name: "Tel Aviv",
        street_name: "Allenby",
        building_number: 61,
        apartment_house_number: 8,
        floor_number: 3,
        description:
          "Laundry worker from Tel Aviv offering flexible pickup times.",
      },
      worker: {
        is_professional: true,
        pickup_available: true,
        delivery_available: true,
        description:
          "Fast and clean laundry service in central Tel Aviv. Good for students and busy professionals.",
        is_online: true,
        max_orders_per_day: 8,
        min_notice_minutes: 90,
        max_items_per_wash: 10,
        price_per_wash: 40,
        image_url: "/default-avatar.png",
      },
    },
    {
      user: {
        email: "omar.zahalka@washly.demo",
        first_name: "Omar",
        last_name: "Zahalka",
        phone: "0507136542",
        country_name: "Israel",
        city_name: "Umm al-Fahm",
        street_name: "Al-Madina",
        building_number: 15,
        apartment_house_number: 1,
        floor_number: 0,
        description:
          "Local laundry worker serving Umm al-Fahm and nearby areas.",
      },
      worker: {
        is_professional: false,
        pickup_available: true,
        delivery_available: false,
        description:
          "Affordable home laundry service. Pickup available inside Umm al-Fahm.",
        is_online: true,
        max_orders_per_day: 4,
        min_notice_minutes: 180,
        max_items_per_wash: 9,
        price_per_wash: 28,
        image_url: "/default-avatar.png",
      },
    },
    {
      user: {
        email: "tamar.mizrahi@washly.demo",
        first_name: "Tamar",
        last_name: "Mizrahi",
        phone: "0526071189",
        country_name: "Israel",
        city_name: "Jerusalem",
        street_name: "Emek Refaim",
        building_number: 23,
        apartment_house_number: 6,
        floor_number: 2,
        description:
          "Laundry worker in Jerusalem with careful handling for delicate clothes.",
      },
      worker: {
        is_professional: true,
        pickup_available: false,
        delivery_available: true,
        description:
          "Careful wash, dry and fold service in Jerusalem. Delivery available after completion.",
        is_online: true,
        max_orders_per_day: 5,
        min_notice_minutes: 150,
        max_items_per_wash: 11,
        price_per_wash: 38,
        image_url: "/default-avatar.png",
      },
    },
    {
      user: {
        email: "nour.issa@washly.demo",
        first_name: "Nour",
        last_name: "Issa",
        phone: "0543319208",
        country_name: "Israel",
        city_name: "Acre",
        street_name: "Ben Ami",
        building_number: 40,
        apartment_house_number: 4,
        floor_number: 1,
        description:
          "Laundry worker from Acre offering simple and reliable service.",
      },
      worker: {
        is_professional: false,
        pickup_available: true,
        delivery_available: true,
        description:
          "Reliable laundry service in Acre. Good prices, pickup and delivery available.",
        is_online: true,
        max_orders_per_day: 5,
        min_notice_minutes: 120,
        max_items_per_wash: 10,
        price_per_wash: 30,
        image_url: "/default-avatar.png",
      },
    },
  ];

  for (const customer of customers) {
    const createdCustomer = await createUser(customer);
    console.log(
      `Customer saved: ${createdCustomer.first_name} ${createdCustomer.last_name}`,
    );
  }

  for (const item of workers) {
    const user = await createUser(item.user);
    const worker = await createWorkerForUser(user, item.worker);

    console.log(
      `Worker saved: ${user.first_name} ${user.last_name}, worker id: ${worker.id}`,
    );
  }

  console.log("Done. Demo data saved to the database.");
  console.log(`Demo password for all users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
