import mongoose, {
  Schema,
  models,
} from "mongoose";

/*
 * ======================================================
 * ACHIEVEMENT
 * ======================================================
 *
 * Master definition of achievements available
 * throughout the Codelaunch learning platform.
 *
 * Achievement flow:
 *
 * Achievement
 *      ↓
 * UserAchievement
 *      ↓
 * User earns achievement
 *
 * ======================================================
 */

const AchievementSchema = new Schema(
  {
    /*
     * --------------------------------------------------
     * NAME
     * --------------------------------------------------
     */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    /*
     * --------------------------------------------------
     * SLUG
     * --------------------------------------------------
     *
     * URL/system-friendly identifier.
     *
     * Example:
     *
     * first-steps
     * course-graduate
     * seven-day-streak
     *
     * --------------------------------------------------
     */

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
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
      maxlength: 500,
    },

    /*
     * --------------------------------------------------
     * ICON
     * --------------------------------------------------
     *
     * Can contain an emoji, icon identifier or
     * frontend icon name.
     *
     * Example:
     *
     * trophy
     * flame
     * graduation-cap
     *
     * --------------------------------------------------
     */

    icon: {
      type: String,
      default: "trophy",
      trim: true,
    },

    /*
     * --------------------------------------------------
     * IMAGE
     * --------------------------------------------------
     *
     * Optional achievement artwork.
     *
     * --------------------------------------------------
     */

    image: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * --------------------------------------------------
     * CATEGORY
     * --------------------------------------------------
     */

    category: {
      type: String,
      enum: [
        "LEARNING",
        "COURSE",
        "QUIZ",
        "PROJECT",
        "STREAK",
        "CERTIFICATE",
        "MILESTONE",
        "SPECIAL",
      ],
      default: "MILESTONE",
      index: true,
    },

    /*
     * --------------------------------------------------
     * RARITY
     * --------------------------------------------------
     *
     * Controls the visual importance of the achievement.
     *
     * --------------------------------------------------
     */

    rarity: {
      type: String,
      enum: [
        "COMMON",
        "UNCOMMON",
        "RARE",
        "EPIC",
        "LEGENDARY",
      ],
      default: "COMMON",
      index: true,
    },

    /*
     * --------------------------------------------------
     * XP REWARD
     * --------------------------------------------------
     *
     * XP awarded when the achievement is earned.
     *
     * --------------------------------------------------
     */

    xpReward: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * --------------------------------------------------
     * POINT REWARD
     * --------------------------------------------------
     *
     * Optional platform points.
     *
     * --------------------------------------------------
     */

    pointsReward: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * --------------------------------------------------
     * CONDITION TYPE
     * --------------------------------------------------
     *
     * Defines how the achievement is unlocked.
     *
     * --------------------------------------------------
     */

    conditionType: {
      type: String,
      enum: [
        "LESSONS_COMPLETED",
        "COURSES_COMPLETED",
        "QUIZZES_COMPLETED",
        "QUIZ_SCORE",
        "PROJECTS_COMPLETED",
        "STREAK_DAYS",
        "CERTIFICATES_EARNED",
        "ACHIEVEMENTS_EARNED",
        "XP_EARNED",
        "CUSTOM",
      ],
      required: true,
      index: true,
    },

    /*
     * --------------------------------------------------
     * CONDITION VALUE
     * --------------------------------------------------
     *
     * Numeric target required to unlock the achievement.
     *
     * Examples:
     *
     * LESSONS_COMPLETED = 25
     * COURSES_COMPLETED = 1
     * STREAK_DAYS = 7
     * QUIZ_SCORE = 100
     *
     * --------------------------------------------------
     */

    conditionValue: {
      type: Number,
      default: 1,
      min: 0,
    },

    /*
     * --------------------------------------------------
     * COURSE
     * --------------------------------------------------
     *
     * Optional course-specific achievement.
     *
     * Example:
     *
     * "Complete React Masterclass"
     *
     * --------------------------------------------------
     */

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },

    /*
     * --------------------------------------------------
     * IS HIDDEN
     * --------------------------------------------------
     *
     * Hidden achievements can be discovered only
     * after they are unlocked or when the condition
     * becomes close to completion.
     *
     * --------------------------------------------------
     */

    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * --------------------------------------------------
     * IS ACTIVE
     * --------------------------------------------------
     *
     * Allows administrators to temporarily disable
     * an achievement without deleting historical data.
     *
     * --------------------------------------------------
     */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
     * --------------------------------------------------
     * DISPLAY ORDER
     * --------------------------------------------------
     */

    order: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /*
     * --------------------------------------------------
     * CREATED / UPDATED
     * --------------------------------------------------
     */

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
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
 * Active achievement catalogue.
 */

AchievementSchema.index({
  isActive: 1,
  category: 1,
  order: 1,
});

/*
 * Achievement discovery.
 */

AchievementSchema.index({
  isActive: 1,
  isHidden: 1,
  rarity: 1,
});

/*
 * Condition processing.
 */

AchievementSchema.index({
  isActive: 1,
  conditionType: 1,
  conditionValue: 1,
});

/*
 * Course-specific achievements.
 */

AchievementSchema.index({
  course: 1,
  isActive: 1,
});

/*
 * ======================================================
 * PRE SAVE
 * ======================================================
 */

AchievementSchema.pre(
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

const Achievement =
  models.Achievement ||
  mongoose.model(
    "Achievement",
    AchievementSchema
  );

export default Achievement;