import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "Courses | Codelaunch Technologies",
  description:
    "Explore courses and continue your learning journey.",
};

export default function CoursesPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Learning
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Courses
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Explore our courses, build practical skills,
            and continue learning at your own pace.
          </p>
        </div>

        {/* ==================================================
            COURSE CATALOGUE
        ================================================== */}

        <div className="mt-8">
          <CoursesClient />
        </div>
      </div>
    </main>
  );
}