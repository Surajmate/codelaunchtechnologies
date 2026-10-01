"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onModeChange: (mode: "login" | "signup") => void;
}

interface SignupForm {
  // Personal
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;

  // Address
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // Education
  highestQualification: string;
  specialization: string;
  college: string;
  university: string;
  graduationYear: string;

  // Professional
  employmentStatus: string;
  company: string;
  designation: string;
  experience: string;

  // Account
  password: string;
  confirmPassword: string;
}

const initialSignupForm: SignupForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",

  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  highestQualification: "",
  specialization: "",
  college: "",
  university: "",
  graduationYear: "",

  employmentStatus: "",
  company: "",
  designation: "",
  experience: "",

  password: "",
  confirmPassword: "",
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: AuthModalProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signupForm, setSignupForm] =
    useState<SignupForm>(initialSignupForm);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Prevent background page scrolling while modal is open.
   */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setSignupForm(initialSignupForm);
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode: "login" | "signup") => {
    resetForm();
    onModeChange(newMode);
  };

  const updateSignupField = (
    field: keyof SignupForm,
    value: string
  ) => {
    setSignupForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateSignup = () => {
    if (!signupForm.name.trim()) {
      return "Please enter your full name.";
    }

    if (!signupForm.email.trim()) {
      return "Please enter your email address.";
    }

    if (!signupForm.phone.trim()) {
      return "Please enter your mobile number.";
    }

    if (!signupForm.highestQualification) {
      return "Please select your highest qualification.";
    }

    if (!signupForm.password) {
      return "Please enter a password.";
    }

    if (signupForm.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (mode === "signup") {
      const validationError = validateSignup();

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/signup";

      const body =
        mode === "login"
          ? {
              email: email.trim().toLowerCase(),
              password,
            }
          : {
              /*
               * Existing fields
               */
              name: signupForm.name.trim(),
              email: signupForm.email.trim().toLowerCase(),
              password: signupForm.password,

              /*
               * Personal details
               */
              phone: signupForm.phone.trim(),
              dateOfBirth: signupForm.dateOfBirth,
              gender: signupForm.gender,

              /*
               * Contact / address
               */
              address: signupForm.address.trim(),
              city: signupForm.city.trim(),
              state: signupForm.state.trim(),
              country: signupForm.country.trim(),
              pincode: signupForm.pincode.trim(),

              /*
               * Education
               */
              highestQualification:
                signupForm.highestQualification,
              specialization:
                signupForm.specialization.trim(),
              college: signupForm.college.trim(),
              university: signupForm.university.trim(),
              graduationYear:
                signupForm.graduationYear,

              /*
               * Professional
               */
              employmentStatus:
                signupForm.employmentStatus,
              company: signupForm.company.trim(),
              designation: signupForm.designation.trim(),
              experience: signupForm.experience,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed"
        );
      }

      resetForm();
      onClose();

      if (
        data.user?.role === "ADMIN" ||
        data.user?.role === "SUPER_ADMIN"
      ) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl sm:max-h-[94vh]">
        {/* Header */}
        <div className="relative shrink-0 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white sm:right-6 sm:top-6"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black">
              {mode === "login" ? (
                <LockKeyhole size={21} />
              ) : (
                <User size={21} />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {mode === "login"
                  ? "Welcome back"
                  : "Create your Codelaunch account"}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-white/40">
                {mode === "login"
                  ? "Sign in to continue to Codelaunch."
                  : "Create your student profile to access courses, learning and certifications."}
              </p>
            </div>
          </div>

          {/* Mode Switch */}
          <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:mt-6">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 sm:p-8">
            {/* ========================================================= */}
            {/* LOGIN */}
            {/* ========================================================= */}

            {mode === "login" ? (
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-md space-y-5"
              >
                <InputField
                  label="Email Address"
                  icon={<Mail size={17} />}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  required
                />

                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  placeholder="••••••••"
                />

                {error && <ErrorMessage message={error} />}

                <SubmitButton
                  loading={loading}
                  label="Login"
                  loadingLabel="Signing in..."
                />
              </form>
            ) : (
              /* ======================================================= */
              /* SIGNUP */
              /* ======================================================= */

              <form onSubmit={handleSubmit}>
                {/* PROFILE COMPLETION */}
                <div className="mb-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-white/60"
                  />

                  <div className="text-xs leading-5 text-white/40">
                    Please provide accurate information. Your profile
                    information can be used for learning records and
                    certification.
                  </div>
                </div>

                {/* =================================================== */}
                {/* PERSONAL DETAILS */}
                {/* =================================================== */}

                <FormSection
                  icon={<User size={18} />}
                  title="Personal Details"
                  description="Basic information about you."
                >
                  <InputField
                    label="Full Name"
                    icon={<User size={17} />}
                    value={signupForm.name}
                    onChange={(value) =>
                      updateSignupField("name", value)
                    }
                    placeholder="Your full name"
                    required
                  />

                  <InputField
                    label="Email Address"
                    icon={<Mail size={17} />}
                    type="email"
                    value={signupForm.email}
                    onChange={(value) =>
                      updateSignupField("email", value)
                    }
                    placeholder="you@example.com"
                    required
                  />

                  <InputField
                    label="Mobile Number"
                    icon={<Phone size={17} />}
                    type="tel"
                    value={signupForm.phone}
                    onChange={(value) =>
                      updateSignupField("phone", value)
                    }
                    placeholder="+91 98765 43210"
                    required
                  />

                  <InputField
                    label="Date of Birth"
                    type="date"
                    value={signupForm.dateOfBirth}
                    onChange={(value) =>
                      updateSignupField("dateOfBirth", value)
                    }
                  />

                  <SelectField
                    label="Gender"
                    value={signupForm.gender}
                    onChange={(value) =>
                      updateSignupField("gender", value)
                    }
                    options={[
                      {
                        value: "MALE",
                        label: "Male",
                      },
                      {
                        value: "FEMALE",
                        label: "Female",
                      },
                      {
                        value: "OTHER",
                        label: "Other",
                      },
                      {
                        value: "PREFER_NOT_TO_SAY",
                        label: "Prefer not to say",
                      },
                    ]}
                  />
                </FormSection>

                {/* =================================================== */}
                {/* CONTACT DETAILS */}
                {/* =================================================== */}

                <FormSection
                  icon={<MapPin size={18} />}
                  title="Contact & Address"
                  description="Your current contact and location details."
                >
                  <div className="sm:col-span-2">
                    <TextAreaField
                      label="Address"
                      value={signupForm.address}
                      onChange={(value) =>
                        updateSignupField("address", value)
                      }
                      placeholder="House / Building / Street"
                      rows={3}
                    />
                  </div>

                  <InputField
                    label="City"
                    icon={<MapPin size={17} />}
                    value={signupForm.city}
                    onChange={(value) =>
                      updateSignupField("city", value)
                    }
                    placeholder="Mumbai"
                  />

                  <InputField
                    label="State"
                    value={signupForm.state}
                    onChange={(value) =>
                      updateSignupField("state", value)
                    }
                    placeholder="Maharashtra"
                  />

                  <InputField
                    label="Country"
                    value={signupForm.country}
                    onChange={(value) =>
                      updateSignupField("country", value)
                    }
                    placeholder="India"
                  />

                  <InputField
                    label="PIN / Postal Code"
                    value={signupForm.pincode}
                    onChange={(value) =>
                      updateSignupField("pincode", value)
                    }
                    placeholder="400001"
                  />
                </FormSection>

                {/* =================================================== */}
                {/* EDUCATION */}
                {/* =================================================== */}

                <FormSection
                  icon={<GraduationCap size={18} />}
                  title="Education"
                  description="Your academic background."
                >
                  <SelectField
                    label="Highest Qualification"
                    value={signupForm.highestQualification}
                    onChange={(value) =>
                      updateSignupField(
                        "highestQualification",
                        value
                      )
                    }
                    required
                    options={[
                      {
                        value: "10TH",
                        label: "10th / Secondary",
                      },
                      {
                        value: "12TH",
                        label: "12th / Higher Secondary",
                      },
                      {
                        value: "DIPLOMA",
                        label: "Diploma",
                      },
                      {
                        value: "BACHELOR",
                        label: "Bachelor's Degree",
                      },
                      {
                        value: "MASTER",
                        label: "Master's Degree",
                      },
                      {
                        value: "DOCTORATE",
                        label: "Doctorate / PhD",
                      },
                      {
                        value: "OTHER",
                        label: "Other",
                      },
                    ]}
                  />

                  <InputField
                    label="Specialization"
                    value={signupForm.specialization}
                    onChange={(value) =>
                      updateSignupField(
                        "specialization",
                        value
                      )
                    }
                    placeholder="Computer Science"
                  />

                  <InputField
                    label="College / Institute"
                    value={signupForm.college}
                    onChange={(value) =>
                      updateSignupField("college", value)
                    }
                    placeholder="College / Institute name"
                  />

                  <InputField
                    label="University / Board"
                    value={signupForm.university}
                    onChange={(value) =>
                      updateSignupField("university", value)
                    }
                    placeholder="University / Board"
                  />

                  <InputField
                    label="Graduation / Completion Year"
                    value={signupForm.graduationYear}
                    onChange={(value) =>
                      updateSignupField(
                        "graduationYear",
                        value
                      )
                    }
                    placeholder="2026"
                    type="number"
                    min="1950"
                    max="2100"
                  />
                </FormSection>

                {/* =================================================== */}
                {/* PROFESSIONAL */}
                {/* =================================================== */}

                <FormSection
                  icon={<BriefcaseBusiness size={18} />}
                  title="Professional Details"
                  description="Optional information about your professional background."
                >
                  <SelectField
                    label="Employment Status"
                    value={signupForm.employmentStatus}
                    onChange={(value) =>
                      updateSignupField(
                        "employmentStatus",
                        value
                      )
                    }
                    options={[
                      {
                        value: "STUDENT",
                        label: "Student",
                      },
                      {
                        value: "EMPLOYED",
                        label: "Employed",
                      },
                      {
                        value: "SELF_EMPLOYED",
                        label: "Self Employed",
                      },
                      {
                        value: "FREELANCER",
                        label: "Freelancer",
                      },
                      {
                        value: "JOB_SEEKER",
                        label: "Job Seeker",
                      },
                      {
                        value: "OTHER",
                        label: "Other",
                      },
                    ]}
                  />

                  <InputField
                    label="Company"
                    value={signupForm.company}
                    onChange={(value) =>
                      updateSignupField("company", value)
                    }
                    placeholder="Company name"
                  />

                  <InputField
                    label="Designation"
                    value={signupForm.designation}
                    onChange={(value) =>
                      updateSignupField("designation", value)
                    }
                    placeholder="Software Developer"
                  />

                  <SelectField
                    label="Experience"
                    value={signupForm.experience}
                    onChange={(value) =>
                      updateSignupField("experience", value)
                    }
                    options={[
                      {
                        value: "0",
                        label: "Fresher / No experience",
                      },
                      {
                        value: "0-1",
                        label: "Less than 1 year",
                      },
                      {
                        value: "1-3",
                        label: "1 - 3 years",
                      },
                      {
                        value: "3-5",
                        label: "3 - 5 years",
                      },
                      {
                        value: "5-10",
                        label: "5 - 10 years",
                      },
                      {
                        value: "10+",
                        label: "10+ years",
                      },
                    ]}
                  />
                </FormSection>

                {/* =================================================== */}
                {/* ACCOUNT */}
                {/* =================================================== */}

                <FormSection
                  icon={<LockKeyhole size={18} />}
                  title="Account Security"
                  description="Set your password for the Codelaunch platform."
                >
                  <PasswordField
                    label="Password"
                    value={signupForm.password}
                    onChange={(value) =>
                      updateSignupField("password", value)
                    }
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    placeholder="Create a password"
                  />

                  <PasswordField
                    label="Confirm Password"
                    value={signupForm.confirmPassword}
                    onChange={(value) =>
                      updateSignupField(
                        "confirmPassword",
                        value
                      )
                    }
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    placeholder="Confirm your password"
                  />

                  <div className="sm:col-span-2">
                    <p className="text-xs leading-5 text-white/25">
                      Password must contain at least 8 characters.
                    </p>
                  </div>
                </FormSection>

                {/* ERROR */}
                {error && (
                  <div className="mt-6">
                    <ErrorMessage message={error} />
                  </div>
                )}

                {/* SUBMIT */}
                <div className="mt-7">
                  <SubmitButton
                    loading={loading}
                    label="Create Account"
                    loadingLabel="Creating account..."
                  />
                </div>

                <p className="mt-4 text-center text-xs leading-5 text-white/25">
                  By creating an account, you agree to provide accurate
                  information and use the Codelaunch platform responsibly.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* FORM SECTION */
/* ========================================================================== */

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-5 flex items-start gap-3 border-b border-white/10 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

/* ========================================================================== */
/* INPUT */
/* ========================================================================== */

function InputField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
}: {
  label: string;
  icon?: React.ReactNode;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}

        {required && (
          <span className="ml-1 text-white/35">*</span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 ${
            icon ? "pl-11" : "px-4"
          } pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.06]`}
        />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* TEXTAREA */
/* ========================================================================== */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.06]"
      />
    </div>
  );
}

/* ========================================================================== */
/* SELECT */
/* ========================================================================== */

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}

        {required && (
          <span className="ml-1 text-white/35">*</span>
        )}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f1528] px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-white/30"
        >
          <option value="" className="bg-[#0f1528]">
            Select {label.toLowerCase()}
          </option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#0f1528]"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
        />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* PASSWORD */
/* ========================================================================== */

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
        />

        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || "••••••••"}
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.06]"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* ERROR */
/* ========================================================================== */

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}

/* ========================================================================== */
/* SUBMIT */
/* ========================================================================== */

function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? loadingLabel : label}

      {!loading && (
        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-1"
        />
      )}
    </button>
  );
}