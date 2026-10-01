import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IQuizOption {
  text: string;
  value: string;
}

export interface IQuizQuestion {
  question: string;

  options: IQuizOption[];

  correctAnswer: string;

  explanation?: string;

  order: number;
}

export interface IQuiz
  extends Document {
  lesson: mongoose.Types.ObjectId;

  questions: IQuizQuestion[];

  passingScore: number;

  published: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema =
  new Schema<IQuizOption>(
    {
      text: {
        type: String,
        required: true,
        trim: true,
      },

      value: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const QuizQuestionSchema =
  new Schema<IQuizQuestion>(
    {
      question: {
        type: String,
        required: true,
        trim: true,
      },

      options: {
        type: [QuizOptionSchema],
        required: true,
        validate: {
          validator: (
            value: IQuizOption[]
          ) =>
            value.length >= 2,

          message:
            "A question must have at least 2 options",
        },
      },

      correctAnswer: {
        type: String,
        required: true,
        trim: true,
      },

      explanation: {
        type: String,
        default: "",
        trim: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    {
      _id: true,
    }
  );

const QuizSchema =
  new Schema<IQuiz>(
    {
      lesson: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        unique: true,
        index: true,
      },

      questions: {
        type: [QuizQuestionSchema],
        default: [],
      },

      /*
       * Minimum percentage required
       * to pass the quiz.
       */
      passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
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

const Quiz: Model<IQuiz> =
  mongoose.models.Quiz ||
  mongoose.model<IQuiz>(
    "Quiz",
    QuizSchema
  );

export default Quiz;