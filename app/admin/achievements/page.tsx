import AchievementsClient from "./AchievementsClient";

export default function AdminAchievementsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Achievements
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Achievement Center
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Manage student achievements, progress,
          completion status, and achievement assignments.
        </p>
      </div>

      {/* Achievement Management */}
      <div className="mt-8">
        <AchievementsClient />
      </div>
    </div>
  );
}