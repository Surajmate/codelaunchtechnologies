import AnalyticsClient from "./AnalyticsClient";

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Analytics
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Platform Analytics
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Monitor platform usage, learning activity,
          quizzes, and integrations.
        </p>
      </div>

      <div className="mt-8">
        <AnalyticsClient />
      </div>
    </div>
  );
}