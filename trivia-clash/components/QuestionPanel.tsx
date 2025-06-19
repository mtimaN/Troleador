import { useEffect, useState } from "react";

interface Props {
  regionId: string;
  onResult: (correct: boolean) => void;
  topic: string;
  difficulty?: string;
}

type Question = {
  question: string;
  options: string[];
  answer: string;
};

export default function QuestionPanel({
  regionId,
  onResult,
  topic,
  difficulty = "medium",
}: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    setQuestion(null);
    setSelected("");
    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty }),
    })
      .then((r) => r.json())
      .then(setQuestion)
      .catch(() => {
        setQuestion({
          question: "Eroare la încărcarea întrebării.",
          options: [],
          answer: "",
        });
      });
  }, [topic, difficulty]);

  if (!question) return <p className="p-4">Se încarcă întrebarea…</p>;
  if (question.options.length === 0)
    return <p className="p-4">Nicio opțiune disponibilă.</p>;

  const choose = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === question.answer;
    setTimeout(() => onResult(correct), 1200);
  };

  const btnClass = (opt: string) => {
    if (!selected) return "answerBtn neutral";
    if (opt === question.answer) return "answerBtn correct";
    if (opt === selected) return "answerBtn wrong";
    return "answerBtn neutral";
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">
        Region <span className="text-indigo-600">{regionId}</span>
      </h3>
      <p className="mb-4">{question.question}</p>

      {question.options.map((opt) => (
        <button
          key={opt}
          className={btnClass(opt)}
          onClick={() => choose(opt)}
          disabled={!!selected}
        >
          {opt}
        </button>
      ))}

      {selected && (
        <p className={`feedback ${selected === question.answer ? "correct" : "wrong"}`}>
          {selected === question.answer
            ? "Corect!"
            : `Greșit! Răspunsul corect era: ${question.answer}`}
        </p>
      )}
    </div>
  );
}
