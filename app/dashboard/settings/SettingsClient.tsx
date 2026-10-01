"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Shield,
  Bell,
  Palette,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Section =
  | "profile"
  | "education"
  | "security"
  | "notifications"
  | "appearance"
  | "account";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface EducationData {
  qualification: string;
  course: string;
  specialization: string;
  college: string;
  university: string;
  graduationYear: string;
  status: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationData {
  courseUpdates: boolean;
  assignmentUpdates: boolean;
  certificateUpdates: boolean;
  announcements: boolean;
  emailNotifications: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  approvalStatus?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function SettingsClient() {
  const [activeSection, setActiveSection] =
    useState<Section>("profile");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);
  const [savingNotifications, setSavingNotifications] =
    useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [userInfo, setUserInfo] =
    useState<UserInfo | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [education, setEducation] =
    useState<EducationData>({
      qualification: "",
      course: "",
      specialization: "",
      college: "",
      university: "",
      graduationYear: "",
      status: "",
    });

  const [password, setPassword] =
    useState<PasswordData>({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [notifications, setNotifications] =
    useState<NotificationData>({
      courseUpdates: true,
      assignmentUpdates: true,
      certificateUpdates: true,
      announcements: true,
      emailNotifications: true,
    });

  const [theme, setTheme] = useState("dark");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const navigation = [
    {
      id: "profile" as Section,
      label: "Profile",
      description: "Personal information",
      icon: User,
    },
    {
      id: "education" as Section,
      label: "Education",
      description: "Education details",
      icon: GraduationCap,
    },
    {
      id: "security" as Section,
      label: "Security",
      description: "Password & security",
      icon: Shield,
    },
    {
      id: "notifications" as Section,
      label: "Notifications",
      description: "Notification preferences",
      icon: Bell,
    },
    {
      id: "appearance" as Section,
      label: "Appearance",
      description: "Theme preferences",
      icon: Palette,
    },
    {
      id: "account" as Section,
      label: "Account",
      description: "Account management",
      icon: User,
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      clearMessages();

      const [profileResponse, preferencesResponse] =
        await Promise.all([
          fetch("/api/user/profile", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/user/preferences", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      if (
        profileResponse.status === 401 ||
        preferencesResponse.status === 401
      ) {
        window.location.href = "/";

        return;
      }

      const profileData =
        await profileResponse.json();

      const preferencesData =
        await preferencesResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message ||
            "Unable to load your profile."
        );
      }

      if (!preferencesResponse.ok) {
        throw new Error(
          preferencesData.message ||
            "Unable to load your preferences."
        );
      }

      const user = profileData.user;

      setUserInfo({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        approvalStatus:
          user.approvalStatus || "PENDING",
        isActive: user.isActive,
        createdAt: user.createdAt,
      });

      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        alternatePhone:
          user.alternatePhone || "",
        dateOfBirth:
          user.dateOfBirth || "",
        gender: user.gender || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country:
          user.country || "India",
        pincode: user.pincode || "",
      });

      setEducation({
        qualification:
          user.education?.qualification || "",
        course:
          user.education?.course || "",
        specialization:
          user.education?.specialization || "",
        college:
          user.education?.college || "",
        university:
          user.education?.university || "",
        graduationYear:
          user.education?.graduationYear || "",
        status:
          user.education?.status || "",
      });

      setNotifications({
        courseUpdates:
          preferencesData.preferences
            ?.courseUpdates ?? true,
        assignmentUpdates:
          preferencesData.preferences
            ?.assignmentUpdates ?? true,
        certificateUpdates:
          preferencesData.preferences
            ?.certificateUpdates ?? true,
        announcements:
          preferencesData.preferences
            ?.announcements ?? true,
        emailNotifications:
          preferencesData.preferences
            ?.emailNotifications ?? true,
      });
    } catch (error) {
      console.error(
        "Load settings error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSavingProfile(true);
      clearMessages();

      const response = await fetch(
        "/api/user/profile",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone,
            alternatePhone:
              profile.alternatePhone,
            dateOfBirth:
              profile.dateOfBirth,
            gender: profile.gender,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            country: profile.country,
            pincode: profile.pincode,

            qualification:
              education.qualification,
            course: education.course,
            specialization:
              education.specialization,
            college: education.college,
            university:
              education.university,
            graduationYear:
              education.graduationYear,
            educationStatus:
              education.status,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update profile."
        );
      }

      if (data.user) {
        setUserInfo((previous) =>
          previous
            ? {
                ...previous,
                name: data.user.name,
                email: data.user.email,
              }
            : previous
        );
      }

      setSuccessMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async () => {
    try {
      clearMessages();

      if (!password.currentPassword) {
        setErrorMessage(
          "Please enter your current password."
        );
        return;
      }

      if (password.newPassword.length < 8) {
        setErrorMessage(
          "New password must contain at least 8 characters."
        );
        return;
      }

      if (
        password.newPassword !==
        password.confirmPassword
      ) {
        setErrorMessage(
          "New password and confirmation do not match."
        );
        return;
      }

      if (
        password.currentPassword ===
        password.newPassword
      ) {
        setErrorMessage(
          "New password must be different from your current password."
        );
        return;
      }

      setSavingPassword(true);

      const response = await fetch(
        "/api/user/password",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(password),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update password."
        );
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMessage(
        "Password updated successfully."
      );
    } catch (error) {
      console.error(
        "Update password error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const updateNotifications = async () => {
    try {
      setSavingNotifications(true);
      clearMessages();

      const response = await fetch(
        "/api/user/preferences",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notifications),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update notification preferences."
        );
      }

      setSuccessMessage(
        "Notification preferences updated successfully."
      );
    } catch (error) {
      console.error(
        "Update notifications error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update notification preferences."
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      clearMessages();

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message || "Unable to logout."
        );
      }

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setLoggingOut(false);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to logout."
      );
    }
  };

  const handleProfileChange = (
    field: keyof ProfileData,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEducationChange = (
    field: keyof EducationData,
    value: string
  ) => {
    setEducation((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handlePasswordChange = (
    field: keyof PasswordData,
    value: string
  ) => {
    setPassword((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleNotification = (
    field: keyof NotificationData
  ) => {
    setNotifications((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050812] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={30}
            className="animate-spin text-white/60"
          />

          <p className="text-sm text-white/40">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Manage your profile, security and
                preferences.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white sm:w-auto"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Messages */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-300">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Navigation */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#0a0f1d] p-2 lg:sticky lg:top-6">
            <div className="mb-2 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
                Settings
              </p>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active =
                  activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setActiveSection(item.id);
                    }}
                    className={`flex min-w-[150px] shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:w-full ${
                      active
                        ? "bg-white text-black"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-black"
                          : "text-white/40"
                      }
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {item.label}
                      </p>

                      <p
                        className={`mt-0.5 hidden truncate text-xs lg:block ${
                          active
                            ? "text-black/50"
                            : "text-white/30"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* PROFILE */}
            {activeSection === "profile" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<User size={20} />}
                  title="Profile Information"
                  description="Update your personal and contact information."
                />

                <Card>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white text-2xl font-bold text-black">
                        {userInfo?.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(
                            profile.name
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        disabled
                        title="Profile photo upload will be added later"
                        className="absolute bottom-0 right-0 flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border-4 border-[#0a0f1d] bg-white text-black opacity-60"
                      >
                        <Camera size={14} />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        Profile Photo
                      </h3>

                      <p className="mt-1 text-sm text-white/35">
                        JPG, PNG or WebP. Maximum 2MB.
                      </p>

                      <button
                        type="button"
                        disabled
                        className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/30"
                      >
                        Upload Photo
                      </button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Full Name"
                      value={profile.name}
                      onChange={(value) =>
                        handleProfileChange(
                          "name",
                          value
                        )
                      }
                      icon={<User size={16} />}
                    />

                    <Input
                      label="Email Address"
                      value={profile.email}
                      disabled
                      icon={<Mail size={16} />}
                      helper="Email cannot be changed here."
                    />

                    <Input
                      label="Phone Number"
                      value={profile.phone}
                      onChange={(value) =>
                        handleProfileChange(
                          "phone",
                          value
                        )
                      }
                      placeholder="+91 XXXXX XXXXX"
                      icon={<Phone size={16} />}
                    />

                    <Input
                      label="Alternate Phone"
                      value={
                        profile.alternatePhone
                      }
                      onChange={(value) =>
                        handleProfileChange(
                          "alternatePhone",
                          value
                        )
                      }
                      placeholder="+91 XXXXX XXXXX"
                      icon={<Phone size={16} />}
                    />

                    <Input
                      label="Date of Birth"
                      type="date"
                      value={
                        profile.dateOfBirth
                      }
                      onChange={(value) =>
                        handleProfileChange(
                          "dateOfBirth",
                          value
                        )
                      }
                    />

                    <Select
                      label="Gender"
                      value={profile.gender}
                      onChange={(value) =>
                        handleProfileChange(
                          "gender",
                          value
                        )
                      }
                      options={[
                        ["", "Select gender"],
                        ["male", "Male"],
                        ["female", "Female"],
                        ["other", "Other"],
                        [
                          "prefer-not",
                          "Prefer not to say",
                        ],
                      ]}
                    />
                  </div>
                </Card>

                <Card>
                  <div className="mb-5">
                    <h3 className="font-semibold">
                      Address
                    </h3>

                    <p className="mt-1 text-sm text-white/35">
                      Your current contact address.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input
                        label="Address"
                        value={profile.address}
                        onChange={(value) =>
                          handleProfileChange(
                            "address",
                            value
                          )
                        }
                        placeholder="House / Street / Area"
                        icon={<MapPin size={16} />}
                      />
                    </div>

                    <Input
                      label="City"
                      value={profile.city}
                      onChange={(value) =>
                        handleProfileChange(
                          "city",
                          value
                        )
                      }
                    />

                    <Input
                      label="State"
                      value={profile.state}
                      onChange={(value) =>
                        handleProfileChange(
                          "state",
                          value
                        )
                      }
                    />

                    <Input
                      label="Country"
                      value={profile.country}
                      onChange={(value) =>
                        handleProfileChange(
                          "country",
                          value
                        )
                      }
                    />

                    <Input
                      label="Pincode"
                      value={profile.pincode}
                      onChange={(value) =>
                        handleProfileChange(
                          "pincode",
                          value
                        )
                      }
                    />
                  </div>
                </Card>

                <SaveButton
                  label="Save Profile"
                  loading={savingProfile}
                  onClick={updateProfile}
                />
              </section>
            )}

            {/* EDUCATION */}
            {activeSection === "education" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<GraduationCap size={20} />}
                  title="Education"
                  description="Keep your educational information up to date."
                />

                <Card>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Select
                      label="Highest Qualification"
                      value={
                        education.qualification
                      }
                      onChange={(value) =>
                        handleEducationChange(
                          "qualification",
                          value
                        )
                      }
                      options={[
                        [
                          "",
                          "Select qualification",
                        ],
                        ["10th", "10th"],
                        ["12th", "12th"],
                        ["diploma", "Diploma"],
                        [
                          "graduate",
                          "Graduate",
                        ],
                        [
                          "postgraduate",
                          "Post Graduate",
                        ],
                        ["phd", "PhD"],
                        ["other", "Other"],
                      ]}
                    />

                    <Input
                      label="Course / Degree"
                      value={education.course}
                      onChange={(value) =>
                        handleEducationChange(
                          "course",
                          value
                        )
                      }
                      placeholder="e.g. B.E. Computer Engineering"
                    />

                    <Input
                      label="Specialization"
                      value={
                        education.specialization
                      }
                      onChange={(value) =>
                        handleEducationChange(
                          "specialization",
                          value
                        )
                      }
                      placeholder="e.g. Computer Science"
                    />

                    <Input
                      label="College / Institute"
                      value={education.college}
                      onChange={(value) =>
                        handleEducationChange(
                          "college",
                          value
                        )
                      }
                    />

                    <Input
                      label="University / Board"
                      value={
                        education.university
                      }
                      onChange={(value) =>
                        handleEducationChange(
                          "university",
                          value
                        )
                      }
                    />

                    <Input
                      label="Graduation Year"
                      value={
                        education.graduationYear
                      }
                      onChange={(value) =>
                        handleEducationChange(
                          "graduationYear",
                          value
                        )
                      }
                      placeholder="2026"
                    />

                    <Select
                      label="Education Status"
                      value={education.status}
                      onChange={(value) =>
                        handleEducationChange(
                          "status",
                          value
                        )
                      }
                      options={[
                        ["", "Select status"],
                        [
                          "pursuing",
                          "Currently Pursuing",
                        ],
                        [
                          "completed",
                          "Completed",
                        ],
                        [
                          "discontinued",
                          "Discontinued",
                        ],
                      ]}
                    />
                  </div>
                </Card>

                <SaveButton
                  label="Save Education"
                  loading={savingProfile}
                  onClick={updateProfile}
                />
              </section>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<Shield size={20} />}
                  title="Security"
                  description="Protect your account with a strong password."
                />

                <Card>
                  <div className="mb-6">
                    <h3 className="font-semibold">
                      Change Password
                    </h3>

                    <p className="mt-1 text-sm text-white/35">
                      Use a password that is at least
                      8 characters long.
                    </p>
                  </div>

                  <div className="max-w-xl space-y-5">
                    <PasswordInput
                      label="Current Password"
                      value={
                        password.currentPassword
                      }
                      show={showCurrentPassword}
                      onToggle={() =>
                        setShowCurrentPassword(
                          !showCurrentPassword
                        )
                      }
                      onChange={(value) =>
                        handlePasswordChange(
                          "currentPassword",
                          value
                        )
                      }
                    />

                    <PasswordInput
                      label="New Password"
                      value={
                        password.newPassword
                      }
                      show={showNewPassword}
                      onToggle={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                      onChange={(value) =>
                        handlePasswordChange(
                          "newPassword",
                          value
                        )
                      }
                    />

                    <PasswordInput
                      label="Confirm New Password"
                      value={
                        password.confirmPassword
                      }
                      show={
                        showConfirmPassword
                      }
                      onToggle={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      onChange={(value) =>
                        handlePasswordChange(
                          "confirmPassword",
                          value
                        )
                      }
                    />
                  </div>
                </Card>

                <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-5">
                  <div className="flex gap-3">
                    <Lock
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-300"
                    />

                    <div>
                      <p className="text-sm font-medium text-amber-200">
                        Password security
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white/40">
                        Never share your password with
                        anyone. Codelaunch support will
                        never ask for your password.
                      </p>
                    </div>
                  </div>
                </div>

                <SaveButton
                  label="Update Password"
                  loading={savingPassword}
                  onClick={updatePassword}
                />
              </section>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<Bell size={20} />}
                  title="Notifications"
                  description="Choose which updates you want to receive."
                />

                <Card>
                  <div className="divide-y divide-white/[0.06]">
                    <NotificationRow
                      title="Course Updates"
                      description="Get notified about course content, lessons and updates."
                      enabled={
                        notifications.courseUpdates
                      }
                      onToggle={() =>
                        toggleNotification(
                          "courseUpdates"
                        )
                      }
                    />

                    <NotificationRow
                      title="Assignment Updates"
                      description="Receive notifications about assignments and assessments."
                      enabled={
                        notifications.assignmentUpdates
                      }
                      onToggle={() =>
                        toggleNotification(
                          "assignmentUpdates"
                        )
                      }
                    />

                    <NotificationRow
                      title="Certificate Updates"
                      description="Get notified about certificate eligibility and issuance."
                      enabled={
                        notifications.certificateUpdates
                      }
                      onToggle={() =>
                        toggleNotification(
                          "certificateUpdates"
                        )
                      }
                    />

                    <NotificationRow
                      title="Platform Announcements"
                      description="Important news and announcements from Codelaunch."
                      enabled={
                        notifications.announcements
                      }
                      onToggle={() =>
                        toggleNotification(
                          "announcements"
                        )
                      }
                    />

                    <NotificationRow
                      title="Email Notifications"
                      description="Receive important account notifications by email."
                      enabled={
                        notifications.emailNotifications
                      }
                      onToggle={() =>
                        toggleNotification(
                          "emailNotifications"
                        )
                      }
                    />
                  </div>
                </Card>

                <SaveButton
                  label="Save Preferences"
                  loading={
                    savingNotifications
                  }
                  onClick={updateNotifications}
                />
              </section>
            )}

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<Palette size={20} />}
                  title="Appearance"
                  description="Customize how Codelaunch looks for you."
                />

                <Card>
                  <h3 className="font-semibold">
                    Theme
                  </h3>

                  <p className="mt-1 text-sm text-white/35">
                    Select your preferred appearance.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      [
                        "dark",
                        "Dark",
                        "Recommended",
                      ],
                      [
                        "light",
                        "Light",
                        "Coming soon",
                      ],
                      [
                        "system",
                        "System",
                        "Follow device",
                      ],
                    ].map(
                      ([
                        value,
                        label,
                        description,
                      ]) => {
                        const active =
                          theme === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={
                              value !== "dark"
                            }
                            onClick={() =>
                              setTheme(value)
                            }
                            className={`rounded-xl border p-4 text-left transition ${
                              active
                                ? "border-white bg-white/[0.08]"
                                : "border-white/10 bg-white/[0.02]"
                            } ${
                              value !== "dark"
                                ? "cursor-not-allowed opacity-40"
                                : "hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="mb-4 h-20 rounded-lg border border-white/10 bg-[#050812]" />

                            <p className="text-sm font-semibold">
                              {label}
                            </p>

                            <p className="mt-1 text-xs text-white/30">
                              {description}
                            </p>
                          </button>
                        );
                      }
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <section className="space-y-6">
                <SectionHeader
                  icon={<User size={20} />}
                  title="Account"
                  description="Manage your Codelaunch account."
                />

                <Card>
                  <div className="space-y-5">
                    <InfoRow
                      label="Account Status"
                      value={
                        userInfo?.isActive
                          ? "Active"
                          : "Disabled"
                      }
                      status={
                        !!userInfo?.isActive
                      }
                    />

                    <InfoRow
                      label="Account Type"
                      value={
                        userInfo?.role ||
                        "USER"
                      }
                    />

                    <InfoRow
                      label="Approval Status"
                      value={
                        userInfo?.approvalStatus ||
                        "PENDING"
                      }
                    />

                    <InfoRow
                      label="Email"
                      value={profile.email}
                    />

                    <InfoRow
                      label="Member Since"
                      value={formatDate(
                        userInfo?.createdAt
                      )}
                    />
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold">
                    Sign Out
                  </h3>

                  <p className="mt-1 text-sm text-white/35">
                    Sign out from your current Codelaunch
                    session.
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loggingOut ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <LogOut size={17} />
                    )}

                    {loggingOut
                      ? "Signing out..."
                      : "Sign Out"}
                  </button>
                </Card>

                <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-5">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-300"
                    />

                    <div>
                      <h3 className="text-sm font-semibold text-red-200">
                        Danger Zone
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-white/35">
                        Account deactivation is currently
                        managed by the Codelaunch
                        administration team.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70">
        {icon}
      </div>

      <div>
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-white/35">
          {description}
        </p>
      </div>
    </div>
  );
}

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0f1d] p-5 sm:p-6">
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  icon,
  helper,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/60">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(event.target.value)
          }
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05] ${
            icon ? "pl-10" : ""
          } ${
            disabled
              ? "cursor-not-allowed opacity-45"
              : ""
          }`}
        />
      </div>

      {helper && (
        <p className="mt-1.5 text-xs text-white/25">
          {helper}
        </p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/60">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-[#0a0f1d] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
      >
        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
              className="bg-[#0a0f1d]"
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  show,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/60">
        {label}
      </label>

      <div className="relative">
        <Lock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
        />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-11 text-sm text-white outline-none transition focus:border-white/25"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
        >
          {show ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-sm leading-5 text-white/35">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-white"
            : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            enabled
              ? "left-6 bg-black"
              : "left-1 bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}

function InfoRow({
  label,
  value,
  status = false,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-white/35">
        {label}
      </span>

      {status ? (
        <span className="flex items-center gap-2 text-sm text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {value}
        </span>
      ) : (
        <span className="break-all text-sm text-white/70">
          {value}
        </span>
      )}
    </div>
  );
}

function SaveButton({
  onClick,
  label,
  loading,
}: {
  onClick: () => void;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Save size={16} />
        )}

        {loading ? "Saving..." : label}
      </button>
    </div>
  );
}

function getInitials(name: string) {
  if (!name.trim()) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .slice(0, 2);

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  } catch {
    return "Not available";
  }
}