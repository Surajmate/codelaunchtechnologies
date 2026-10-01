import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * INTEGRATION LOG
 * ======================================================
 *
 * Stores every important integration activity.
 *
 * IMPORTANT:
 *
 * We NEVER store:
 *
 * - client_secret
 * - passwords
 * - bearer tokens
 * - Authorization headers
 * - decrypted credentials
 *
 * ======================================================
 */

const IntegrationLogSchema =
  new Schema(
    {
      /*
       * --------------------------------------------------
       * INTEGRATION
       * --------------------------------------------------
       */

      integration: {
        type: Schema.Types.ObjectId,
        ref: "Integration",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * ACTION
       * --------------------------------------------------
       *
       * TEST
       * ENABLE
       * DISABLE
       * CREATE
       * UPDATE
       * DELETE
       *
       * --------------------------------------------------
       */

      action: {
        type: String,
        enum: [
          "TEST",
          "ENABLE",
          "DISABLE",
          "CREATE",
          "UPDATE",
          "DELETE",
        ],
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * RESULT
       * --------------------------------------------------
       *
       * SUCCESS
       * ERROR
       *
       * --------------------------------------------------
       */

      result: {
        type: String,
        enum: [
          "SUCCESS",
          "ERROR",
        ],
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * HTTP METHOD
       * --------------------------------------------------
       */

      method: {
        type: String,
        default: "",
      },

      /*
       * --------------------------------------------------
       * HTTP STATUS
       * --------------------------------------------------
       */

      statusCode: {
        type: Number,
        default: null,
      },

      /*
       * --------------------------------------------------
       * RESPONSE TIME
       * --------------------------------------------------
       */

      responseTime: {
        type: Number,
        default: null,
      },

      /*
       * --------------------------------------------------
       * MESSAGE
       * --------------------------------------------------
       */

      message: {
        type: String,
        default: "",
      },

      /*
       * --------------------------------------------------
       * RESPONSE PREVIEW
       * --------------------------------------------------
       *
       * Limited response information.
       *
       * Never store secrets.
       *
       * --------------------------------------------------
       */

      responsePreview: {
        type: String,
        default: "",
        maxlength: 2000,
      },

      /*
       * --------------------------------------------------
       * ERROR
       * --------------------------------------------------
       */

      error: {
        type: String,
        default: "",
        maxlength: 2000,
      },

      /*
       * --------------------------------------------------
       * ADMIN USER
       * --------------------------------------------------
       */

      performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * CREATED AT
       * --------------------------------------------------
       */

      createdAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: false,
    }
  );

/*
 * ======================================================
 * INDEXES
 * ======================================================
 *
 * Most common query:
 *
 * integration + newest logs
 *
 * ======================================================
 */

IntegrationLogSchema.index({
  integration: 1,
  createdAt: -1,
});

/*
 * ======================================================
 * MODEL
 * ======================================================
 */

const IntegrationLog =
  models.IntegrationLog ||
  mongoose.model(
    "IntegrationLog",
    IntegrationLogSchema
  );

export default IntegrationLog;