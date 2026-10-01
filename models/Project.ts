import mongoose, { Schema, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    type: {
      type: String,
      enum: [
        "WEB",
        "MOBILE",
        "API",
        "INTEGRATION",
        "AI",
        "OTHER",
      ],
      default: "WEB",
    },

    status: {
      type: String,
      enum: [
        "PLANNING",
        "DEVELOPMENT",
        "PRODUCTION",
        "COMPLETED",
        "ARCHIVED",
      ],
      default: "PLANNING",
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    technologies: {
      type: [String],
      default: [],
    },

    repositoryUrl: {
      type: String,
      default: "",
    },

    liveUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Project ||
  mongoose.model("Project", ProjectSchema);