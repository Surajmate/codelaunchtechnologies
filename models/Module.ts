import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IModule
  extends Document {
  roadmap: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema =
  new Schema<IModule>(
    {
      roadmap: {
        type: Schema.Types.ObjectId,
        ref: "Roadmap",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
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

/*
 * A roadmap should not have two modules
 * with the same slug.
 */
ModuleSchema.index(
  {
    roadmap: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

/*
 * Keep modules ordered within a roadmap.
 */
ModuleSchema.index({
  roadmap: 1,
  order: 1,
});

const Module: Model<IModule> =
  mongoose.models.Module ||
  mongoose.model<IModule>(
    "Module",
    ModuleSchema
  );

export default Module;