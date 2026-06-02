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
      email: "mariam.khatib@gmail.com",
      first_name: "Mariam",
      last_name: "Khatib",
      phone: "0523457811",
      country_name: "Israel",
      city_name: "Haifa",
      street_name: "Abbas",
      building_number: 18,
      apartment_house_number: 7,
      floor_number: 2,
      description: "Working professional looking for weekly laundry service.",
    },
    {
      email: "ahmad.mansour@gmail.com",
      first_name: "Ahmad",
      last_name: "Mansour",
      phone: "0546129083",
      country_name: "Israel",
      city_name: "Nazareth",
      street_name: "Paulus HaShishi",
      building_number: 44,
      apartment_house_number: 3,
      floor_number: 1,
      description: "Customer who prefers pickup and delivery.",
    },
    {
      email: "noa.levi@gmail.com",
      first_name: "Noa",
      last_name: "Levi",
      phone: "0527789140",
      country_name: "Israel",
      city_name: "Tel Aviv",
      street_name: "Dizengoff",
      building_number: 126,
      apartment_house_number: 12,
      floor_number: 4,
      description: "Student looking for fast laundry service.",
    },
    {
      email: "yonatan.cohen@gmail.com",
      first_name: "Yonatan",
      last_name: "Cohen",
      phone: "0534421765",
      country_name: "Israel",
      city_name: "Jerusalem",
      street_name: "Jaffa",
      building_number: 78,
      apartment_house_number: 21,
      floor_number: 6,
      description: "Customer who often books evening pickups.",
    },
    {
      email: "lina.haddad@gmail.com",
      first_name: "Lina",
      last_name: "Haddad",
      phone: "0509364271",
      country_name: "Israel",
      city_name: "Acre",
      street_name: "Salah ad-Din",
      building_number: 9,
      apartment_house_number: 2,
      floor_number: 1,
      description: "Looking for affordable laundry services.",
    },
  ];

  const workers = [
    {
      user: {
        email: "samer.darwish@gmail.com",
        first_name: "Samer",
        last_name: "Darwish",
        phone: "0524918376",
        country_name: "Israel",
        city_name: "Haifa",
        street_name: "Hatzionut",
        building_number: 32,
        apartment_house_number: 5,
        floor_number: 2,
        description: "Professional laundry provider in Haifa.",
      },
      worker: {
        is_professional: true,
        pickup_available: true,
        delivery_available: true,
        description: "Wash, dry, fold, pickup and delivery services.",
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
        email: "yael.benami@gmail.com",
        first_name: "Yael",
        last_name: "Ben Ami",
        phone: "0548201937",
        country_name: "Israel",
        city_name: "Tel Aviv",
        street_name: "Allenby",
        building_number: 61,
        apartment_house_number: 8,
        floor_number: 3,
        description: "Laundry worker serving central Tel Aviv.",
      },
      worker: {
        is_professional: true,
        pickup_available: true,
        delivery_available: true,
        description: "Fast laundry service for busy professionals.",
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
        email: "omar.zahalka@gmail.com",
        first_name: "Omar",
        last_name: "Zahalka",
        phone: "0507136542",
        country_name: "Israel",
        city_name: "Umm al-Fahm",
        street_name: "Al-Madina",
        building_number: 15,
        apartment_house_number: 1,
        floor_number: 0,
        description: "Local laundry provider for Umm al-Fahm.",
      },
      worker: {
        is_professional: false,
        pickup_available: true,
        delivery_available: false,
        description: "Affordable home laundry service.",
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
        email: "tamar.mizrahi@gmail.com",
        first_name: "Tamar",
        last_name: "Mizrahi",
        phone: "0526071189",
        country_name: "Israel",
        city_name: "Jerusalem",
        street_name: "Emek Refaim",
        building_number: 23,
        apartment_house_number: 6,
        floor_number: 2,
        description: "Specialist in delicate fabrics and formal clothing.",
      },
      worker: {
        is_professional: true,
        pickup_available: false,
        delivery_available: true,
        description: "Premium laundry service with careful garment handling.",
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
        email: "nour.issa@gmail.com",
        first_name: "Nour",
        last_name: "Issa",
        phone: "0543319208",
        country_name: "Israel",
        city_name: "Acre",
        street_name: "Ben Ami",
        building_number: 40,
        apartment_house_number: 4,
        floor_number: 1,
        description: "Reliable pickup and delivery laundry service.",
      },
      worker: {
        is_professional: false,
        pickup_available: true,
        delivery_available: true,
        description: "Affordable laundry service with flexible hours.",
        is_online: true,
        max_orders_per_day: 5,
        min_notice_minutes: 120,
        max_items_per_wash: 10,
        price_per_wash: 30,
        image_url: "/default-avatar.png",
      },
    },
  ];

  const services = [
    {
      service_code: "WASH_FOLD",
      display_name: "Wash & Fold",
      unit: "basket",
      default_proximate_turnaround_hours: 24,
      description: "Standard wash, dry and fold service.",
      delicate_fabric: false,
    },
    {
      service_code: "IRONING",
      display_name: "Ironing",
      unit: "item",
      default_proximate_turnaround_hours: 12,
      description: "Professional ironing service.",
      delicate_fabric: false,
    },
    {
      service_code: "BEDDING",
      display_name: "Bedding & Sheets",
      unit: "set",
      default_proximate_turnaround_hours: 24,
      description: "Cleaning of bed sheets and pillow covers.",
      delicate_fabric: false,
    },
    {
      service_code: "BLANKETS",
      display_name: "Blankets & Comforters",
      unit: "item",
      default_proximate_turnaround_hours: 48,
      description: "Large blanket and comforter cleaning.",
      delicate_fabric: false,
    },
    {
      service_code: "DELICATES",
      display_name: "Delicate Garments",
      unit: "item",
      default_proximate_turnaround_hours: 36,
      description: "Special care for delicate fabrics.",
      delicate_fabric: true,
    },
    {
      service_code: "SUITS",
      display_name: "Suits & Formal Wear",
      unit: "item",
      default_proximate_turnaround_hours: 48,
      description: "Formal clothing cleaning.",
      delicate_fabric: true,
    },
    {
      service_code: "CURTAINS",
      display_name: "Curtains",
      unit: "item",
      default_proximate_turnaround_hours: 72,
      description: "Curtain washing service.",
      delicate_fabric: false,
    },
    {
      service_code: "EXPRESS",
      display_name: "Express Laundry",
      unit: "basket",
      default_proximate_turnaround_hours: 6,
      description: "Same day laundry service.",
      delicate_fabric: false,
    },
  ];

  for (const service of services) {
    await prisma.serviceCatalog.upsert({
      where: {
        service_code: service.service_code,
      },
      update: service,
      create: service,
    });
  }

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
const weeklyHours = [
  { day_of_week: 0, start_hhmm: "09:00", end_hhmm: "17:00" },
  { day_of_week: 1, start_hhmm: "09:00", end_hhmm: "18:00" },
  { day_of_week: 2, start_hhmm: "09:00", end_hhmm: "18:00" },
  { day_of_week: 3, start_hhmm: "09:00", end_hhmm: "18:00" },
  { day_of_week: 4, start_hhmm: "09:00", end_hhmm: "18:00" },
  { day_of_week: 5, start_hhmm: "09:00", end_hhmm: "15:00" },
];

for (const hour of weeklyHours) {
  await prisma.workerBusinessHours.upsert({
    where: {
      worker_id_day_of_week_start_hhmm: {
        worker_id: worker.id,
        day_of_week: hour.day_of_week,
        start_hhmm: hour.start_hhmm,
      },
    },
    update: {
      end_hhmm: hour.end_hhmm,
    },
    create: {
      worker_id: worker.id,
      day_of_week: hour.day_of_week,
      start_hhmm: hour.start_hhmm,
      end_hhmm: hour.end_hhmm,
    },
  });
}

const workerServicesMap = {
  "samer.darwish@gmail.com": [
    "WASH_FOLD",
    "IRONING",
    "BEDDING",
    "BLANKETS",
    "DELICATES",
  ],

  "yael.benami@gmail.com": [
    "WASH_FOLD",
    "IRONING",
    "SUITS",
    "DELICATES",
    "EXPRESS",
  ],

  "omar.zahalka@gmail.com": ["WASH_FOLD", "BEDDING"],

  "tamar.mizrahi@gmail.com": [
    "WASH_FOLD",
    "IRONING",
    "SUITS",
    "DELICATES",
    "CURTAINS",
  ],

  "nour.issa@gmail.com": ["WASH_FOLD", "BEDDING", "BLANKETS", "EXPRESS"],
};

const servicesForWorker = workerServicesMap[item.user.email] || [];

for (const serviceCode of servicesForWorker) {
  await prisma.workerService.upsert({
    where: {
      worker_id_service_code: {
        worker_id: worker.id,
        service_code: serviceCode,
      },
    },
    update: {},
    create: {
      worker_id: worker.id,
      service_code: serviceCode,
      is_active: true,
      base_price: Math.floor(
        item.worker.price_per_wash * (0.8 + Math.random() * 0.5),
      ),
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
