import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IRoadmap
  extends Document {
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  technologies: string[];
  icon?: string;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema =
  new Schema<IRoadmap>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      level: {
        type: String,
        required: true,
        trim: true,
      },

      duration: {
        type: String,
        required: true,
        trim: true,
      },

      technologies: {
        type: [String],
        default: [],
      },

      icon: {
        type: String,
        default: "Layers3",
      },

      featured: {
        type: Boolean,
        default: false,
      },

      published: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

const Roadmap: Model<IRoadmap> =
  mongoose.models.Roadmap ||
  mongoose.model<IRoadmap>(
    "Roadmap",
    RoadmapSchema
  );

export default Roadmap;