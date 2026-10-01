import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IPractice
  extends Document {
  lesson: mongoose.Types.ObjectId;
  title: string;
  description: string;
  instructions: string[];
  starterCode: string;
  language: string;
  solutionCode: string;
  hints: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PracticeSchema =
  new Schema<IPractice>(
    {
      lesson: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      instructions: {
        type: [String],
        default: [],
      },

      starterCode: {
        type: String,
        default: "",
      },

      language: {
        type: String,
        default: "javascript",
        trim: true,
        lowercase: true,
      },

      /*
       * Stored separately so the student
       * does not receive the solution
       * with the normal practice API.
       */
      solutionCode: {
        type: String,
        default: "",
      },

      hints: {
        type: [String],
        default: [],
      },

      difficulty: {
        type: String,
        enum: [
          "Easy",
          "Medium",
          "Hard",
        ],
        default: "Easy",
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
 * Normally a lesson will have one
 * primary practice exercise.
 */
PracticeSchema.index({
  lesson: 1,
});

const Practice: Model<IPractice> =
  mongoose.models.Practice ||
  mongoose.model<IPractice>(
    "Practice",
    PracticeSchema
  );

export default Practice;