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

export type CertificateStatus =
  | "ACTIVE"
  | "INACTIVE";

export type CertificateValidity =
  | "PERMANENT"
  | "LIMITED";

/*
 * ============================================================
 * INTERFACE
 * ============================================================
 */

export interface ICertificate
  extends Document {
  title: string;

  description?: string;

  course: mongoose.Types.ObjectId;

  issuer: string;

  issuerName?: string;

  issuerLogo?: string;

  template?: string;

  validity: CertificateValidity;

  validityDays?: number;

  status: CertificateStatus;

  isActive: boolean;

  requirements?: {
    completionPercentage?: number;

    minimumScore?: number;

    requireFinalAssessment?: boolean;
  };

  createdAt: Date;

  updatedAt: Date;
}

/*
 * ============================================================
 * SCHEMA
 * ============================================================
 */

const CertificateSchema =
  new Schema<ICertificate>(
    {
      /*
       * ------------------------------------------------------
       * TITLE
       * ------------------------------------------------------
       */

      title: {
        type: String,

        required: [
          true,
          "Certificate title is required",
        ],

        trim: true,

        minlength: [
          3,
          "Certificate title must be at least 3 characters",
        ],

        maxlength: [
          200,
          "Certificate title cannot exceed 200 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * DESCRIPTION
       * ------------------------------------------------------
       */

      description: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          2000,
          "Certificate description cannot exceed 2000 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * COURSE
       * ------------------------------------------------------
       *
       * Certificate definition belongs to a course.
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
       * ISSUER
       * ------------------------------------------------------
       */

      issuer: {
        type: String,

        required: [
          true,
          "Certificate issuer is required",
        ],

        trim: true,

        minlength: [
          2,
          "Issuer name must be at least 2 characters",
        ],

        maxlength: [
          200,
          "Issuer name cannot exceed 200 characters",
        ],

        default:
          "Codelaunch Technologies",
      },

      /*
       * ------------------------------------------------------
       * ISSUER NAME
       * ------------------------------------------------------
       *
       * Kept separately so the certificate renderer can use
       * a display name without changing the main issuer field.
       *
       * ------------------------------------------------------
       */

      issuerName: {
        type: String,

        trim: true,

        default:
          "Codelaunch Technologies",

        maxlength: [
          200,
          "Issuer name cannot exceed 200 characters",
        ],
      },

      /*
       * ------------------------------------------------------
       * ISSUER LOGO
       * ------------------------------------------------------
       */

      issuerLogo: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          1000,
          "Issuer logo URL is too long",
        ],
      },

      /*
       * ------------------------------------------------------
       * TEMPLATE
       * ------------------------------------------------------
       *
       * This allows us to support multiple certificate
       * designs later.
       *
       * ------------------------------------------------------
       */

      template: {
        type: String,

        trim: true,

        default: "classic",

        enum: {
          values: [
            "classic",
            "modern",
            "minimal",
            "corporate",
          ],

          message:
            "Invalid certificate template",
        },
      },

      /*
       * ------------------------------------------------------
       * VALIDITY
       * ------------------------------------------------------
       */

      validity: {
        type: String,

        enum: {
          values: [
            "PERMANENT",
            "LIMITED",
          ],

          message:
            "Invalid certificate validity",
        },

        required: true,

        default:
          "PERMANENT",
      },

      /*
       * ------------------------------------------------------
       * VALIDITY DAYS
       * ------------------------------------------------------
       *
       * Required when validity is LIMITED.
       *
       * ------------------------------------------------------
       */

      validityDays: {
        type: Number,

        min: [
          1,
          "Validity must be at least 1 day",
        ],

        max: [
          3650,
          "Validity cannot exceed 3650 days",
        ],

        default: null,
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
            "ACTIVE",
            "INACTIVE",
          ],

          message:
            "Invalid certificate status",
        },

        default: "ACTIVE",

        required: true,

        index: true,
      },

      /*
       * ------------------------------------------------------
       * ACTIVE FLAG
       * ------------------------------------------------------
       *
       * Kept because the admin UI/API can use a simple
       * boolean when filtering certificates.
       *
       * ------------------------------------------------------
       */

      isActive: {
        type: Boolean,

        default: true,

        index: true,
      },

      /*
       * ------------------------------------------------------
       * REQUIREMENTS
       * ------------------------------------------------------
       */

      requirements: {
        /*
         * Course completion percentage required to
         * become eligible for the certificate.
         */

        completionPercentage: {
          type: Number,

          min: [
            0,
            "Completion percentage cannot be less than 0",
          ],

          max: [
            100,
            "Completion percentage cannot exceed 100",
          ],

          default: 100,
        },

        /*
         * Optional minimum score.
         */

        minimumScore: {
          type: Number,

          min: [
            0,
            "Minimum score cannot be less than 0",
          ],

          max: [
            100,
            "Minimum score cannot exceed 100",
          ],

          default: null,
        },

        /*
         * Whether final assessment is mandatory.
         */

        requireFinalAssessment: {
          type: Boolean,

          default: false,
        },
      },
    },

    /*
     * ========================================================
     * SCHEMA OPTIONS
     * ========================================================
     */

    {
      timestamps: true,

      versionKey: false,
    }
  );

/*
 * ============================================================
 * VALIDATION
 * ============================================================
 *
 * Validate validityDays based on validity.
 *
 * IMPORTANT:
 * This intentionally does NOT use `next`.
 * This avoids the "next is not a function" problem that
 * occurred previously with Mongoose middleware.
 *
 * ============================================================
 */

CertificateSchema.pre(
  "validate",
  function () {
    /*
     * LIMITED certificates must have validityDays.
     */

    if (
      this.validity ===
      "LIMITED"
    ) {
      if (
        !this.validityDays ||
        this.validityDays < 1
      ) {
        this.invalidate(
          "validityDays",
          "Validity days are required for limited certificates"
        );
      }
    }

    /*
     * PERMANENT certificates should not retain
     * a validity period.
     */

    if (
      this.validity ===
      "PERMANENT"
    ) {
      this.validityDays =
        undefined;
    }

    /*
     * Keep status and isActive synchronized.
     */

    if (
      this.status ===
      "INACTIVE"
    ) {
      this.isActive = false;
    }

    if (
      this.status ===
      "ACTIVE"
    ) {
      this.isActive = true;
    }
  }
);

/*
 * ============================================================
 * INDEXES
 * ============================================================
 */

/*
 * Course + active status
 *
 * Useful when finding the active certificate definition
 * associated with a course.
 */

CertificateSchema.index({
  course: 1,
  isActive: 1,
});

/*
 * Course + title
 *
 * Helps avoid accidentally creating duplicate certificate
 * definitions for the same course.
 */

CertificateSchema.index({
  course: 1,
  title: 1,
});

/*
 * Admin listing
 */

CertificateSchema.index({
  createdAt: -1,
});

/*
 * Status filtering
 */

CertificateSchema.index({
  status: 1,
  createdAt: -1,
});

/*
 * ============================================================
 * MODEL
 * ============================================================
 *
 * Prevent model recompilation during:
 *
 * - Next.js development
 * - Turbopack
 * - Hot reload
 * - Serverless execution
 *
 * ============================================================
 */

const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>(
    "Certificate",
    CertificateSchema
  );

export default Certificate;