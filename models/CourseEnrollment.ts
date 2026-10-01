import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * COURSE ENROLLMENT
 * ======================================================
 *
 * Connects a User with a Course.
 *
 * Example:
 *
 * User
 *   ↓
 * CourseEnrollment
 *   ↓
 * Course
 *
 * Progress is maintained separately from the Course
 * master document.
 *
 * ======================================================
 */

const CourseEnrollmentSchema =
  new Schema(
    {
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
       * ENROLLMENT STATUS
       * --------------------------------------------------
       */

      status: {
        type: String,
        enum: [
          "ACTIVE",
          "COMPLETED",
          "CANCELLED",
          "EXPIRED",
        ],
        default: "ACTIVE",
        index: true,
      },

      /*
       * --------------------------------------------------
       * PROGRESS
       * --------------------------------------------------
       *
       * Percentage from 0 to 100.
       *
       * --------------------------------------------------
       */

      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      /*
       * --------------------------------------------------
       * COMPLETED LESSONS
       * --------------------------------------------------
       *
       * Stores lesson references that the user has
       * completed.
       *
       * --------------------------------------------------
       */

      completedLessons: [
        {
          type: Schema.Types.ObjectId,
          ref: "CourseLesson",
        },
      ],

      /*
       * --------------------------------------------------
       * COMPLETED LESSON COUNT
       * --------------------------------------------------
       *
       * Cached value for fast progress calculations.
       *
       * --------------------------------------------------
       */

      completedLessonCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * TOTAL LESSON COUNT
       * --------------------------------------------------
       *
       * Snapshot of total lessons when enrollment
       * or progress is calculated.
       *
       * --------------------------------------------------
       */

      totalLessonCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * LAST ACCESSED LESSON
       * --------------------------------------------------
       *
       * Used for:
       *
       * Continue Learning
       *
       * --------------------------------------------------
       */

      lastAccessedLesson: {
        type: Schema.Types.ObjectId,
        ref: "CourseLesson",
        default: null,
      },

      /*
       * --------------------------------------------------
       * LAST ACCESSED MODULE
       * --------------------------------------------------
       */

      lastAccessedModule: {
        type: Schema.Types.ObjectId,
        ref: "CourseModule",
        default: null,
      },

      /*
       * --------------------------------------------------
       * LAST ACCESSED AT
       * --------------------------------------------------
       */

      lastAccessedAt: {
        type: Date,
        default: null,
      },

      /*
       * --------------------------------------------------
       * STARTED AT
       * --------------------------------------------------
       */

      startedAt: {
        type: Date,
        default: null,
      },

      /*
       * --------------------------------------------------
       * COMPLETED AT
       * --------------------------------------------------
       */

      completedAt: {
        type: Date,
        default: null,
      },

      /*
       * --------------------------------------------------
       * ENROLLED AT
       * --------------------------------------------------
       */

      enrolledAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      /*
       * --------------------------------------------------
       * EXPIRATION
       * --------------------------------------------------
       *
       * Nullable for courses without an expiry.
       *
       * --------------------------------------------------
       */

      expiresAt: {
        type: Date,
        default: null,
        index: true,
      },

      /*
       * --------------------------------------------------
       * TIME SPENT
       * --------------------------------------------------
       *
       * Total learning time in seconds.
       *
       * --------------------------------------------------
       */

      timeSpentSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * LAST SESSION DURATION
       * --------------------------------------------------
       *
       * Duration of the most recent learning session
       * in seconds.
       *
       * --------------------------------------------------
       */

      lastSessionSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * --------------------------------------------------
       * CERTIFICATE
       * --------------------------------------------------
       */

      certificate: {
        issued: {
          type: Boolean,
          default: false,
        },

        certificateId: {
          type: String,
          default: "",
          trim: true,
          maxlength: 200,
        },

        issuedAt: {
          type: Date,
          default: null,
        },

        url: {
          type: String,
          default: "",
          trim: true,
        },
      },

      /*
       * --------------------------------------------------
       * PAYMENT
       * --------------------------------------------------
       *
       * Prepared for future paid courses.
       *
       * Free courses can simply use:
       *
       * payment.status = NOT_REQUIRED
       *
       * --------------------------------------------------
       */

      payment: {
        status: {
          type: String,
          enum: [
            "NOT_REQUIRED",
            "PENDING",
            "PAID",
            "FAILED",
            "REFUNDED",
          ],
          default: "NOT_REQUIRED",
        },

        amount: {
          type: Number,
          default: 0,
          min: 0,
        },

        currency: {
          type: String,
          default: "INR",
          uppercase: true,
          trim: true,
          maxlength: 10,
        },

        transactionId: {
          type: String,
          default: "",
          trim: true,
          maxlength: 200,
        },

        paidAt: {
          type: Date,
          default: null,
        },
      },

      /*
       * --------------------------------------------------
       * ENROLLMENT SOURCE
       * --------------------------------------------------
       *
       * Useful for analytics.
       *
       * Examples:
       *
       * SELF
       * ADMIN
       * PURCHASE
       * ASSIGNED
       * IMPORT
       *
       * --------------------------------------------------
       */

      enrollmentSource: {
        type: String,
        enum: [
          "SELF",
          "ADMIN",
          "PURCHASE",
          "ASSIGNED",
          "IMPORT",
        ],
        default: "SELF",
        index: true,
      },

      /*
       * --------------------------------------------------
       * CREATED BY
       * --------------------------------------------------
       *
       * Normally the user or admin who created the
       * enrollment.
       *
       * --------------------------------------------------
       */

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
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
 * ------------------------------------------------------
 * USER'S COURSES
 * ------------------------------------------------------
 *
 * Main query for:
 *
 * /courses/my-courses
 *
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index({
  user: 1,
  enrolledAt: -1,
});

/*
 * ------------------------------------------------------
 * USER ACTIVE COURSES
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index({
  user: 1,
  status: 1,
  enrolledAt: -1,
});

/*
 * ------------------------------------------------------
 * COURSE ENROLLMENTS
 * ------------------------------------------------------
 *
 * Useful for admin analytics.
 *
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index({
  course: 1,
  status: 1,
  enrolledAt: -1,
});

/*
 * ------------------------------------------------------
 * CONTINUE LEARNING
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index({
  user: 1,
  lastAccessedAt: -1,
});

/*
 * ------------------------------------------------------
 * EXPIRING ENROLLMENTS
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index({
  expiresAt: 1,
  status: 1,
});

/*
 * ------------------------------------------------------
 * UNIQUE USER + COURSE
 * ------------------------------------------------------
 *
 * A user should normally have one enrollment record
 * for a course.
 *
 * If the user cancels and later re-enrolls, the same
 * enrollment can be activated again rather than creating
 * duplicates.
 *
 * ------------------------------------------------------
 */

CourseEnrollmentSchema.index(
  {
    user: 1,
    course: 1,
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

CourseEnrollmentSchema.pre(
  "save",
  function (next) {
    this.updatedAt = new Date();

    /*
     * --------------------------------------------------
     * CALCULATE PROGRESS
     * --------------------------------------------------
     */

    if (
      this.totalLessonCount > 0
    ) {
      this.progress = Math.min(
        100,
        Math.round(
          (
            this.completedLessonCount /
            this.totalLessonCount
          ) *
            100
        )
      );
    } else {
      this.progress = 0;
    }

    /*
     * --------------------------------------------------
     * START DATE
     * --------------------------------------------------
     *
     * Set startedAt when the user has actually started
     * learning.
     *
     * --------------------------------------------------
     */

    if (
      this.lastAccessedAt &&
      !this.startedAt
    ) {
      this.startedAt =
        this.lastAccessedAt;
    }

    /*
     * --------------------------------------------------
     * COURSE COMPLETION
     * --------------------------------------------------
     */

    if (
      this.progress >= 100 &&
      this.totalLessonCount > 0
    ) {
      this.status = "COMPLETED";

      if (!this.completedAt) {
        this.completedAt =
          new Date();
      }
    }

    /*
     * --------------------------------------------------
     * CERTIFICATE
     * --------------------------------------------------
     *
     * Certificate issuing itself will be handled by
     * the application/service layer.
     *
     * --------------------------------------------------
     */

    next();
  }
);

/*
 * ======================================================
 * MODEL
 * ======================================================
 */

const CourseEnrollment =
  models.CourseEnrollment ||
  mongoose.model(
    "CourseEnrollment",
    CourseEnrollmentSchema
  );

export default CourseEnrollment;