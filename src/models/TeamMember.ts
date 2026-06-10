import mongoose, { Schema, model, models } from "mongoose";

export interface ITeamMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: string;
  description: string;
  image: string;
  sortOrder: number;
  status: "active" | "inactive";
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const TeamMember =
  models.TeamMember ?? model<ITeamMember>("TeamMember", TeamMemberSchema);
