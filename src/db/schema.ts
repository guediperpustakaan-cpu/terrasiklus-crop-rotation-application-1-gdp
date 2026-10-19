import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * TerraSiklus — skema basis data (kompatibel Neon PostgreSQL).
 * Semua kolom `date` disimpan sebagai string ISO (YYYY-MM-DD),
 * kolom `numeric` dibaca sebagai string lalu diubah ke number di lapisan query.
 */

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  fullName: varchar("full_name", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const farms = pgTable("farms", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  location: varchar("location", { length: 180 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plots = pgTable("plots", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  area: numeric("area", { precision: 10, scale: 2 }).notNull().default("0"),
  soilType: varchar("soil_type", { length: 60 }).notNull().default("lempung"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plantFamilies = pgTable("plant_families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 140 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("light"),
  color: varchar("color", { length: 16 }).notNull().default("#3F8F4F"),
  description: text("description"),
  rotationOrder: integer("rotation_order").notNull().default(0),
});

export const crops = pgTable("crops", {
  id: uuid("id").primaryKey().defaultRandom(),
  commonName: varchar("common_name", { length: 140 }).notNull().unique(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => plantFamilies.id, { onDelete: "cascade" }),
  nutrientDemand: varchar("nutrient_demand", { length: 12 }).notNull().default("medium"),
  harvestDays: integer("harvest_days").notNull().default(70),
  description: text("description"),
});

export const plantings = pgTable("plantings", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotId: uuid("plot_id")
    .notNull()
    .references(() => plots.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id")
    .notNull()
    .references(() => crops.id, { onDelete: "restrict" }),
  plantedOn: date("planted_on").notNull(),
  harvestedOn: date("harvested_on"),
  pestReported: boolean("pest_reported").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const soilTests = pgTable("soil_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotId: uuid("plot_id")
    .notNull()
    .references(() => plots.id, { onDelete: "cascade" }),
  testedOn: date("tested_on").notNull(),
  ph: numeric("ph", { precision: 5, scale: 2 }).notNull(),
  n: numeric("n", { precision: 8, scale: 2 }).notNull().default("0"),
  p: numeric("p", { precision: 8, scale: 2 }).notNull().default("0"),
  k: numeric("k", { precision: 8, scale: 2 }).notNull().default("0"),
  organicMatter: numeric("organic_matter", { precision: 6, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileRow = typeof profiles.$inferSelect;
export type FarmRow = typeof farms.$inferSelect;
export type PlotRow = typeof plots.$inferSelect;
export type PlantFamilyRow = typeof plantFamilies.$inferSelect;
export type CropRow = typeof crops.$inferSelect;
export type PlantingRow = typeof plantings.$inferSelect;
export type SoilTestRow = typeof soilTests.$inferSelect;
