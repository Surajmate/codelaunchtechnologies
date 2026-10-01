import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * SUPPORT TICKET
 * ======================================================
 *
 * Stores support requests raised by users.
 *
 * Ticket lifecycle:
 *
 * OPEN
 *   ↓
 * IN_PROGRESS
 *   ↓
 * WAITING_FOR_USER
 *   ↓
 * RESOLVED
 *   ↓
 * CLOSED
 *
 * ======================================================
 */

const SupportTicketSchema = new Schema(
  {
    /*
     * --------------------------------------------------
     * TICKET NUMBER
     * --------------------------------------------------
     */

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /*
     * --------------------------------------------------
     * USER
     * --------------------------------------------------
     */

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * --------------------------------------------------
     * SUBJECT
     * --------------------------------------------------
     */

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    /*
     * --------------------------------------------------
     * DESCRIPTION
     * --------------------------------------------------
     */

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    /*
     * --------------------------------------------------
     * CATEGORY
     * --------------------------------------------------
     */

    category: {
      type: String,
      enum: [
        "ACCOUNT",
        "TECHNICAL",
        "COURSE",
        "QUIZ",
        "INTEGRATION",
        "PAYMENT",
        "BUG",
        "FEATURE_REQUEST",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },

    /*
     * --------------------------------------------------
     * PRIORITY
     * --------------------------------------------------
     */

    priority: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ],
      default: "MEDIUM",
      index: true,
    },

    /*
     * --------------------------------------------------
     * STATUS
     * --------------------------------------------------
     */

    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_USER",
        "RESOLVED",
        "CLOSED",
      ],
      default: "OPEN",
      index: true,
    },

    /*
     * --------------------------------------------------
     * ASSIGNED TO
     * --------------------------------------------------
     */

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
     * --------------------------------------------------
     * LAST REPLIED BY
     * --------------------------------------------------
     */

    lastRepliedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * --------------------------------------------------
     * LAST REPLIED AT
     * --------------------------------------------------
     */

    lastRepliedAt: {
      type: Date,
      default: null,
    },

    /*
     * --------------------------------------------------
     * RESOLVED AT
     * --------------------------------------------------
     */

    resolvedAt: {
      type: Date,
      default: null,
    },

    /*
     * --------------------------------------------------
     * CLOSED AT
     * --------------------------------------------------
     */

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    /*
     * Mongoose automatically manages:
     *
     * createdAt
     * updatedAt
     *
     * Therefore we don't need to manually
     * define or update these fields.
     */

    timestamps: true,
  }
);

/*
 * ======================================================
 * INDEXES
 * ======================================================
 */

/*
 * Admin ticket listing
 */

SupportTicketSchema.index({
  createdAt: -1,
});

/*
 * Common filtering
 */

SupportTicketSchema.index({
  status: 1,
  priority: 1,
  createdAt: -1,
});

/*
 * User ticket history
 */

SupportTicketSchema.index({
  user: 1,
  createdAt: -1,
});

/*
 * Assigned ticket queue
 */

SupportTicketSchema.index({
  assignedTo: 1,
  status: 1,
  createdAt: -1,
});

/*
 * ======================================================
 * IMPORTANT
 * ======================================================
 *
 * DO NOT add:
 *
 * SupportTicketSchema.pre("save", function(next) {})
 *
 * because timestamps:true already handles updatedAt.
 *
 * ======================================================
 */

/*
 * ======================================================
 * MODEL
 * ======================================================
 */

const SupportTicket =
  models.SupportTicket ||
  mongoose.model(
    "SupportTicket",
    SupportTicketSchema
  );

export default SupportTicket;