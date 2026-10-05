import { z } from "zod";
import { PROPERTY_TYPES, FURNISHING_OPTIONS, OWNERSHIP_OPTIONS, USAGE_OPTIONS } from "@/lib/propertyMeta";

export const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const propertyBaseSchema = z.object({
  title: z.string().min(2),
  location: z.string().min(2),
  price: z.coerce.number().int().positive(),
  listingType: z.enum(["sale", "rent"]),
  status: z.enum(["ready", "offplan"]),
  rentalPeriod: z.enum(["yearly", "monthly", "weekly", "daily"]).optional().nullable(),
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().int().min(0),
  sqft: z.coerce.number().int().positive(),
  description: z.string(),
  handoverNote: z.string().optional().nullable(),
  propertyType: z.enum(PROPERTY_TYPES),
  furnishing: z.enum(FURNISHING_OPTIONS),
  ownership: z.enum(OWNERSHIP_OPTIONS),
  usage: z.enum(USAGE_OPTIONS),
  hasParking: z.boolean(),
  hasBalcony: z.boolean(),
  plotArea: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  completionPercent: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(100).optional()),
  expectedRentYearly: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  image1: z.string().optional().nullable(),
  image2: z.string().optional().nullable(),
  image3: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
});

export const propertyCreateSchema = propertyBaseSchema.refine(
  (data) => data.listingType !== "rent" || !!data.rentalPeriod,
  { message: "Choose a rental period for a rent listing", path: ["rentalPeriod"] },
);

export const propertyUpdateSchema = propertyBaseSchema.partial();
