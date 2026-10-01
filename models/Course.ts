import mongoose, {
  Schema,
  models,
  Document,
  Model,
} from "mongoose";

/*
 * ======================================================
 * COURSE TYPES
 * ======================================================
 */

export type CourseStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type CourseLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";

export interface ICourse extends Document {
  title: string;
  slug: string;

  shortDescription: string;
  description: string;

  thumbnail: string;
  bannerImage: string;

  category: string;
  subCategory: string;

  level: CourseLevel;
  language: string;

  instructor?: mongoose.Types.ObjectId | null;
  instructorName: string;

  status: CourseStatus;

  featured: boolean;

  isFree: boolean;
  price: number;
  discountPrice: number;
  currency: string;

  durationMinutes: number;

  lessonCount: number;
  moduleCount: number;

  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  tags: string[];

  rating: {
    average: number;
    count: number;
  };

  enrollmentCount: number;
  completionCount: number;

  certificateEnabled: boolean;
  certificateName: string;

  publishedAt?: Date | null;

  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

/*
 * ======================================================
 * COURSE SCHEMA
 * ======================================================
 */

const CourseSchema =
  new Schema<ICourse>(
    {
      /*
       * --------------------------------------------------
       * BASIC INFORMATION
       * --------------------------------------------------
       */

      title: {
        type: String,
        required: [true, "Course title is required"],
        trim: true,
        minlength: [3, "Course title must be at least 3 characters"],
        maxlength: [200, "Course title cannot exceed 200 characters"],
        index: true,
      },

      slug: {
        type: String,
        required: [true, "Course slug is required"],
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [3, "Course slug must be at least 3 characters"],
        maxlength: [200, "Course slug cannot exceed 200 characters"],
        match: [
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Course slug can contain only lowercase letters, numbers and hyphens",
        ],
        index: true,
      },

      shortDescription: {
        type: String,
        required: [
          true,
          "Short description is required",
        ],
        trim: true,
        minlength: [
          10,
          "Short description must be at least 10 characters",
        ],
        maxlength: [
          500,
          "Short description cannot exceed 500 characters",
        ],
      },

      description: {
        type: String,
        required: [
          true,
          "Course description is required",
        ],
        trim: true,
        minlength: [
          20,
          "Course description must be at least 20 characters",
        ],
        maxlength: [
          20000,
          "Course description cannot exceed 20000 characters",
        ],
      },

      /*
       * --------------------------------------------------
       * IMAGES
       * --------------------------------------------------
       */

      thumbnail: {
        type: String,
        trim: true,
        default: "",
      },

      bannerImage: {
        type: String,
        trim: true,
        default: "",
      },

      /*
       * --------------------------------------------------
       * CATEGORY
       * --------------------------------------------------
       */

      category: {
        type: String,
        required: [true, "Course category is required"],
        trim: true,
        maxlength: [
          100,
          "Category cannot exceed 100 characters",
        ],
        index: true,
      },

      subCategory: {
        type: String,
        trim: true,
        maxlength: [
          100,
          "Sub-category cannot exceed 100 characters",
        ],
        default: "",
      },

      /*
       * --------------------------------------------------
       * LEVEL
       * --------------------------------------------------
       */

      level: {
        type: String,
        enum: {
          values: [
            "BEGINNER",
            "INTERMEDIATE",
            "ADVANCED",
            "ALL_LEVELS",
          ],
          message: "Invalid course level",
        },
        default: "ALL_LEVELS",
        index: true,
      },

      /*
       * --------------------------------------------------
       * LANGUAGE
       * --------------------------------------------------
       */

      language: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "English",
      },

      /*
       * --------------------------------------------------
       * INSTRUCTOR
       * --------------------------------------------------
       */

      instructor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      instructorName: {
        type: String,
        trim: true,
        maxlength: 150,
        default: "",
      },

      /*
       * --------------------------------------------------
       * STATUS
       * --------------------------------------------------
       */

      status: {
        type: String,
        enum: {
          values: [
            "DRAFT",
            "PUBLISHED",
            "ARCHIVED",
          ],
          message: "Invalid course status",
        },
        default: "DRAFT",
        index: true,
      },

      /*
       * --------------------------------------------------
       * FEATURED
       * --------------------------------------------------
       */

      featured: {
        type: Boolean,
        default: false,
        index: true,
      },

      /*
       * --------------------------------------------------
       * PRICING
       * --------------------------------------------------
       */

      isFree: {
        type: Boolean,
        default: true,
        index: true,
      },

      price: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: 0,
      },

      discountPrice: {
        type: Number,
        min: [
          0,
          "Discount price cannot be negative",
        ],
        default: 0,
      },

      currency: {
        type: String,
        uppercase: true,
        trim: true,
        maxlength: 10,
        default: "INR",
      },

      /*
       * --------------------------------------------------
       * COURSE METADATA
       * --------------------------------------------------
       */

      durationMinutes: {
        type: Number,
        min: [
          0,
          "Duration cannot be negative",
        ],
        default: 0,
      },

      lessonCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      moduleCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /*
       * --------------------------------------------------
       * REQUIREMENTS
       * --------------------------------------------------
       */

      requirements: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },

      /*
       * --------------------------------------------------
       * LEARNING OUTCOMES
       * --------------------------------------------------
       */

      learningOutcomes: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },

      /*
       * --------------------------------------------------
       * TARGET AUDIENCE
       * --------------------------------------------------
       */

      targetAudience: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },

      /*
       * --------------------------------------------------
       * TAGS
       * --------------------------------------------------
       */

      tags: {
        type: [
          {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 50,
          },
        ],
        default: [],
      },

      /*
       * --------------------------------------------------
       * RATING
       * --------------------------------------------------
       */

      rating: {
        average: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },

        count: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      /*
       * --------------------------------------------------
       * ENROLLMENT / COMPLETION
       * --------------------------------------------------
       */

      enrollmentCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      completionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /*
       * --------------------------------------------------
       * CERTIFICATE
       * --------------------------------------------------
       */

      certificateEnabled: {
        type: Boolean,
        default: false,
      },

      certificateName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      /*
       * --------------------------------------------------
       * PUBLICATION
       * --------------------------------------------------
       */

      publishedAt: {
        type: Date,
        default: null,
      },

      /*
       * --------------------------------------------------
       * AUDIT
       * --------------------------------------------------
       */

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "Course creator is required",
        ],
        index: true,
      },

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
 * ======================================================
 * VALIDATION
 * ======================================================
 */

/*
 * Free courses must always have zero price.
 */

CourseSchema.pre(
  "validate",
  function () {
    if (this.isFree) {
      this.price = 0;
      this.discountPrice = 0;
    }

    /*
     * Paid course cannot have a negative/equal-or-higher
     * discount price.
     */

    if (!this.isFree) {
      if (this.price < 0) {
        this.invalidate(
          "price",
          "Price cannot be negative"
        );
      }

      if (
        this.discountPrice < 0
      ) {
        this.invalidate(
          "discountPrice",
          "Discount price cannot be negative"
        );
      }

      if (
        this.discountPrice > this.price
      ) {
        this.invalidate(
          "discountPrice",
          "Discount price cannot be greater than course price"
        );
      }
    }

    /*
     * Published courses should have a publication date.
     */

    if (
      this.status === "PUBLISHED" &&
      !this.publishedAt
    ) {
      this.publishedAt = new Date();
    }

    /*
     * Draft courses should not have a publication date.
     */

    if (
      this.status === "DRAFT"
    ) {
      this.publishedAt = null;
    }
  }
);

/*
 * ======================================================
 * INDEXES
 * ======================================================
 */

CourseSchema.index({
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  featured: 1,
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  category: 1,
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  level: 1,
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  instructor: 1,
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  isFree: 1,
  status: 1,
  createdAt: -1,
});

CourseSchema.index({
  enrollmentCount: -1,
  status: 1,
});

CourseSchema.index({
  "rating.average": -1,
  "rating.count": -1,
  status: 1,
});

/*
 * ======================================================
 * MODEL
 * ======================================================
 *
 * Prevent model recompilation during Next.js hot reload.
 *
 * ======================================================
 */

const Course: Model<ICourse> =
  models.Course ||
  mongoose.model<ICourse>(
    "Course",
    CourseSchema
  );

export default Course;