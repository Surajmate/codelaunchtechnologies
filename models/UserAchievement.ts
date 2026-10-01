import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export type AchievementType =
  | "COURSE"
  | "PROJECT"
  | "PRACTICE"
  | "ROADMAP"
  | "CERTIFICATE"
  | "CUSTOM";

export type AchievementStatus =
  | "LOCKED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface IUserAchievement
  extends Document {
  user: mongoose.Types.ObjectId;

  title: string;

  description?: string;

  type: AchievementType;

  status: AchievementStatus;

  progress: number;

  icon?: string;

  color?: string;

  awardedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const UserAchievementSchema =
  new Schema<IUserAchievement>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      type: {
        type: String,
        enum: [
          "COURSE",
          "PROJECT",
          "PRACTICE",
          "ROADMAP",
          "CERTIFICATE",
          "CUSTOM",
        ],
        required: true,
        default: "CUSTOM",
      },

      status: {
        type: String,
        enum: [
          "LOCKED",
          "IN_PROGRESS",
          "COMPLETED",
        ],
        required: true,
        default: "IN_PROGRESS",
      },

      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      icon: {
        type: String,
        trim: true,
        default: "🏆",
      },

      color: {
        type: String,
        trim: true,
        default: "",
      },

      awardedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * Automatically set status based on progress.
 *
 * IMPORTANT:
 * This intentionally does NOT use `next`.
 * This avoids the `next is not a function` error.
 */
UserAchievementSchema.pre(
  "save",
  function () {
    if (this.progress >= 100) {
      this.progress = 100;
      this.status = "COMPLETED";

      if (!this.awardedAt) {
        this.awardedAt = new Date();
      }
    } else if (this.progress > 0) {
      this.status = "IN_PROGRESS";
      this.awardedAt = undefined;
    } else {
      this.status = "LOCKED";
      this.awardedAt = undefined;
    }
  }
);

/*
 * Indexes
 */

UserAchievementSchema.index({
  user: 1,
  createdAt: -1,
});

UserAchievementSchema.index({
  user: 1,
  status: 1,
});

UserAchievementSchema.index({
  type: 1,
});

/*
 * Prevent model recompilation during Next.js hot reload.
 */

const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement ||
  mongoose.model<IUserAchievement>(
    "UserAchievement",
    UserAchievementSchema
  );

export default UserAchievement;