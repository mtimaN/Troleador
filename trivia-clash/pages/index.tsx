// pages/index.tsx
import { useRouter } from "next/router";

export default function HomePage() {
  const router = useRouter();

  return (
    <main style={{ display: "flex", height: "100vh", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Triviador-AI</h1>
      <button
        onClick={() => router.push("/game")}
        style={{ padding: "12px 24px", backgroundColor: "#1e90ff", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" }}
      >
        Start Game
      </button>
    </main>
  );
}
