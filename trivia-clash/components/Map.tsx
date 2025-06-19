// components/Map.tsx
import { useEffect, useState } from "react";

type Owner = "unowned" | "player1" | "player2";

interface MapProps {
  currentPlayer: Owner;
  regionOwner: Record<string, Owner>;
  onSelect: (regionId: string) => void;
  disabled?: boolean;
}

export default function Map({
  currentPlayer,
  regionOwner,
  onSelect,
  disabled = false,
}: MapProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  // incarca svg-ul ca text la montare
  useEffect(() => {
    fetch("/harta_trivia.svg")
      .then((r) => r.text())
      .then(setSvgMarkup)
      .catch((err) => console.error("cannot load svg:", err));
  }, []);

  // dupa ce svg-ul este injectat, atasam stiluri si onclick
  useEffect(() => {
    if (!svgMarkup) return;

    const svgEl = document
      .getElementById("svg-wrapper")
      ?.querySelector("svg");
    if (!svgEl) return;

    const regions = svgEl.querySelectorAll<SVGElement>(
      "path[id], rect[id], polygon[id]"
    );

    regions.forEach((el) => {
      const id = el.id;
      const owner: Owner = regionOwner[id] ?? "unowned";

      // coloreaza in functie de proprietar
      el.style.fill =
        owner === "player1"
          ? "#1e90ff"
          : owner === "player2"
          ? "#ff6347"
          : "#90ee90";

      // seteaza cursorul si logica de click
      el.style.cursor =
        owner === "unowned" && !disabled ? "pointer" : "default";
      el.onclick = () => {
        if (disabled || owner !== "unowned") return;
        onSelect(id);
      };
    });
  }, [svgMarkup, regionOwner, currentPlayer, disabled]);

  return (
    <div
      id="svg-wrapper"
      className="w-full max-w-xl mx-auto"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
