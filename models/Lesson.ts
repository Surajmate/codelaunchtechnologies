import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export type LessonType =
  | "Lesson"
  | "Practice"
  | "Quiz";

export interface ILesson
  extends Document {
  module: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  type: LessonType;
  duration: string;
  order: number;
  content: string;
  videoUrl?: string;
  codeExamples: {
    title: string;
    language: string;
    code: string;
  }[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CodeExampleSchema =
  new Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      language: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
      },
    },
    {
      _id: false,
    }
  );

const LessonSchema =
  new Schema<ILesson>(
    {
      module: {
        type: Schema.Types.ObjectId,
        ref: "Module",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      type: {
        type: String,
        enum: [
          "Lesson",
          "Practice",
          "Quiz",
        ],
        default: "Lesson",
      },

      duration: {
        type: String,
        default: "",
        trim: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      /*
       * Main lesson content.
       *
       * For now this can contain Markdown,
       * HTML or plain text.
       */
      content: {
        type: String,
        default: "",
      },

      /*
       * Optional video associated
       * with the lesson.
       */
      videoUrl: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * Code examples shown inside
       * the lesson.
       */
      codeExamples: {
        type: [CodeExampleSchema],
        default: [],
      },

      published: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * A module cannot have two lessons
 * with the same slug.
 */
LessonSchema.index(
  {
    module: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

/*
 * Keep lessons ordered inside
 * each module.
 */
LessonSchema.index({
  module: 1,
  order: 1,
});

const Lesson: Model<ILesson> =
  mongoose.models.Lesson ||
  mongoose.model<ILesson>(
    "Lesson",
    LessonSchema
  );

export default Lesson;