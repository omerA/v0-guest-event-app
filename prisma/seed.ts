import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const eventId = "annual-gathering-2026"

  const existing = await db.event.findUnique({ where: { id: eventId } })
  if (existing) {
    console.warn(`Seed: event "${eventId}" already exists, skipping.`)
    return
  }

  await db.event.create({
    data: {
      id: eventId,
      name: "Annual Gathering 2026",
      date: "2026-04-18T19:00:00",
      location: "The Grand Hall, 123 Event Street",
      description:
        "Join us for an evening of celebration, great food, and wonderful company. An unforgettable night awaits.",
      heroMediaUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
      heroMediaType: "video",
      fontFamily: "playfair",
      pages: {
        create: [
          {
            id: "page-1",
            title: "Your Name",
            subtitle: "Let us know who you are",
            backgroundId: "gradient-champagne",
            order: 0,
            questions: {
              create: [{ id: "q-name", type: "text", label: "What is your full name?", required: true, order: 0 }],
            },
          },
          {
            id: "page-2",
            title: "Your Attendance",
            subtitle: "Will you be joining us?",
            backgroundId: "gradient-forest",
            order: 1,
            questions: {
              create: [
                { id: "q-attendance", type: "yes-no", label: "Will you attend the event?", required: true, order: 0 },
              ],
            },
          },
          {
            id: "page-3",
            title: "Dietary Preference",
            subtitle: "Help us prepare for you",
            backgroundId: "gradient-rose",
            order: 2,
            questions: {
              create: [
                {
                  id: "q-dietary",
                  type: "single-choice",
                  label: "Do you have any dietary preferences?",
                  options: ["No Preference", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"],
                  required: true,
                  order: 0,
                },
              ],
            },
          },
          {
            id: "page-4",
            title: "Plus Ones",
            subtitle: "Bringing anyone along?",
            backgroundId: "gradient-ocean",
            order: 3,
            questions: {
              create: [
                {
                  id: "q-guests",
                  type: "guest-count",
                  label: "How many additional guests are coming with you?",
                  required: false,
                  order: 0,
                },
              ],
            },
          },
          {
            id: "page-5",
            title: "Special Requests",
            subtitle: "Anything else we should know?",
            backgroundId: "gradient-midnight",
            order: 4,
            questions: {
              create: [
                { id: "q-notes", type: "text", label: "Any special requests or notes?", required: false, order: 0 },
              ],
            },
          },
        ],
      },
    },
  })

  console.warn(`Seed: created default event "${eventId}"`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
