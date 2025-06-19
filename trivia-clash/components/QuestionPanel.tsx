import { useEffect, useState } from "react";

interface Props {
  regionId: string;
  onResult: (correct: boolean) => void;
}

type Q = { question: string; options: string[]; answer: string };

export default function QuestionPanel({ regionId, onResult }: Props) {
  const [q, setQ] = useState<Q | null>(null);
  const [picked, setPicked] = useState<string>("");

  // luam intrebarea o singura data
  useEffect(() => {
    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "general", difficulty: "medium" }),
    })
      .then((r) => r.json())
      .then(setQ)
      .catch(console.error);
  }, []);

  if (!q) return <p className="p-4">Loading question…</p>;

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.answer;
    setTimeout(() => onResult(correct), 1200);
  };

  // helper care decide clasa de culoare dupa ce s-a raspuns
  const btnClass = (opt: string) => {
    if (!picked) return "answerBtn neutral"; // inca nu alege nimic
    if (opt === q.answer) return "answerBtn correct";
    if (opt === picked) return "answerBtn wrong";
    return "answerBtn neutral";
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">
        Region&nbsp;<span className="text-indigo-600">{regionId}</span>
      </h3>

      <p className="mb-4">{q.question}</p>

      {q.options.map((opt) => (
        <button
          key={opt}
          className={btnClass(opt)}
          onClick={() => choose(opt)}
          disabled={!!picked}
        >
          {opt}
        </button>
      ))}

      {/* feedback text sub butoane */}
      {picked && (
        <p className={`feedback ${picked === q.answer ? "correct" : "wrong"}`}>
          {picked === q.answer ? "Corect!" : `Gresit! Raspunsul era: ${q.answer}`}
        </p>
      )}
    </div>
  );
}
