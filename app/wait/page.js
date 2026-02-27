"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const dynamic = "force-dynamic";

const CRIMSON = "#A00034";

function WaitInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const s = sp.get("s") || "";
  const j = sp.get("j") || "";
  const role = sp.get("role") || ""; // "senior" | "junior"

  // 상태: checking -> waiting -> ready / error
  const [status, setStatus] = useState("checking");
  const [errMsg, setErrMsg] = useState("");

  const lineDocId = useMemo(() => {
    if (!s || !j) return "";
    return `${s}_${j}`;
  }, [s, j]);

  // 파라미터 없으면 enter로
  useEffect(() => {
    if (!s || !j || !role) {
      router.replace("/enter");
    }
  }, [s, j, role, router]);

  useEffect(() => {
    if (!lineDocId) return;

    setStatus("checking");
    setErrMsg("");

    const ref = doc(db, "lines", lineDocId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setStatus("waiting");
          return;
        }

        const data = snap.data() || {};
        const seniorDone = !!data?.senior?.answers;
        const juniorDone = !!data?.junior?.answers;

        if (seniorDone && juniorDone) {
          setStatus("ready");
          const qs = new URLSearchParams({ s, j, role }).toString();
          router.replace(`/result?${qs}`);
        } else {
          setStatus("waiting");
        }
      },
      (e) => {
        console.error(e);
        setErrMsg(e?.message || "알 수 없는 오류");
        setStatus("error");
      }
    );

    return () => unsub();
  }, [lineDocId, router, s, j, role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold" style={{ color: CRIMSON }}>
          🐯 기다리는 중...
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full" style={{ background: CRIMSON }} />

        <p className="mt-4 text-sm text-gray-700">
          {status === "checking" && "응답 여부를 확인 중이에요…"}

          {status === "waiting" && (
            <>
              {role === "senior"
                ? "후배 응답 기다리는 중 🐯"
                : "선배 응답 기다리는 중 🐯"}
            </>
          )}

          {status === "error" && `오류가 발생했어요. 새로고침 해주세요. (${errMsg})`}
          {status === "ready" && "결과지로 이동 중…"}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          라인: {s}/{j} · 내 역할: {role === "senior" ? "선배" : "후배"}
        </p>

        <button
          type="button"
          className="mt-6 w-full rounded-xl p-3 text-sm font-semibold text-white"
          style={{ background: CRIMSON }}
          onClick={() => router.replace("/enter")}
        >
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function WaitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-700">대기 페이지 불러오는 중…</div>
          </div>
        </div>
      }
    >
      <WaitInner />
    </Suspense>
  );
}