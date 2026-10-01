import mongoose, { Schema, models } from "mongoose";

const APIRequestSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    method: {
      type: String,
      enum: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
      ],
      default: "GET",
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    collection: {
      type: Schema.Types.ObjectId,
      ref: "APICollection",
      required: true,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    queryParams: {
      type: [
        {
          key: {
            type: String,
            default: "",
          },
          value: {
            type: String,
            default: "",
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },

    headers: {
      type: [
        {
          key: {
            type: String,
            default: "",
          },
          value: {
            type: String,
            default: "",
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },

    authorization: {
      type: {
        type: String,
        enum: [
          "NONE",
          "BEARER",
          "BASIC",
          "API_KEY",
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

      key: {
        type: String,
        default: "",
      },

      value: {
        type: String,
        default: "",
      },

      addTo: {
        type: String,
        enum: ["HEADER", "QUERY"],
        default: "HEADER",
      },
    },

    bodyType: {
      type: String,
      enum: [
        "none",
        "json",
        "text",
        "form-data",
        "x-www-form-urlencoded",
      ],
      default: "none",
    },

    body: {
      type: String,
      default: "",
    },

    preRequestScript: {
      type: String,
      default: "",
    },

    testScript: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default models.APIRequest ||
  mongoose.model(
    "APIRequest",
    APIRequestSchema
  );