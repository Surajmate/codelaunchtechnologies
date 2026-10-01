import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

export type UserCertificateStatus =
  | "PENDING"
  | "ISSUED"
  | "REVOKED"
  | "EXPIRED";

/*
 * ============================================================
 * INTERFACE
 * ============================================================
 */

export interface IUserCertificate
  extends Document {
  user: mongoose.Types.ObjectId;

  certificate: mongoose.Types.ObjectId;

  course: mongoose.Types.ObjectId;

  certificateNumber: string;

  verificationCode: string;

  status: UserCertificateStatus;

  issuedAt?: Date;

  expiresAt?: Date | null;

  revokedAt?: Date | null;

  revokedReason?: string;

  finalScore?: number;

  completionPercentage: number;

  pdfUrl?: string;

  metadata?: {
    userName?: string;
    userEmail?: string;
    courseTitle?: string;
    certificateTitle?: string;
    issuerName?: string;
  };

  createdAt: Date;

  updatedAt: Date;
}

/*
 * ============================================================
 * SCHEMA
 * ============================================================
 */

const UserCertificateSchema =
  new Schema<IUserCertificate>(
    {
      /*
       * ------------------------------------------------------
       * USER
       * ------------------------------------------------------
       */

      user: {
        type: Schema.Types.ObjectId,

        ref: "User",

        required: [
          true,
          "User is required",
        ],

        index: true,
      },

      /*
       * ------------------------------------------------------
       * CERTIFICATE DEFINITION
       * ------------------------------------------------------
       */

      certificate: {
        type: Schema.Types.ObjectId,

        ref: "Certificate",

        required: [
          true,
          "Certificate definition is required",
        ],

        index: true,
      },

      /*
       * ------------------------------------------------------
       * COURSE
       * ------------------------------------------------------
       *
       * Stored separately because the certificate belongs
       * to a specific course.
       *
       * ------------------------------------------------------
       */

      course: {
        type: Schema.Types.ObjectId,

        ref: "Course",

        required: [
          true,
          "Course is required",
        ],

        index: true,
      },

      /*
       * ------------------------------------------------------
       * CERTIFICATE NUMBER
       * ------------------------------------------------------
       *
       * Example:
       *
       * CLT-2026-000001
       *
       * This is the public certificate identifier.
       *
       * ------------------------------------------------------
       */

      certificateNumber: {
        type: String,

        required: [
          true,
          "Certificate number is required",
        ],

        unique: true,

        trim: true,

        uppercase: true,

        minlength: [
          5,
          "Invalid certificate number",
        ],

        maxlength: [
          100,
          "Certificate number cannot exceed 100 characters",
        ],

        index: true,
      },

      /*
       * ------------------------------------------------------
       * VERIFICATION CODE
       * ------------------------------------------------------
       *
       * Used for public verification.
       *
       * Example:
       *
       * 7F9A2C8D...
       *
       * This should be generated server-side.
       *
       * ------------------------------------------------------
       */

      verificationCode: {
        type: String,

        required: [
          true,
          "Verification code is required",
        ],

        unique: true,

        trim: true,

        index: true,

        minlength: [
          16,
          "Verification code is invalid",
        ],

        maxlength: [
          200,
          "Verification code cannot exceed 200 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * STATUS
       * ------------------------------------------------------
       */

      status: {
        type: String,

        enum: {
          values: [
            "PENDING",
            "ISSUED",
            "REVOKED",
            "EXPIRED",
          ],

          message:
            "Invalid certificate status",
        },

        required: true,

        default: "PENDING",

        index: true,
      },

      /*
       * ------------------------------------------------------
       * ISSUE DATE
       * ------------------------------------------------------
       */

      issuedAt: {
        type: Date,

        default: null,

        index: true,
      },

      /*
       * ------------------------------------------------------
       * EXPIRY DATE
       * ------------------------------------------------------
       */

      expiresAt: {
        type: Date,

        default: null,

        index: true,
      },

      /*
       * ------------------------------------------------------
       * REVOCATION DATE
       * ------------------------------------------------------
       */

      revokedAt: {
        type: Date,

        default: null,
      },

      /*
       * ------------------------------------------------------
       * REVOCATION REASON
       * ------------------------------------------------------
       */

      revokedReason: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          1000,
          "Revocation reason cannot exceed 1000 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * FINAL SCORE
       * ------------------------------------------------------
       *
       * Optional because not every course necessarily has
       * an assessment.
       *
       * ------------------------------------------------------
       */

      finalScore: {
        type: Number,

        min: [
          0,
          "Final score cannot be less than 0",
        ],

        max: [
          100,
          "Final score cannot exceed 100",
        ],

        default: null,
      },

      /*
       * ------------------------------------------------------
       * COMPLETION PERCENTAGE
       * ------------------------------------------------------
       */

      completionPercentage: {
        type: Number,

        required: true,

        min: [
          0,
          "Completion percentage cannot be less than 0",
        ],

        max: [
          100,
          "Completion percentage cannot exceed 100",
        ],

        default: 0,
      },

      /*
       * ------------------------------------------------------
       * PDF URL
       * ------------------------------------------------------
       *
       * This can be populated after PDF generation.
       *
       * ------------------------------------------------------
       */

      pdfUrl: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          2000,
          "PDF URL cannot exceed 2000 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * METADATA
       * ------------------------------------------------------
       *
       * Snapshot information.
       *
       * This is useful because the user's name/course title
       * could change later, while an issued certificate should
       * retain the information that existed when it was issued.
       *
       * ------------------------------------------------------
       */

      metadata: {
        userName: {
          type: String,

          trim: true,

          default: "",
        },

        userEmail: {
          type: String,

          trim: true,

          lowercase: true,

          default: "",
        },

        courseTitle: {
          type: String,

          trim: true,

          default: "",
        },

        certificateTitle: {
          type: String,

          trim: true,

          default: "",
        },

        issuerName: {
          type: String,

          trim: true,

          default: "",
        },
      },
    },

    /*
     * ========================================================
     * OPTIONS
     * ========================================================
     */

    {
      timestamps: true,

      versionKey: false,
    }
  );

/*
 * ============================================================
 * VALIDATION / NORMALIZATION
 * ============================================================
 *
 * IMPORTANT:
 * Do not use `next` here.
 *
 * This prevents the:
 *
 * "next is not a function"
 *
 * issue encountered earlier with Mongoose middleware.
 *
 * ============================================================
 */

UserCertificateSchema.pre(
  "validate",
  function () {
    /*
     * --------------------------------------------------------
     * ISSUED STATUS
     * --------------------------------------------------------
     */

    if (
      this.status === "ISSUED"
    ) {
      /*
       * An issued certificate must have an issue date.
       */

      if (!this.issuedAt) {
        this.issuedAt =
          new Date();
      }

      /*
       * Issued certificates should have completed
       * the required course.
       */

      if (
        this.completionPercentage <
        100
      ) {
        this.invalidate(
          "completionPercentage",
          "An issued certificate requires 100% course completion"
        );
      }
    }

    /*
     * --------------------------------------------------------
     * REVOKED STATUS
     * --------------------------------------------------------
     */

    if (
      this.status === "REVOKED"
    ) {
      /*
       * Automatically set revoked date if not provided.
       */

      if (!this.revokedAt) {
        this.revokedAt =
          new Date();
      }

      /*
       * Require a reason.
       */

      if (
        !this.revokedReason ||
        !this.revokedReason.trim()
      ) {
        this.invalidate(
          "revokedReason",
          "Revocation reason is required"
        );
      }
    }

    /*
     * --------------------------------------------------------
     * NON-REVOKED CERTIFICATE
     * --------------------------------------------------------
     */

    if (
      this.status !== "REVOKED"
    ) {
      this.revokedAt =
        undefined;

      this.revokedReason =
        undefined;
    }

    /*
     * --------------------------------------------------------
     * EXPIRY VALIDATION
     * --------------------------------------------------------
     */

    if (
      this.expiresAt &&
      this.issuedAt &&
      this.expiresAt <=
        this.issuedAt
    ) {
      this.invalidate(
        "expiresAt",
        "Expiry date must be after issue date"
      );
    }

    /*
     * --------------------------------------------------------
     * PENDING CERTIFICATE
     * --------------------------------------------------------
     *
     * Pending certificates don't need an issue date.
     *
     * --------------------------------------------------------
     */

    if (
      this.status === "PENDING"
    ) {
      this.issuedAt =
        undefined;

      this.revokedAt =
        undefined;

      this.revokedReason =
        undefined;
    }
  }
);

/*
 * ============================================================
 * INDEXES
 * ============================================================
 */

/*
 * User certificate listing.
 */

UserCertificateSchema.index({
  user: 1,
  createdAt: -1,
});

/*
 * User + status.
 */

UserCertificateSchema.index({
  user: 1,
  status: 1,
});

/*
 * Course certificates.
 */

UserCertificateSchema.index({
  course: 1,
  createdAt: -1,
});

/*
 * Admin filtering.
 */

UserCertificateSchema.index({
  status: 1,
  createdAt: -1,
});

/*
 * Prevent the same certificate definition from being
 * issued to the same user more than once.
 *
 * NOTE:
 * This is intentionally based on `certificate`, not course,
 * because a course can potentially have different certificate
 * definitions.
 */

UserCertificateSchema.index(
  {
    user: 1,
    certificate: 1,
  },
  {
    unique: true,
  }
);

/*
 * ============================================================
 * MODEL
 * ============================================================
 *
 * Prevent model recompilation during:
 *
 * - Next.js hot reload
 * - Turbopack
 * - Serverless execution
 *
 * ============================================================
 */

const UserCertificate: Model<IUserCertificate> =
  mongoose.models.UserCertificate ||
  mongoose.model<IUserCertificate>(
    "UserCertificate",
    UserCertificateSchema
  );

export default UserCertificate;