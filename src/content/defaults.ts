import type { SectionKey } from "./schemas.js";

/**
 * The content the site ships with, lifted verbatim from the frontend's static
 * files so the very first render after seeding is byte-identical to the
 * approved design. Bracketed values ("[xx]k", "Lorem Ipsum") are the designer's
 * placeholders for the client to replace from the admin panel.
 */

/** Semantic asset names -> the client's files in the frontend's public/assets. */
export const seedAssets = {
  heroPortrait: "912849DA-8C83-4B9C-9A28-CB4292CA6340 1.png",
  heroTexture: "image 20 (2).png",
  content1: "smirthi-100.jpg",
  content2: "smrithi-102.jpg",
  content3: "smrithi-105.jpg",
  content4: "smrithi-106.jpg",
  content5: "smrithi-109.jpg",
  platform1: "image 26.png",
  platform2: "image 28.png",
  platform3: "image 30.png",
  platform4: "image 29.png",
  platform5: "image 27.png",
  platform6: "image 31.png",
  project1: "Mask group (3).png",
  project2: "Mask group (1).png",
  project3: "Mask group (2).png",
  brand1: "Vector.png",
  brand2: "logo.png",
  brand3: "Vector (2).png",
  media1: "image 40 (1).png",
  media2: "Frame 73 (1).png",
  media3: "image 84.png",
  careerPortrait: "3EB00A70-DDE1-4D04-B922-DC366A8742C4 5.png",
  contactBackground: "image 47 (1).png",
  contentProfessional: "image 69.png",
  contentSelf: "683922ED-17FC-49B9-AF05-1AD78C37EE79 3.png",
  workBanner: "image 70.png",
  work1: "image 80.png",
  work2: "image 78 (1).png",
  work3: "image 27.png",
  work4: "image 81 (2).png",
  work5: "image 79.png",
  work6: "image 77 (1).png",
  selfBanner: "683922ED-17FC-49B9-AF05-1AD78C37EE79 5 (1).png",
  self1: "21BAC758-7BEB-4032-A811-7F18991E55E5 2.png",
  self2: "image 73.png",
  self3: "21BAC758-7BEB-4032-A811-7F18991E55E5 2 (1).png",
  self4: "image 74.png",
  self5: "image 76.png",
  self6: "image 72.png",
  self7: "image 75.png",
} as const;

export type SeedAsset = keyof typeof seedAssets;

/** Resolves a semantic asset name to the URL it was uploaded to. */
export type AssetUrls = Record<SeedAsset, string>;

const lorem = "Lorem Ipsum has been the industry’s standard dummy text ever since";

/** The design shows one label and heading on every tab, so each platform starts from the same pair. */
const platformHeading = () => ({
  eyebrow: "-Platforms",
  lines: [[{ text: "Platform", accent: true }], [{ text: "Native" }]],
});

export function buildDefaults(u: AssetUrls): Record<SectionKey, Record<string, unknown>> {
  return {
    "site.nav": {
      items: [
        { label: "Home", href: "/" },
        { label: "About me", href: "/#about" },
        { label: "Social media", href: "/#social" },
        { label: "Content", href: "/content" },
        { label: "Journey", href: "/#journey" },
        { label: "Contact", href: "/#contact" },
      ],
    },

    "home.hero": {
      titleTop: "Content",
      titleMid: "Meets",
      titleBottom: "Strategy",
      subtitle:
        "Where high-fashion editorial aesthetics meet the data-driven pulse of modern marketing. We build digital legacies that convert.",
      primaryCta: { label: "See my work", href: "#content" },
      secondaryCta: { label: "Let’s connect", href: "#contact" },
      portrait: u.heroPortrait,
      texture: u.heroTexture,
    },

    "home.about": {
      eyebrow: "-About me",
      statement:
        "I didn’t pick between being a creator and being a strategist. I chose both — and built a career at the exact intersection. MBA in hand, platform instincts sharp, and a genuine love for fashion, beauty, and the kind of storytelling that makes people feel something.",
    },

    "home.contentPortfolio": {
      eyebrow: "-Content portfolio",
      lines: [[{ text: "Work that" }], [{ text: "hits different", accent: true }]],
      pieces: [
        { id: "fashion", number: "01.", label: "-Fashion & Style", image: u.content1 },
        { id: "makeup", number: "02.", label: "-Makeup", image: u.content2 },
        { id: "lifestyle", number: "03.", label: "-Lifestyle", image: u.content3 },
        { id: "strategy", number: "04.", label: "-Strategy", image: u.content4 },
        { id: "professional", number: "05.", label: "-Professional", image: u.content5 },
      ],
    },

    "home.platforms": {
      items: [
        {
          ...platformHeading(),
          id: "instagram",
          name: "Instagram",
          followers: "[xx]k Followers",
          handle: "@just.lailaaaaaa",
          description:
            "Fashion, lifestyle, and behind-the-scenes creator content. Shot on iPhone and intentionally real.",
          profileUrl: "https://instagram.com/",
          followLabel: "Follow",
          collabUrl: "#contact",
          collabLabel: "Collab enquiry",
          images: [u.platform1, u.platform2, u.platform3, u.platform4, u.platform5, u.platform6].map((url) => ({ url })),
        },
        {
          ...platformHeading(),
          id: "tiktok",
          name: "TikTok",
          followers: "[xx]k Followers",
          handle: "@just.lailaaaaaa",
          description:
            "Short-form fashion and beauty edits, trend takes, and get-ready-with-me moments that move fast.",
          profileUrl: "https://tiktok.com/",
          followLabel: "Follow",
          collabUrl: "#contact",
          collabLabel: "Collab enquiry",
          images: [u.platform4, u.platform1, u.platform6, u.platform2, u.platform5, u.platform3].map((url) => ({ url })),
        },
        {
          ...platformHeading(),
          id: "youtube",
          name: "YouTube",
          followers: "[xx]k Subscribers",
          handle: "@just.lailaaaaaa",
          description:
            "Long-form vlogs, campaign breakdowns, and the strategy behind the content, told in full.",
          profileUrl: "https://youtube.com/",
          followLabel: "Follow",
          collabUrl: "#contact",
          collabLabel: "Collab enquiry",
          images: [u.platform3, u.platform6, u.platform2, u.platform5, u.platform1, u.platform4].map((url) => ({ url })),
        },
      ],
    },

    "home.journey": {
      eyebrow: "-Professional journey",
      lines: [[{ text: "the" }], [{ text: "glow" }], [{ text: "up" }], [{ text: "timeline", accent: true }]],
      steps: [
        {
          id: "education",
          category: "Education",
          title: "MBA — Digital Marketing",
          description: "Built the strategic and analytical foundation that shapes every campaign and creative decision.",
        },
        {
          id: "marketing",
          category: "Marketing",
          title: "Digital Marketing Specialist",
          description: "Multi-channel campaigns, reporting frameworks, and platform-specific strategy at scale.",
        },
        {
          id: "leadership",
          category: "Leadership",
          title: "Digital Marketing Team Leader",
          description: "Led a team of [X] across content, paid, and social — from brief to performance review.",
        },
        {
          id: "creator",
          category: "Creator",
          title: "Content Creator",
          description: "Launched across IG, TikTok, and YouTube — building community around fashion, beauty, and lifestyle.",
        },
        {
          id: "podcast",
          category: "Podcast",
          title: "Podcast Host & Interviewer",
          description: "A show interviewing marketers and creators at the front edge of digital culture.",
        },
        {
          id: "brand",
          category: "Brand",
          title: "Creator × Strategist",
          description: "Merging creative instinct with strategic depth — for brands, collabs, and consulting.",
        },
      ],
    },

    "home.projects": {
      eyebrow: "-Featured Projects & Campaigns",
      lines: [[{ text: "the work", accent: true }], [{ text: "speak for itself" }]],
      items: [
        { id: "project-1", title: "Lorem Ipsum", description: lorem, image: u.project1, tint: "#e8d5b5", href: "#" },
        { id: "project-2", title: "Lorem Ipsum", description: lorem, image: u.project2, tint: "#fe9dd2", href: "#" },
        { id: "project-3", title: "Lorem Ipsum", description: lorem, image: u.project3, tint: "#e5e1da", href: "#" },
      ],
    },

    "home.brands": {
      eyebrow: "-Collaborations",
      lines: [[{ text: "trusted", accent: true }], [{ text: "brands" }]],
      items: [
        { id: "brand-1", name: "Logoipsum", logo: u.brand1, width: 205, height: 41 },
        { id: "brand-2", name: "Logoipsum", logo: u.brand2, width: 207, height: 41 },
        { id: "brand-3", name: "Logoipsum", logo: u.brand3, width: 175, height: 41 },
      ],
    },

    "home.media": {
      eyebrow: "-Podcast & Media",
      lines: [[{ text: "on the " }, { text: "mic.", accent: true }]],
      items: [
        { id: "media-1", title: "Podcast episode 1", poster: u.media1 },
        { id: "media-2", title: "Podcast episode 2", poster: u.media2 },
        { id: "media-3", title: "Podcast episode 3", poster: u.media3 },
      ],
    },

    "home.career": {
      portrait: u.careerPortrait,
      cards: [
        {
          id: "mba",
          lines: [[{ text: "MBA in" }], [{ text: "Digital", accent: true }], [{ text: "Marketing", accent: true }]],
          meta: "Duration",
        },
        {
          id: "lead",
          lines: [
            [{ text: "Digital" }],
            [{ text: "Marketing", accent: "mobile" }],
            [{ text: "Team Leader", accent: true }],
            [{ text: "& Specialist", accent: true }],
          ],
          meta: "Company & Year",
        },
        {
          id: "creator",
          lines: [[{ text: "Strategist &" }], [{ text: "Content", accent: true }], [{ text: "Creator", accent: true }]],
          meta: "Small detail",
        },
      ],
      panel: {
        lines: [[{ text: "Want the" }], [{ text: "Full picture?", accent: true }]],
        description: "Download the full CV or hit the button to start a conversation",
        downloadCta: { label: "Download", href: "#" },
        contactCta: { label: "Get in touch", href: "#contact" },
      },
    },

    "home.contact": {
      eyebrow: "-Contact",
      lines: [[{ text: "let’s" }], [{ text: "build" }], [{ text: "something", accent: true }], [{ text: "iconic" }]],
      description:
        "Brand collab, marketing strategy, content partnership, or just a good conversation about the creator economy - slide into my inbox.",
      instagram: { handle: "@just.lailaaaaaa", url: "https://instagram.com/" },
      email: "just.laila@gmail.com",
      background: u.contactBackground,
      form: {
        nameLabel: "Name",
        namePlaceholder: "Your name",
        emailLabel: "Email",
        emailPlaceholder: "Your @gmail.com",
        messageLabel: "Message",
        messagePlaceholder: "Tell me about the project",
        submitLabel: "Submit",
      },
    },

    "page.content": {
      title: "Content",
      panels: [
        {
          id: "professional-work",
          lines: [[{ text: "professional", accent: true }], [{ text: "work" }]],
          image: u.contentProfessional,
          alt: "Model in a grey turtleneck against a graffiti wall",
          href: "/content/professional-work",
        },
        {
          id: "self-content",
          lines: [[{ text: "self", accent: true }], [{ text: "content" }]],
          image: u.contentSelf,
          alt: "Smrithi resting her chin on her hands in warm window light",
          href: "/content/self-content",
        },
      ],
    },

    "works.professional-work": {
      title: "Professional work",
      banner: {
        eyebrow: "-professional work",
        lines: [[{ text: "brand" }], [{ text: "strategy", accent: true }], [{ text: "results" }]],
        image: u.workBanner,
        alt: "Model in a grey turtleneck against a graffiti wall with autumn posters",
        cta: { label: "Self content", href: "/content/self-content" },
      },
      cards: [
        {
          id: "team-leadership",
          tag: "Team management",
          title: ["Team leadership-", "Marketing Dept"],
          description: lorem,
          image: u.work1,
          alt: "Speaker addressing a full auditorium",
          size: "tall",
        },
        {
          id: "beauty-culture",
          tag: "Campaign",
          title: ["Beauty culture", "campaign"],
          description: lorem,
          image: u.work2,
          alt: "Smiling woman surrounded by hairstyling tools",
          size: "square",
        },
        {
          id: "fashion-editorial",
          tag: "Campaign",
          title: ["Fashion editorial", "campaign"],
          description: lorem,
          image: u.work3,
          alt: "Black and white portrait in a white dress under a spotlight",
          size: "tall",
        },
        {
          id: "podcast-growth-press",
          tag: "Brand strategy",
          title: ["Podcast", "Growth initiative"],
          description: lorem,
          image: u.work4,
          alt: "Woman reading a newspaper at a café table",
          size: "square",
        },
        {
          id: "podcast-growth-studio",
          tag: "Brand strategy",
          title: ["Podcast", "Growth initiative"],
          description: lorem,
          image: u.work5,
          alt: "Two chairs and microphones in a podcast studio",
          size: "square",
        },
        {
          id: "brand-relaunch",
          tag: "Brand campaign",
          title: ["Brand relaunch", "social first"],
          description: lorem,
          image: u.work6,
          alt: "Two people working at a laptop over coffee",
          size: "tall",
        },
      ],
    },

    "works.self-content": {
      title: "Self content",
      banner: {
        eyebrow: "-Self content",
        lines: [[{ text: "made by" }], [{ text: "me,", accent: true }], [{ text: "for me" }]],
        image: u.selfBanner,
        alt: "Smrithi resting her chin on her hands in warm window light",
        cta: { label: "Professional content", href: "/content/professional-work" },
      },
      cards: [
        {
          id: "morning-ritual",
          tag: "YouTube",
          title: ["Morning ritual", "series"],
          description: lorem,
          image: u.self1,
          alt: "Smrithi in a black blazer looking at the camera",
          size: "tall",
        },
        {
          id: "ootd-style-edits",
          tag: "Instagram / TikTok",
          title: ["OOTD &", "Style edits"],
          description: lorem,
          image: u.self2,
          alt: "Street-style outfit with a baseball cap and iced coffee outside a café",
          size: "square",
        },
        {
          id: "glow-diary",
          tag: "Reels",
          title: ["Glow diary-", "Beauty series"],
          description: lorem,
          image: u.self3,
          alt: "Flat lay of makeup products and hair clips",
          size: "tall",
        },
        {
          id: "podcast-sessions",
          tag: "Podcast",
          title: ["Podcast", "sessions"],
          description: lorem,
          image: u.self4,
          alt: "Studio light against a sheer curtain",
          size: "square",
        },
        {
          id: "coastal-escape",
          tag: "YouTube",
          title: ["Coastal escape", "vlog"],
          description: lorem,
          image: u.self5,
          alt: "Woman with arms outstretched facing green sea cliffs",
          size: "square",
        },
        {
          id: "airport-diaries",
          tag: "YouTube",
          title: ["Airport diaries-", "Travel series"],
          description: lorem,
          image: u.self6,
          alt: "Airport departures board",
          size: "tall",
        },
        {
          id: "behind-the-scenes",
          tag: "Reels",
          title: ["Behind the", "scenes"],
          description: lorem,
          image: u.self7,
          alt: "Behind the scenes on a shoot",
          size: "square",
        },
      ],
    },
  };
}
