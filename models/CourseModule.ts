import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * COURSE MODULE
 * ======================================================
 *
 * A course can contain multiple modules.
 *
 * Example:
 *
 * Course
 *   ├── Module 1 - Introduction
 *   ├── Module 2 - Fundamentals
 *   ├── Module 3 - Advanced Concepts
 *   └── Module 4 - Project
 *
 * Lessons are stored separately and reference
 * this module.
 *
 * ======================================================
 */

const CourseModuleSchema =
  new Schema(
    {
      /*
       * --------------------------------------------------
       * COURSE
       * --------------------------------------------------
       */

      course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * MODULE TITLE
       * --------------------------------------------------
       */

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      /*
       * --------------------------------------------------
       * SLUG
       * --------------------------------------------------
       *
       * Example:
       *
       * "introduction-to-mulesoft"
       *
       * --------------------------------------------------
       */

      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 200,
      },

      /*
       * --------------------------------------------------
       * DESCRIPTION
       * --------------------------------------------------
       */

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },

      /*
       * --------------------------------------------------
       * ORDER
       * --------------------------------------------------
       *
       * Determines module display order.
       *
       * 1
       * 2
       * 3
       * ...
       *
       * --------------------------------------------------
       */

      order: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
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
          "DRAFT",
          "PUBLISHED",
          "ARCHIVED",
        ],
        default: "DRAFT",
        index: true,
      },

      /*
       * --------------------------------------------------
       * FREE PREVIEW
       * --------------------------------------------------
       *
       * If enabled, users can see/access this module
       * before enrollment/payment depending on the
       * application rules.
       *
       * --------------------------------------------------
       */

      preview: {
        type: Boolean,
        default: false,
      },

      /*
       * --------------------------------------------------
       * LESSON COUNT
       * --------------------------------------------------
       *
       * Cached count for fast course display.
       *
       * Actual lessons are stored separately.
       *
       * --------------------------------------------------
       */

      lessonCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * DURATION
       * --------------------------------------------------
       *
       * Total module duration in minutes.
       *
       * --------------------------------------------------
       */

      durationMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * CREATED BY
       * --------------------------------------------------
       */

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * UPDATED BY
       * --------------------------------------------------
       */

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
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

      /*
       * --------------------------------------------------
       * UPDATED AT
       * --------------------------------------------------
       */

      updatedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ======================================================
 * INDEXES
 * ======================================================
 */

/*
 * Main course curriculum query.
 *
 * Fetch modules for a course in display order.
 */

CourseModuleSchema.index({
  course: 1,
  order: 1,
});

/*
 * Published modules for user-side curriculum.
 */

CourseModuleSchema.index({
  course: 1,
  status: 1,
  order: 1,
});

/*
 * Prevent duplicate module slugs inside
 * the same course.
 */

CourseModuleSchema.index(
  {
    course: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

/*
 * ======================================================
 * PRE SAVE
 * ======================================================
 */

CourseModuleSchema.pre(
  "save",
  function (next) {
    this.updatedAt = new Date();

    next();
  }
);

/*
 * ======================================================
 * MODEL
 * ======================================================
 */

const CourseModule =
  models.CourseModule ||
  mongoose.model(
    "CourseModule",
    CourseModuleSchema
  );

export default CourseModule;