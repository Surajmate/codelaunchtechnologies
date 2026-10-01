import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    // ============================================================
    // PERSONAL DETAILS
    // ============================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: [
        "",
        "MALE",
        "FEMALE",
        "OTHER",
        "PREFER_NOT_TO_SAY",
      ],
      default: "",
    },

    // ============================================================
    // ADDRESS / CONTACT DETAILS
    // ============================================================

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // ============================================================
    // EDUCATION DETAILS
    // ============================================================

    highestQualification: {
      type: String,
      required: true,
      enum: [
        "10TH",
        "12TH",
        "DIPLOMA",
        "BACHELOR",
        "MASTER",
        "DOCTORATE",
        "OTHER",
      ],
    },

    specialization: {
      type: String,
      default: "",
      trim: true,
    },

    college: {
      type: String,
      default: "",
      trim: true,
    },

    university: {
      type: String,
      default: "",
      trim: true,
    },

    graduationYear: {
      type: String,
      default: "",
      trim: true,
    },

    // ============================================================
    // PROFESSIONAL DETAILS
    // ============================================================

    employmentStatus: {
      type: String,
      enum: [
        "",
        "STUDENT",
        "EMPLOYED",
        "SELF_EMPLOYED",
        "FREELANCER",
        "JOB_SEEKER",
        "OTHER",
      ],
      default: "",
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    // ============================================================
    // ACCOUNT DETAILS
    // ============================================================

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },

    avatar: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  models.User || mongoose.model("User", UserSchema);

export default User;