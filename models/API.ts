import mongoose, { Schema, models } from "mongoose";

const APIParameterSchema = new Schema(
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

    description: {
      type: String,
      default: "",
    },

    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const APIHeaderSchema = new Schema(
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

    description: {
      type: String,
      default: "",
    },

    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const APIAuthSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "NONE",
        "BEARER",
        "BASIC",
        "API_KEY",
        "OAUTH2",
      ],
      default: "NONE",
    },

    token: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      default: "",
    },

    apiKey: {
      type: String,
      default: "",
    },

    apiKeyValue: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const APISchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    method: {
      type: String,
      enum: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
      ],
      default: "GET",
    },

    endpoint: {
      type: String,
      required: true,
      trim: true,
    },

    baseUrl: {
      type: String,
      default: "",
      trim: true,
    },

    version: {
      type: String,
      default: "v1",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "ACTIVE",
        "DEPRECATED",
        "ARCHIVED",
      ],
      default: "DRAFT",
    },

    parameters: {
      type: [APIParameterSchema],
      default: [],
    },

    headers: {
      type: [APIHeaderSchema],
      default: [],
    },

    auth: {
      type: APIAuthSchema,
      default: () => ({
        type: "NONE",
      }),
    },

    requestBody: {
      type: String,
      default: "",
    },

    responseExample: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    documentation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default models.API ||
  mongoose.model("API", APISchema);