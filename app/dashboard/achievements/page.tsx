import AchievementsClient from "./AchievementsClient";

export default function AchievementsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Dashboard
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Achievements
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
          Track your learning milestones, unlock achievements,
          and build your developer profile as you progress.
        </p>
      </div>

      <div className="mt-8">
        <AchievementsClient />
      </div>
    </div>
  );
}