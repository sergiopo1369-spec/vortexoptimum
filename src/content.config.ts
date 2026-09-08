import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Concept visuel de l'image d'illustration (§10). L'image finale est à produire ;
    // en attendant, une couverture dégradée est générée à partir de `cover`.
    imageConcept: z.string(),
    cover: z.enum(["cyan", "amethyst", "emerald", "aurora"]).default("aurora"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
