import { useState } from "react";

interface Props {
  regionId: string;
  onResult: (correct: boolean) => void;
}

export default function QuestionPanel({ regionId, onResult }: Props) {
  const [question, setQuestion] = useState<{
    question: string;
    options: string[];
    answer: string;
  } | null>(null);
  const [selected, setSelected] = useState<string>("");

  // 1. La prima randare fetch-uim întrebarea
  useState(() => {
    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "general", difficulty: "medium" }),
    })
      .then((r) => r.json())
      .then(setQuestion);
  });

  if (!question) return <p className="p-4">Loading question…</p>;

  const choose = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === question.answer;
    setTimeout(() => onResult(correct), 1200);
  };

  return (
    <aside className="w-80 border-l p-4">
      <h3 className="font-semibold mb-2">
        Region&nbsp;<span className="text-indigo-600">{regionId}</span>
      </h3>
      <p className="mb-4">{question.question}</p>

      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => choose(opt)}
          className={`block w-full text-left mb-2 p-2 border rounded
            ${
              selected
                ? opt === question.answer
                  ? "bg-green-300"
                  : opt === selected
                  ? "bg-red-300"
                  : "opacity-60"
                : "hover:bg-gray-100"
            }`}
          disabled={!!selected}
        >
          {opt}
        </button>
      ))}
    </aside>
  );
}
