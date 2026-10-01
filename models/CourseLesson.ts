import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * COURSE LESSON
 * ======================================================
 *
 * A lesson belongs to:
 *
 * Course
 *   ↓
 * CourseModule
 *   ↓
 * CourseLesson
 *
 * Supported lesson types:
 *
 * VIDEO
 * ARTICLE
 * DOCUMENT
 * QUIZ
 * ASSIGNMENT
 * EXTERNAL
 *
 * ======================================================
 */

const CourseLessonSchema =
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
       * MODULE
       * --------------------------------------------------
       */

      module: {
        type: Schema.Types.ObjectId,
        ref: "CourseModule",
        required: true,
        index: true,
      },

      /*
       * --------------------------------------------------
       * LESSON TITLE
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
       * SHORT DESCRIPTION
       * --------------------------------------------------
       */

      shortDescription: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      /*
       * --------------------------------------------------
       * CONTENT
       * --------------------------------------------------
       *
       * Used primarily for ARTICLE lessons.
       *
       * Can contain HTML/Markdown depending on the
       * editor used by the application.
       *
       * --------------------------------------------------
       */

      content: {
        type: String,
        default: "",
      },

      /*
       * --------------------------------------------------
       * LESSON TYPE
       * --------------------------------------------------
       */

      type: {
        type: String,
        enum: [
          "VIDEO",
          "ARTICLE",
          "DOCUMENT",
          "QUIZ",
          "ASSIGNMENT",
          "EXTERNAL",
        ],
        default: "VIDEO",
        index: true,
      },

      /*
       * --------------------------------------------------
       * VIDEO URL
       * --------------------------------------------------
       *
       * Used for:
       *
       * - YouTube
       * - Vimeo
       * - Cloudinary
       * - S3
       * - Other video providers
       *
       * --------------------------------------------------
       */

      videoUrl: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * --------------------------------------------------
       * VIDEO PROVIDER
       * --------------------------------------------------
       */

      videoProvider: {
        type: String,
        enum: [
          "",
          "YOUTUBE",
          "VIMEO",
          "CLOUDINARY",
          "S3",
          "OTHER",
        ],
        default: "",
      },

      /*
       * --------------------------------------------------
       * VIDEO ID
       * --------------------------------------------------
       *
       * Useful for providers such as YouTube/Vimeo.
       *
       * --------------------------------------------------
       */

      videoId: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * --------------------------------------------------
       * DOCUMENT URL
       * --------------------------------------------------
       *
       * Used for:
       *
       * - PDF
       * - DOCX
       * - PPTX
       * - Other learning material
       *
       * --------------------------------------------------
       */

      documentUrl: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * --------------------------------------------------
       * DOCUMENT NAME
       * --------------------------------------------------
       */

      documentName: {
        type: String,
        default: "",
        trim: true,
        maxlength: 255,
      },

      /*
       * --------------------------------------------------
       * EXTERNAL URL
       * --------------------------------------------------
       */

      externalUrl: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * --------------------------------------------------
       * DURATION
       * --------------------------------------------------
       *
       * Stored in minutes.
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
       * ORDER
       * --------------------------------------------------
       *
       * Determines lesson order inside a module.
       *
       * --------------------------------------------------
       */

      order: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
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
       * Allows a lesson to be accessed as a preview
       * without completing the entire enrollment flow.
       *
       * --------------------------------------------------
       */

      preview: {
        type: Boolean,
        default: false,
      },

      /*
       * --------------------------------------------------
       * REQUIRED LESSON
       * --------------------------------------------------
       *
       * Determines whether this lesson must be
       * completed before the course can be considered
       * complete.
       *
       * --------------------------------------------------
       */

      required: {
        type: Boolean,
        default: true,
      },

      /*
       * --------------------------------------------------
       * QUIZ REFERENCE
       * --------------------------------------------------
       *
       * Later this can reference a dedicated Quiz model.
       *
       * We keep it nullable so normal lessons do not
       * require a Quiz document.
       *
       * --------------------------------------------------
       */

      quiz: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        default: null,
      },

      /*
       * --------------------------------------------------
       * ASSIGNMENT REFERENCE
       * --------------------------------------------------
       *
       * Later this can reference a dedicated Assignment
       * model.
       *
       * --------------------------------------------------
       */

      assignment: {
        type: Schema.Types.ObjectId,
        ref: "Assignment",
        default: null,
      },

      /*
       * --------------------------------------------------
       * RESOURCES
       * --------------------------------------------------
       *
       * Additional learning resources.
       *
       * --------------------------------------------------
       */

      resources: [
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
            maxlength: 100,
          },

          size: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],

      /*
       * --------------------------------------------------
       * LEARNING OBJECTIVES
       * --------------------------------------------------
       */

      learningObjectives: [
        {
          type: String,
          trim: true,
          maxlength: 500,
        },
      ],

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
 * Main curriculum query:
 *
 * Get lessons for a module in order.
 */

CourseLessonSchema.index({
  module: 1,
  order: 1,
});

/*
 * Course + module + published lessons.
 */

CourseLessonSchema.index({
  course: 1,
  module: 1,
  status: 1,
  order: 1,
});

/*
 * Course curriculum query.
 */

CourseLessonSchema.index({
  course: 1,
  status: 1,
  order: 1,
});

/*
 * Lesson type filtering.
 */

CourseLessonSchema.index({
  course: 1,
  type: 1,
  status: 1,
});

/*
 * Prevent duplicate lesson slugs inside
 * the same module.
 */

CourseLessonSchema.index(
  {
    module: 1,
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

CourseLessonSchema.pre(
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

const CourseLesson =
  models.CourseLesson ||
  mongoose.model(
    "CourseLesson",
    CourseLessonSchema
  );

export default CourseLesson;