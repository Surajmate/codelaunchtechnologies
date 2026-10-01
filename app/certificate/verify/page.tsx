import { Suspense } from "react";
import VerifyCertificateClient from "./VerifyCertificateClient";

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#05070f] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-slate-400">
              Loading certificate verification...
            </p>
          </div>
        </main>
      }
    >
      <VerifyCertificateClient />
    </Suspense>
  );
}