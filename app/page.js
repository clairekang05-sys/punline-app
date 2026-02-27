export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">💜 뻔라인 N문N답</h1>
        <p className="mt-2 text-sm text-gray-500">
          로컬 개발 준비 완료! 이제 입장 페이지를 만들 거예요.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <div className="font-semibold">다음 단계</div>
          <ul className="mt-2 list-disc pl-5">
            <li>/enter 페이지 만들기</li>
            <li>고유번호 입력 + 선배/후배 선택</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
