export const EXAMPLE_PATH = "blog-starter";
export const CMS_NAME = "Markdown";
export const HOME_OG_IMAGE_URL =
  "https://og-image.vercel.app/Next.js%20Blog%20Starter%20Example.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg";

// UEbungsleiter categories per Abteilung
export const UEBUNGSLEITER_CATEGORIES: Record<string, { name: string; slug: string }[]> = {
  "Fußball": [
    { name: "Jugend", slug: "jugend" },
    { name: "Aktive", slug: "aktive" },
  ],
  "Turnen/Leichtathletik": [
    { name: "Turnen", slug: "turnen" },
    { name: "Leichtathletik", slug: "leichtathletik" },
    { name: "Tang-Soo-Doo", slug: "tang-soo-doo" },
    { name: "Jedermänner", slug: "jedermaenner" },
  ],
};