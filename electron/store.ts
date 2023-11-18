import { z } from "zod";

export const appStoreSchema = z.object({
  folders: z.string().array().default([]),
  metadata: z.record(z.number()).default({}),
});

export type AppStore = z.infer<typeof appStoreSchema>;
