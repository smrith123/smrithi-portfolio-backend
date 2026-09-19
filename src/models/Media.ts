import { Schema, model } from "mongoose";

export type MediaKind = "image" | "video" | "document";

export interface MediaDoc {
  url: string;
  /** Storage key, relative to the upload root. */
  key: string;
  kind: MediaKind;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  folder: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<MediaDoc>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["image", "video", "document"], required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    alt: String,
    folder: { type: String, default: "media", index: true },
  },
  { timestamps: true },
);

export const Media = model<MediaDoc>("Media", schema);
