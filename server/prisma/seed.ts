// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create templates
  const templates = [
    {
      name: "Classic",
      isPremium: false,
      thumbnail:
        "https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Classic",
    },
    {
      name: "Modern",
      isPremium: false,
      thumbnail:
        "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Modern",
    },
    {
      name: "Minimal",
      isPremium: true,
      thumbnail:
        "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Minimal",
    },
    {
      name: "Creative",
      isPremium: true,
      thumbnail:
        "https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Creative",
    },
  ];

  for (const template of templates) {
    // First try to find by name
    const existingTemplate = await prisma.template.findFirst({
      where: { name: template.name },
    });

    if (existingTemplate) {
      // Update existing template
      await prisma.template.update({
        where: { id: existingTemplate.id },
        data: template,
      });
      console.log(`✅ Updated template: ${template.name}`);
    } else {
      // Create new template
      await prisma.template.create({
        data: template,
      });
      console.log(`✅ Created template: ${template.name}`);
    }
  }

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
