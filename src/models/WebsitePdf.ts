import mongoose, { Schema, model, models } from "mongoose";

export interface IWebsitePdf {
  _id: mongoose.Types.ObjectId;
  title: string;
  pdf: string;
  pdfFileName: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const WebsitePdfSchema = new Schema<IWebsitePdf>(
  {
    title: { type: String, required: true, trim: true },
    pdf: { type: String, required: true },
    pdfFileName: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const WebsitePdf = models.WebsitePdf || model<IWebsitePdf>("WebsitePdf", WebsitePdfSchema);
