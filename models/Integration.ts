import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ------------------------------------------------------
 * INTEGRATION SCHEMA
 * ------------------------------------------------------
 */

const IntegrationSchema =
  new Schema(
    {
      /*
       * Integration display name
       *
       * Example:
       * "Bajaj DMS API"
       */
      name: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * Provider / system name
       *
       * Example:
       * "Bajaj Auto"
       * "SAP"
       * "Qualtrics"
       * "Nected"
       */
      provider: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * Integration category
       */
      category: {
        type: String,

        enum: [
          "API",
          "DATABASE",
          "CRM",
          "ERP",
          "MARKETING",
          "COMMUNICATION",
          "CLOUD",
          "OTHER",
        ],

        default: "API",
      },

      /*
       * Base API / service URL
       */
      baseUrl: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * Human-readable description
       */
      description: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * Current integration status
       */
      status: {
        type: String,

        enum: [
          "ACTIVE",
          "INACTIVE",
          "ERROR",
        ],

        default: "INACTIVE",
      },

      /*
       * Non-sensitive configuration.
       *
       * Example:
       *
       * {
       *   method: "POST",
       *   timeout: 5000,
       *   headers: {
       *     client_id: "..."
       *   }
       * }
       */
      config: {
        type: Schema.Types.Mixed,
        default: {},
      },

      /*
       * Encrypted secret.
       *
       * IMPORTANT:
       * Never expose this field directly
       * through an API response.
       *
       * The value will be encrypted using
       * lib/integrationCrypto.ts
       */
      secret: {
        type: String,
        default: "",
      },

      /*
       * Last connectivity check
       */
      lastCheckedAt: {
        type: Date,
        default: null,
      },

      /*
       * Last error returned by connectivity test
       */
      lastError: {
        type: String,
        default: "",
      },

      /*
       * Administrator who created
       * the integration
       */
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /*
       * Administrator who last updated
       * the integration
       */
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

/*
 * ------------------------------------------------------
 * MODEL
 * ------------------------------------------------------
 *
 * Prevent model recompilation during Next.js
 * development / hot reload.
 */

const Integration =
  models.Integration ||
  mongoose.model(
    "Integration",
    IntegrationSchema
  );

export default Integration;