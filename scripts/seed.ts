import { seedDatabase } from "@/lib/db/seed/run-seed";

async function main() {
  const seeded = await seedDatabase();

  console.log(`Seeded ${seeded.restaurants} restaurants`);
  console.log(`Seeded ${seeded.guests} guest profiles`);
  console.log(`Seeded ${seeded.scenarios} canonical scenarios`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
