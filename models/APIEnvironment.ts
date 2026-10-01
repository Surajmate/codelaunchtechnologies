import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAPIEnvironment extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;

  variables: Array<{
    key: string;
    value: string;
    enabled: boolean;
    secret: boolean;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const EnvironmentVariableSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: String,
      default: "",
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    secret: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const APIEnvironmentSchema = new Schema<IAPIEnvironment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    variables: {
      type: [EnvironmentVariableSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const APIEnvironment: Model<IAPIEnvironment> =
  mongoose.models.APIEnvironment ||
  mongoose.model<IAPIEnvironment>(
    "APIEnvironment",
    APIEnvironmentSchema
  );

export default APIEnvironment;