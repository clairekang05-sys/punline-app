"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/enter");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-sm text-gray-500">입장 페이지로 이동 중…</div>
    </div>
  );
}