"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CRIMSON = "#A00034";

const QUESTIONS = [
  { id: "music", title: "1. 노래 취향은?", kind: "choice" },
  { id: "mbti", title: "2. MBTI는?", kind: "text" },
  { id: "event", title: "3. 올해 가장 기대되는 교내 행사는?", kind: "choice" },
  { id: "food", title: "4. 좋아하는 음식은?", kind: "choice" },
  { id: "drink", title: "5. 주량은?", kind: "choice" },
  { id: "ipsel", title: "6. 올해 입실렌티에 가장 왔으면 좋겠는 아티스트는?", kind: "text" },
  { id: "movie", title: "7. 제일 좋아하는 영화/드라마는?", kind: "text" },
  { id: "kkaet", title: "8. 깻잎 떼어주기 된다/안된다?", kind: "binary", hasReason: true },
  { id: "murmur", title: "9. 무르무르 같이 가면 신경 쓰인다/안 쓰인다?", kind: "binary", hasReason: true },
  { id: "msg", title: "10. 서로에게 하고 싶은 한마디", kind: "long" },
];

function get(obj, path, fallback = "") {
  try {
    return path.split(".").reduce((acc, k) => acc?.[k], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function clampText(s, n = 40) {
  const t = String(s ?? "").trim();
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default function ResultPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const s = sp.get("s") || "";
  const j = sp.get("j") || "";
  const role = sp.get("role") || ""; // "senior" | "junior"

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [docData, setDocData] = useState(null);

  // ✅ 스샷 한 장 모드
  const [posterMode, setPosterMode] = useState(false);
  // ✅ 이유 펼치기 토글(문항별)
  const [openReason, setOpenReason] = useState({});

  const shareText =
    "뻔라인 중 한 분이 뻔후/뻔선과 @ku_ak7 계정을 태그하여 인스타그램 스토리로 결과지를 공유해주세요! 추첨 이벤트에 자동 응모 됩니다";

  const notices = [
    "인스타그램 스토리 공유 시, 뻔선/뻔후 + @ku_ak7 태그를 모두 포함해 주세요.",
    "뻔선-뻔후 간의 학년이 하나 이하의 격차를 가지도록 지원 부탁드립니다. (ex:24학번 뻔선 - 26학번 뻔후 응모x)",
    "비공개 계정은 추첨 확인이 어려우니 꼭 공개계정으로 업로드 해주세요.",
    "부적절한 표현/개인정보 노출(실명, 연락처 등)은 업로드 전 반드시 가려주세요.",
  ];

  const lineDocId = useMemo(() => {
    if (!s || !j) return "";
    return `${s}_${j}`;
  }, [s, j]);

  useEffect(() => {
    if (!s || !j || !role) router.replace("/enter");
  }, [s, j, role, router]);

  useEffect(() => {
    if (!lineDocId) return;
    setLoading(true);
    setErrMsg("");

    const ref = doc(db, "lines", lineDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setErrMsg("라인 데이터를 찾을 수 없어요.");
          setLoading(false);
          return;
        }

        const d = snap.data() || {};
        const seniorAns = d?.senior?.answers || null;
        const juniorAns = d?.junior?.answers || null;

        // 둘 중 하나라도 없으면 wait로
        if (!seniorAns || !juniorAns) {
          const qs = new URLSearchParams({ s, j, role }).toString();
          router.replace(`/wait?${qs}`);
          return;
        }

        setDocData(d);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErrMsg(e?.message || "알 수 없는 오류");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [lineDocId, router, s, j, role]);

  const seniorAnswers = useMemo(() => docData?.senior?.answers || {}, [docData]);
  const juniorAnswers = useMemo(() => docData?.junior?.answers || {}, [docData]);

  // ✅ “케미 점수”(같은 답 개수)
  const chemScore = useMemo(() => {
    let sameCnt = 0;
    let total = 0;

    for (const q of QUESTIONS) {
      if (q.kind === "choice" || q.kind === "binary") {
        const a = get(seniorAnswers, `${q.id}.value`, "");
        const b = get(juniorAnswers, `${q.id}.value`, "");
        if (a && b) {
          total += 1;
          if (a === b) sameCnt += 1;
        }
      }
    }

    if (total === 0) return { sameCnt: 0, total: 0, label: "미측정", emoji: "🐯" };

    const ratio = sameCnt / total;
    if (ratio >= 0.8) return { sameCnt, total, label: "완전 일심동체", emoji: "🔥" };
    if (ratio >= 0.5) return { sameCnt, total, label: "케미 안정권", emoji: "🐯" };
    return { sameCnt, total, label: "티키타카형 케미", emoji: "😈" };
  }, [seniorAnswers, juniorAnswers]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* ✅ 포스터 헤더 배너 */}
        <div
          className="p-6"
          style={{
            background: `linear-gradient(135deg, ${CRIMSON} 0%, #7a0027 60%, #3a0014 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/95 flex items-center justify-center overflow-hidden">
              <img src="/ak7_logo.jpg" alt="악칠 로고" className="h-12 w-12 object-cover" />
            </div>

            <div className="flex-1">
              <div className="text-white text-xl font-extrabold tracking-tight">🐯 뻔라인 결과지 🐯</div>
              <div className="mt-1 text-white/90 text-xs">
                LINE <span className="font-semibold">{s}/{j}</span> ·{" "}
                <span className="font-semibold">{role === "senior" ? "선배" : "후배"}</span> 기준
              </div>
            </div>
          </div>

          {/* 배지들 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {chemScore.emoji} {chemScore.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              🧷 동일 선택 {chemScore.sameCnt}/{chemScore.total}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              🎉 뻔선 ig : ___________  뻔후 ig : _____________
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* 로딩/에러 */}
          {loading ? (
            <div className="rounded-2xl border border-gray-200 p-5 text-sm text-gray-700">
              결과지를 불러오는 중…
            </div>
          ) : errMsg ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{errMsg}</div>
          ) : (
            <>
              {/* ✅ 결과 그리드: 스샷 모드면 2열로 압축 */}
              <div className={`${posterMode ? "grid grid-cols-2 gap-3" : "space-y-4"}`}>
                {QUESTIONS.map((q) => {
                  const sVal = get(seniorAnswers, `${q.id}.value`, "");
                  const jVal = get(juniorAnswers, `${q.id}.value`, "");
                  const sReason = get(seniorAnswers, `${q.id}.reason`, "");
                  const jReason = get(juniorAnswers, `${q.id}.reason`, "");

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border border-gray-200 bg-white ${posterMode ? "p-3" : "p-5"}`}
                    >
                      <div className={`font-bold text-gray-900 ${posterMode ? "text-xs" : "text-sm"}`}>
                        {q.title}
                      </div>

                      <div className={`${posterMode ? "mt-2 space-y-2" : "mt-3 space-y-3"}`}>
                        {/* 선배 */}
                        <div className="rounded-xl border border-gray-200 p-3">
                          <div className="text-[10px] font-semibold" style={{ color: CRIMSON }}>
                            선배
                          </div>
                          <div className={`${posterMode ? "text-xs" : "text-sm"} text-gray-900 mt-1`}>
                            {sVal || "—"}
                          </div>

                          {q.hasReason ? (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setOpenReason((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                                className="text-[10px] font-semibold"
                                style={{ color: CRIMSON }}
                              >
                                이유 {openReason[q.id] ? "접기" : "보기"}
                              </button>

                              {openReason[q.id] ? (
                                <div className="mt-1 text-xs text-gray-700">{sReason || "—"}</div>
                              ) : (
                                <div className="mt-1 text-[11px] text-gray-500">
                                  {clampText(sReason || "—", 18)}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* 후배 */}
                        <div className="rounded-xl border border-gray-200 p-3">
                          <div className="text-[10px] font-semibold" style={{ color: CRIMSON }}>
                            후배
                          </div>
                          <div className={`${posterMode ? "text-xs" : "text-sm"} text-gray-900 mt-1`}>
                            {jVal || "—"}
                          </div>

                          {q.hasReason ? (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenReason((prev) => ({ ...prev, [q.id + "_j"]: !prev[q.id + "_j"] }))
                                }
                                className="text-[10px] font-semibold"
                                style={{ color: CRIMSON }}
                              >
                                이유 {openReason[q.id + "_j"] ? "접기" : "보기"}
                              </button>

                              {openReason[q.id + "_j"] ? (
                                <div className="mt-1 text-xs text-gray-700">{jReason || "—"}</div>
                              ) : (
                                <div className="mt-1 text-[11px] text-gray-500">
                                  {clampText(jReason || "—", 18)}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 이벤트 안내 */}
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-sm font-bold" style={{ color: CRIMSON }}>
                  📣 스토리 인증 이벤트
                </div>
                <p className="mt-2 text-sm text-gray-700">{shareText}</p>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                    뻔뻔교 추첨 인증 이벤트 응모 방법 · 유의사항 보기
                  </summary>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                    {notices.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-gray-400">* 운영 방식은 상황에 따라 변경될 수 있어요.</p>
                </details>
              </div>

              {/* ✅ 버튼: 하단 */}
              <div className="mt-5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPosterMode((p) => !p)}
                    className="flex-1 rounded-xl p-3 text-sm font-semibold text-white"
                    style={{ background: CRIMSON }}
                  >
                    {posterMode ? "편집 모드로" : "📸 스샷 한 장 모드"}
                  </button>

                  {!posterMode ? (
                    <button
                      type="button"
                      onClick={() => router.replace("/enter")}
                      className="rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                    >
                      처음으로
                    </button>
                  ) : null}
                </div>

                {posterMode ? (
                  <div className="mt-3 text-center text-[11px] text-gray-400">
                    📸 스샷은 지금 화면 그대로!
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}