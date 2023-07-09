import { z } from "zod";

export const appStoreSchema = z.object({
  folders: z.string().array().default([]),
});

export type AppStore = z.infer<typeof appStoreSchema>;
