import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * SUPPORT MESSAGE
 * ======================================================
 *
 * Stores individual messages exchanged
 * between the customer and support team.
 *
 * One ticket can contain many messages.
 *
 * ======================================================
 */

const SupportMessageSchema =
  new Schema(
    {
      /*
       * --------------------------------------------------
       * TICKET
       * --------------------------------------------------
       */

      ticket: {
        type: Schema.Types.ObjectId,
        ref: "SupportTicket",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * SENDER
       * --------------------------------------------------
       *
       * User or admin who sent the message.
       *
       * --------------------------------------------------
       */

      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * SENDER TYPE
       * --------------------------------------------------
       */

      senderType: {
        type: String,
        enum: [
          "USER",
          "ADMIN",
          "SYSTEM",
        ],
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * MESSAGE
       * --------------------------------------------------
       */

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000,
      },

      /*
       * --------------------------------------------------
       * ATTACHMENTS
       * --------------------------------------------------
       *
       * We store metadata here.
       *
       * Actual files can later be stored in:
       *
       * - S3
       * - Cloudinary
       * - Azure Blob
       * - local/object storage
       *
       * --------------------------------------------------
       */

      attachments: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
          },

          url: {
            type: String,
            required: true,
            trim: true,
          },

          type: {
            type: String,
            default: "",
            trim: true,
          },

          size: {
            type: Number,
            default: 0,
          },
        },
      ],

      /*
       * --------------------------------------------------
       * INTERNAL NOTE
       * --------------------------------------------------
       *
       * Internal notes are visible only to admins.
       *
       * Normal user messages:
       *
       * internalNote = false
       *
       * Admin-only notes:
       *
       * internalNote = true
       *
       * --------------------------------------------------
       */

      internalNote: {
        type: Boolean,
        default: false,
        index: true,
      },

      /*
       * --------------------------------------------------
       * READ STATUS
       * --------------------------------------------------
       */

      readByUser: {
        type: Boolean,
        default: false,
      },

      readByAdmin: {
        type: Boolean,
        default: false,
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
 * Main conversation query:
 *
 * ticket + oldest/newest messages
 *
 * ======================================================
 */

SupportMessageSchema.index({
  ticket: 1,
  createdAt: 1,
});

/*
 * Admin unread messages.
 */

SupportMessageSchema.index({
  ticket: 1,
  readByAdmin: 1,
  createdAt: -1,
});

/*
 * User unread messages.
 */

SupportMessageSchema.index({
  ticket: 1,
  readByUser: 1,
  createdAt: -1,
});

/*
 * ======================================================
 * MODEL
 * ======================================================
 */

const SupportMessage =
  models.SupportMessage ||
  mongoose.model(
    "SupportMessage",
    SupportMessageSchema
  );

export default SupportMessage;