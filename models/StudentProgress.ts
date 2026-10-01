import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IStudentProgress
  extends Document {
  user: mongoose.Types.ObjectId;
  roadmap: mongoose.Types.ObjectId;
  module: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;

  completed: boolean;
  completedAt?: Date;

  score?: number;
  attempts: number;

  lastAccessedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const StudentProgressSchema =
  new Schema<IStudentProgress>(
    {
      /*
       * Student/User
       */
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * Roadmap being followed
       */
      roadmap: {
        type: Schema.Types.ObjectId,
        ref: "Roadmap",
        required: true,
        index: true,
      },

      /*
       * Module containing the lesson
       */
      module: {
        type: Schema.Types.ObjectId,
        ref: "Module",
        required: true,
        index: true,
      },

      /*
       * Lesson being tracked
       */
      lesson: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        index: true,
      },

      /*
       * Whether the student has
       * completed this lesson.
       */
      completed: {
        type: Boolean,
        default: false,
      },

      /*
       * When the lesson was completed.
       */
      completedAt: {
        type: Date,
      },

      /*
       * Optional quiz/practice score.
       *
       * 0–100
       */
      score: {
        type: Number,
        min: 0,
        max: 100,
      },

      /*
       * Number of times the student
       * attempted the activity.
       */
      attempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * Useful for showing:
       * "Continue where you left off"
       */
      lastAccessedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * One progress record per student
 * per lesson.
 */
StudentProgressSchema.index(
  {
    user: 1,
    lesson: 1,
  },
  {
    unique: true,
  }
);

/*
 * Useful when calculating roadmap
 * progress for a particular student.
 */
StudentProgressSchema.index({
  user: 1,
  roadmap: 1,
});

/*
 * Useful when calculating module
 * progress for a particular student.
 */
StudentProgressSchema.index({
  user: 1,
  module: 1,
});

const StudentProgress: Model<IStudentProgress> =
  mongoose.models.StudentProgress ||
  mongoose.model<IStudentProgress>(
    "StudentProgress",
    StudentProgressSchema
  );

export default StudentProgress;