"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function TestPage() {
  const [msg, setMsg] = useState("");

  const writeOnce = async () => {
    const id = `hello_${Date.now()}`;
    await setDoc(doc(db, "test", id), {
      msg: msg || "hello",
      createdAt: serverTimestamp(),
    });
    alert("✅ Firestore 저장 성공!");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Firestore Test</h1>
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="메시지"
        style={{ padding: 8, border: "1px solid #ddd" }}
      />
      <button onClick={writeOnce} style={{ marginLeft: 8, padding: 8 }}>
        저장
      </button>
    </div>
  );
}