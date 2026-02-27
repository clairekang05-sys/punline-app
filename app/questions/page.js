"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../lib/firebase"; // 기존 Firebase 설정 불러오기
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

const CRIMSON = "#A00034";

const QUESTIONS = [
  {
    id: "music",
    type: "single",
    title: "1. 노래 취향은?",
    options: ["힙합", "R&B", "케이팝", "락", "발라드", "인디"],
  },
  {
    id: "mbti",
    type: "text",
    title: "2. MBTI는?",
    hint: "대문자 4개로 적어주세요 (예: ENFP)",
    placeholder: "예: ENFP",
  },
  {
    id: "event",
    type: "single",
    title: "3. 올해 가장 기대되는 교내 행사는?",
    options: ["합동응원전", "중짜", "MT", "석탑대동제(입실렌티)", "고연전"],
  },
  {
    id: "food",
    type: "single",
    title: "4. 좋아하는 음식은?",
    options: ["한식", "중식", "일식", "양식", "분식", "다 잘 먹어요"],
  },
  {
    id: "drink",
    type: "single",
    title: "5. 주량은?",
    options: ["반 병", "한 병", "한 병 반", "두 병", "두 병 이상"],
  },
  {
    id: "ipsel",
    type: "text",
    title: "6. 올해 입실렌티에 가장 왔으면 좋겠는 아티스트는?",
    hint: "이름만 말해주세요",
    placeholder: "예: 아이유",
  },
  {
    id: "movie",
    type: "text",
    title: "7. 제일 좋아하는 영화/드라마는?",
    hint: "제목만 말해주세요",
    placeholder: "예: 인터스텔라",
  },
  {
    id: "kkaet",
    type: "binary",
    title: "8. 뻔선/뻔후가 다른 학우의 깻잎을 떼어줘도 된다?",
    options: ["된다", "안된다"],
    withReason: true,
    reasonRequired: true,
    reasonHint: "40자 내외로 적어주세요",
    reasonPlaceholder: "예: 질투나요💢",
    reasonMaxLen: 40,
  },
  {
    id: "murmur",
    type: "binary",
    title: "9. 뻔선/뻔후가 다른 학우와 무르무르에 가면?",
    options: ["신경이 쓰인다", "안 쓰인다"],
    withReason: true,
    reasonRequired: true,
    reasonHint: "40자 내외로 적어주세요",
    reasonPlaceholder: "예: 첫 무르무르는 뻔선이랑 가야죠🥹",
    reasonMaxLen: 40,
  },
  {
    id: "msg",
    type: "textLong",
    title: "10. 서로에게 하고 싶은 한마디",
    hint: "40자 내외로 적어주세요",
    placeholder: "예: 앞으로 잘부탁드립니다😃",
    maxLen: 40,
  },
];

// 1. 실제 로직이 담긴 내부 컴포넌트
function QuestionsInner() {
  const searchParams = useSearchParams();

  const s = searchParams.get("s") || "";
  const j = searchParams.get("j") || "";
  const role = searchParams.get("role") || "";

  useEffect(() => {
    if (!s || !j || !role) {
      window.location.href = "/enter";
    }
  }, [s, j, role]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[step];
  const progressText = useMemo(() => `${step + 1} / ${QUESTIONS.length}`, [step]);
  const currentValue = answers?.[q.id]?.value ?? "";
  const currentReason = answers?.[q.id]?.reason ?? "";

  const canNext = useMemo(() => {
    const v = String(currentValue ?? "").trim();
    const r = String(currentReason ?? "").trim();

    if (q.type === "single" || q.type === "binary") {
      if (!v) return false;
      if (q.withReason && q.reasonRequired) {
        if (!r) return false;
        if (q.reasonMaxLen && r.length > q.reasonMaxLen) return false;
      }
      return true;
    }
    if (q.type === "text" || q.type === "textLong") return v.length > 0;
    return false;
  }, [q, currentValue, currentReason]);

  const setValue = (val) => {
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...(prev[q.id] || {}), value: val },
    }));
  };

  const setReason = (val) => {
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...(prev[q.id] || {}), reason: val },
    }));
  };

  const goPrev = () => {
    if (step === 0) return;
    setStep((x) => x - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    if (step < QUESTIONS.length - 1) setStep((x) => x + 1);
  };

  // ✅ [수정완료] 기존의 Firebase 저장 로직을 그대로 가져왔습니다.
  const onFinish = async () => {
    if (!s || !j || !role) {
      alert("라인 정보가 없습니다. /enter부터 다시 접속해주세요.");
      window.location.href = "/enter";
      return;
    }

    const docId = `${s}_${j}`;

    try {
      await setDoc(
        doc(db, "lines", docId),
        {
          s,
          j,
          updatedAt: serverTimestamp(),
          [role]: {
            answers,
            submittedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      window.location.href = `/wait?s=${encodeURIComponent(s)}&j=${encodeURIComponent(j)}&role=${encodeURIComponent(role)}`;
    } catch (e) {
      console.error(e);
      alert("저장 실패! 콘솔 확인해줘.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: CRIMSON }}>
              🐯 질문 {progressText}
            </h1>
            <div className="mt-2 h-1 w-12 rounded-full" style={{ background: CRIMSON }} />
            <p className="mt-2 text-xs text-gray-500">
              라인: {s}/{j} · 내 역할: {role === "senior" ? "선배" : "후배"}
            </p>
            <p className="mt-3 text-xs text-gray-500">한 문제씩 넘어가요. 제출 후에는 수정 불가(예정).</p>
          </div>
          <div className="text-xs text-gray-400">{progressText}</div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-base font-bold text-gray-900">{q.title}</div>
          {"hint" in q ? <div className="mt-2 text-xs text-gray-500">{q.hint}</div> : null}

          {(q.type === "single" || q.type === "binary") && (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {q.options.map((opt) => {
                const selected = currentValue === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue(opt)}
                    className="w-full rounded-xl border p-3 text-left text-sm font-semibold"
                    style={{
                      borderColor: selected ? CRIMSON : "#D1D5DB",
                      color: selected ? CRIMSON : "#111827",
                      background: selected ? "#FFF5F7" : "white",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.withReason && (
            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-gray-700">이유</div>
              <input
                value={currentReason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={q.reasonPlaceholder}
                className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-gray-400"
              />
              <div className="mt-1 text-xs text-gray-400">{q.reasonHint}</div>
            </div>
          )}

          {q.type === "text" && (
            <div className="mt-4">
              <input
                value={currentValue}
                onChange={(e) => setValue(e.target.value)}
                placeholder={q.placeholder}
                className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
          )}

          {q.type === "textLong" && (
            <div className="mt-4">
              <textarea
                value={currentValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (q.maxLen && v.length > q.maxLen) return;
                  setValue(v);
                }}
                placeholder={q.placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-gray-400"
              />
              <div className="mt-1 text-xs text-gray-400">
                {String(currentValue).length} / {q.maxLen}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="flex-1 rounded-xl border border-gray-300 p-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            이전
          </button>

          {step < QUESTIONS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className="flex-1 rounded-xl p-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: CRIMSON }}
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              disabled={!canNext}
              className="flex-1 rounded-xl p-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: CRIMSON }}
            >
              결과지 확인하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Vercel 배포 오류를 방지하기 위해 Suspense로 감싸는 부모 컴포넌트
export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-700">페이지 준비 중…</div>
          </div>
        </div>
      }
    >
      <QuestionsInner />
    </Suspense>
  );
}