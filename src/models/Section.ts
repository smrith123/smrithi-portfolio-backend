import { Schema, model } from "mongoose";
import type { SectionKey } from "../content/schemas.js";

/**
 * Every editable block of the public site is one document here, keyed by
 * section (`home.hero`, `works.self-content`, ...). `data` is validated on the
 * way in by that key's zod schema, so the shape is guaranteed without a
 * separate mongoose model per section.
 *
 * ponytail: whole-section writes, no per-item endpoints. Fine for one admin and
 * arrays of <20 items; split into real collections if editors ever collide.
 */
export interface SectionDoc {
  key: SectionKey;
  data: Record<string, unknown>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<SectionDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true, minimize: false },
);

export const Section = model<SectionDoc>("Section", schema);
