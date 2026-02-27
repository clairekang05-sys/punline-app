"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CRIMSON = "#A00034";

export default function WaitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const s = searchParams.get("s") || "";
  const j = searchParams.get("j") || "";
  const role = searchParams.get("role") || ""; // "senior" | "junior"

  // 상태: checking -> waiting -> ready / error
  const [status, setStatus] = useState("checking");
  const [errMsg, setErrMsg] = useState("");

  // 누가 완료했는지(문구 정확히 찍기용)
  const [seniorDone, setSeniorDone] = useState(false);
  const [juniorDone, setJuniorDone] = useState(false);

  // ✅ Firestore 문서 id: lines/{s}_{j}
  const lineDocId = useMemo(() => {
    if (!s || !j) return "";
    return `${s}_${j}`;
  }, [s, j]);

  // 파라미터 없으면 enter로
  useEffect(() => {
    if (!s || !j || !role) router.replace("/enter");
  }, [s, j, role, router]);

  // 문서 실시간 구독
  useEffect(() => {
    if (!lineDocId) return;

    setStatus("checking");
    setErrMsg("");

    const ref = doc(db, "lines", lineDocId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setSeniorDone(false);
          setJuniorDone(false);
          setStatus("waiting");
          return;
        }

        const data = snap.data() || {};

        // ✅ 너 DB 구조: data.senior.answers / data.junior.answers
        const sDone = !!data?.senior?.answers;
        const jDone = !!data?.junior?.answers;

        setSeniorDone(sDone);
        setJuniorDone(jDone);

        if (sDone && jDone) {
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

  const waitingText = useMemo(() => {
    // 둘 다 아직이면(혹은 판단 불가)
    if (!seniorDone && !juniorDone) return "응답을 기다리는 중 🐯";

    // 한쪽만 완료면: 미완료 쪽을 기다림
    if (!seniorDone) return "선배 응답 기다리는 중 🐯";
    if (!juniorDone) return "후배 응답 기다리는 중 🐯";

    return "결과지로 이동 중…";
  }, [seniorDone, juniorDone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold" style={{ color: CRIMSON }}>
          🐯 기다리는 중...
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full" style={{ background: CRIMSON }} />

        <p className="mt-4 text-sm text-gray-700">
          {status === "checking" && "응답 여부를 확인 중이에요…"}
          {status === "waiting" && waitingText}
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