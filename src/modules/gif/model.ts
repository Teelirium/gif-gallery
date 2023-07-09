import { z } from "zod";

export const gifSchema = z.object({
  path: z.string().min(1, "Path is required"),
  url: z.string().url("Not a valid URL").optional(),
});

export type Gif = z.infer<typeof gifSchema>;
