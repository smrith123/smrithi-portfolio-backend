import { z } from "zod";

/**
 * The contract between the admin panel, the database and the public API.
 * These mirror `smrithi-portfolio-frontend/src/types/content.ts` exactly, with
 * one difference: an image is an absolute URL string instead of a static import.
 *
 * Adding an editable field = adding it here, then to the admin form. Nothing else.
 */

const url = z.string().trim().min(1, "Required");
const text = z.string().trim();
const id = z.string().trim().min(1);

const cta = z.object({ label: text.min(1), href: text.min(1) });

/** A heading line is a run of text parts; `accent` paints a part pink. */
const headingPart = z.object({
  text: z.string(),
  accent: z.union([z.boolean(), z.literal("mobile")]).optional(),
});
const headingLines = z
  .array(z.array(headingPart).min(1))
  .min(1, "Add at least one line of heading text")
  // Blank rows are allowed as spacing, but a heading of only blank rows renders nothing.
  .refine((lines) => lines.some((line) => line.some((part) => part.text.trim())), "The heading can't be empty");

const sectionHeading = z.object({ eyebrow: text, lines: headingLines });

/* ---------------------------------- site ---------------------------------- */

const nav = z.object({
  items: z.array(z.object({ label: text.min(1), href: text.min(1) })).min(1),
});

/* ---------------------------------- home ---------------------------------- */

const hero = z.object({
  titleTop: text.min(1),
  titleMid: text.min(1),
  titleBottom: text.min(1),
  subtitle: text,
  primaryCta: cta,
  secondaryCta: cta,
  portrait: url,
  texture: url,
});

const about = z.object({ eyebrow: text, statement: text.min(1) });

const contentPortfolio = sectionHeading.extend({
  pieces: z
    .array(
      z.object({
        id,
        number: text,
        label: text,
        image: url,
        href: text.optional(),
      }),
    )
    .min(1),
});

/** Each platform photo carries its own post link, so the grid can deep-link. */
const platformImage = z.object({ url, link: text.optional(), alt: text.optional() });

/** The frontend grid is 3 x 2; a seventh photo would start a half-empty row. */
export const MAX_PLATFORM_IMAGES = 6;

/**
 * Each platform has its own small label and heading; the site shows the active
 * tab's pair above the tabs, so there is no section-level heading here.
 */
const platforms = z.object({
  items: z
    .array(
      sectionHeading.extend({
        id: z.enum(["instagram", "tiktok", "youtube"]),
        name: text.min(1),
        followers: text,
        handle: text,
        description: text,
        profileUrl: text,
        followLabel: text.min(1),
        collabUrl: text,
        collabLabel: text.min(1),
        images: z
          .array(platformImage)
          .max(MAX_PLATFORM_IMAGES, `A platform can show at most ${MAX_PLATFORM_IMAGES} photos. Remove one before adding another.`),
      }),
    )
    .min(1),
});

const journey = sectionHeading.extend({
  steps: z.array(z.object({ id, category: text, title: text.min(1), description: text })).min(1),
});

const projects = sectionHeading.extend({
  items: z
    .array(
      z.object({
        id,
        title: text.min(1),
        description: text,
        image: url,
        /** Per-card background from the design. */
        tint: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb colour"),
        href: text.optional(),
      }),
    )
    .min(1),
});

const brands = sectionHeading.extend({
  items: z
    .array(
      z.object({
        id,
        name: text.min(1),
        logo: url,
        width: z.number().positive(),
        height: z.number().positive(),
      }),
    )
    .min(1),
});

const media = sectionHeading.extend({
  items: z
    .array(
      z.object({
        id,
        title: text.min(1),
        poster: url,
        videoSrc: text.optional(),
      }),
    )
    .min(1),
});

const career = z.object({
  portrait: url,
  cards: z.array(z.object({ id, lines: headingLines, meta: text })).min(1),
  panel: z.object({
    lines: headingLines,
    description: text,
    /** href is the uploaded CV's URL. */
    downloadCta: cta,
    contactCta: cta,
  }),
});

const contact = sectionHeading.extend({
  description: text,
  instagram: z.object({ handle: text, url: text }),
  email: z.email("Enter a valid email"),
  background: url,
  form: z.object({
    nameLabel: text,
    namePlaceholder: text,
    emailLabel: text,
    emailPlaceholder: text,
    messageLabel: text,
    messagePlaceholder: text,
    submitLabel: text,
  }),
});

/* --------------------------------- /content -------------------------------- */

const contentPage = z.object({
  title: text.min(1),
  panels: z
    .array(z.object({ id, lines: headingLines, image: url, alt: text, href: text.min(1) }))
    .length(2, "The split page has exactly two panels"),
});

const workPage = z.object({
  title: text.min(1),
  banner: sectionHeading.extend({ image: url, alt: text, cta }),
  cards: z.array(
    z.object({
      id,
      tag: text,
      /** Explicit lines so the title breaks where the design breaks it. */
      title: z.array(z.string()).min(1),
      description: text.optional(),
      image: url,
      alt: text,
      size: z.enum(["tall", "square"]),
      /** Link to the social post / case study. */
      href: text.optional(),
    }),
  ),
});

/* -------------------------------- registry -------------------------------- */

export const sectionSchemas = {
  "site.nav": nav,
  "home.hero": hero,
  "home.about": about,
  "home.contentPortfolio": contentPortfolio,
  "home.platforms": platforms,
  "home.journey": journey,
  "home.projects": projects,
  "home.brands": brands,
  "home.media": media,
  "home.career": career,
  "home.contact": contact,
  "page.content": contentPage,
  "works.professional-work": workPage,
  "works.self-content": workPage,
} as const;

export type SectionKey = keyof typeof sectionSchemas;

export const sectionKeys = Object.keys(sectionSchemas) as SectionKey[];

export const isSectionKey = (value: string): value is SectionKey => value in sectionSchemas;

/** Section keys that make up the home page payload, in render order. */
export const homeSectionKeys = [
  "home.hero",
  "home.about",
  "home.contentPortfolio",
  "home.platforms",
  "home.journey",
  "home.projects",
  "home.brands",
  "home.media",
  "home.career",
  "home.contact",
] as const;

export type SectionData<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>;
