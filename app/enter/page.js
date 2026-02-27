"use client";

import { useMemo, useState } from "react";

const CRIMSON = "#A00034";

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

export default function EnterPage() {
  const [seniorNo, setSeniorNo] = useState("");
  const [juniorNo, setJuniorNo] = useState("");
  const [role, setRole] = useState(""); // "senior" | "junior"
  const [error, setError] = useState("");

  const lineKey = useMemo(() => {
    const s = onlyDigits(seniorNo);
    const j = onlyDigits(juniorNo);
    if (!s || !j) return "";
    return `${s}/${j}`;
  }, [seniorNo, juniorNo]);

  const canStart = useMemo(() => {
    return onlyDigits(seniorNo).length > 0 && onlyDigits(juniorNo).length > 0 && !!role;
  }, [seniorNo, juniorNo, role]);

 const onStart = () => {
  const s = String(seniorNo || "").trim();
  const j = String(juniorNo || "").trim();

  if (!s || !j) return setError("선배/후배의 학번 마지막 두 자리 번호를 모두 입력해 주세요.");
  if (!role) return setError("본인 역할(선배/후배)을 선택해 주세요.");

  // 2자리 제한(원하면)
  if (s.length !== 2 || j.length !== 2) return setError("학번 마지막 두 자리를 2자리로 입력해 주세요. (예: 34)");

  // questions로 이동 (정보 들고)
  const qs = new URLSearchParams({ s, j, role }).toString();
  window.location.href = `/questions?${qs}`;
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
         <img
  src="/ak7_logo.jpg"
  alt="악칠 로고"
  className="h-10 w-10 rounded-full border border-gray-200 object-cover"
/>
          <div>
            <h1 className="text-xl font-bold" style={{ color: CRIMSON }}>
            🐯뻔라인 N문N답🐯
            </h1>
            <div className="mt-3 h-1 w-16 rounded-full" style={{ background: CRIMSON }} />
            <p className="text-xs text-gray-500">
              선배/후배의 <b>학번 마지막 두 자리 번호</b>를 입력하고 본인 역할을 선택해 주세요.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              선배 학번 마지막 두 자리 번호
            </label>
            <input
              inputMode="numeric"
              value={seniorNo}
              onChange={(e) => setSeniorNo(onlyDigits(e.target.value))}
              placeholder="예: 34"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              후배 학번 마지막 두 자리 번호
            </label>
            <input
              inputMode="numeric"
              value={juniorNo}
              onChange={(e) => setJuniorNo(onlyDigits(e.target.value))}
              placeholder="예: 34"
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-gray-400"
            />
          </div>

          

          <div>
            <div className="mb-2 text-sm font-semibold text-gray-700">나는?</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("senior")}
                className="flex-1 rounded-lg border p-3 text-sm font-semibold"
                style={{
                  borderColor: role === "senior" ? CRIMSON : "#D1D5DB",
                  color: role === "senior" ? CRIMSON : "#374151",
                  background: role === "senior" ? "#FFF5F7" : "white",
                }}
              >
                선배
              </button>
              <button
                type="button"
                onClick={() => setRole("junior")}
                className="flex-1 rounded-lg border p-3 text-sm font-semibold"
                style={{
                  borderColor: role === "junior" ? CRIMSON : "#D1D5DB",
                  color: role === "junior" ? CRIMSON : "#374151",
                  background: role === "junior" ? "#FFF5F7" : "white",
                }}
              >
                후배
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="w-full rounded-lg p-3 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: CRIMSON }}
          >
            시작하기
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          제출 후 수정 불가 · 상대 완료 전까지만 “처음부터 다시하기” 가능(추가 예정)
        </p>
      </div>
    </div>
  );
}