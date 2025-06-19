import { useEffect, useState } from "react";
import { ADJ } from "../utils/adjacency";
import "../styles/game.css";

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
  const [svgMarkup, setSvgMarkup] = useState("");

  const canPlayerConquerRegion = (regionId: string): boolean => {
    if (currentPlayer === "unowned") return false;
    const owned = Object.entries(regionOwner)
      .filter(([_, owner]) => owner === currentPlayer)
      .map(([id]) => id);

    if (owned.length === 0) return true;
    const adj = ADJ[regionId] || [];
    return owned.some(
      (t) => adj.includes(t) || ADJ[t]?.includes(regionId)
    );
  };

  useEffect(() => {
    fetch("/harta_trivia.svg")
      .then((r) => r.text())
      .then(setSvgMarkup)
      .catch((e) => console.error("cannot load svg:", e));
  }, []);

  useEffect(() => {
    if (!svgMarkup) return;
    const svg = document
      .getElementById("svg-wrapper")
      ?.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll<SVGElement>("path[id], rect[id], polygon[id]").forEach((el) => {
      const id = el.id;
      const owner: Owner = regionOwner[id] ?? "unowned";
      const canConquer = canPlayerConquerRegion(id);

      // fill & stroke
      if (owner === "player1") {
        el.style.fill = "#1e90ff";
      } else if (owner === "player2") {
        el.style.fill = "#ff6347";
      } else {
        if (canConquer && !disabled) {
          el.style.fill = "#32cd32";
          el.style.stroke = "#228b22";
          el.style.strokeWidth = "2px";
          el.style.filter = "drop-shadow(0 0 4px rgba(50, 205, 50, 0.6))";
        } else {
          el.style.fill = "#d3d3d3";
          el.style.stroke = "#a9a9a9";
          el.style.strokeWidth = "1px";
          el.style.filter = "none";
        }
      }

      el.style.cursor =
        owner === "unowned" && canConquer && !disabled ? "pointer" : "default";

      el.onclick = () => onSelect(id);

      if (owner === "unowned" && !canConquer && !disabled) {
        el.title = "You can only conquer territories adjacent to your own!";
      } else {
        el.title = "";
      }
    });
  }, [svgMarkup, regionOwner, currentPlayer, disabled]);

  return (
    <div>
      <div id="svg-wrapper" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      {/* poti pastra legenda asa cum era – tailwind poate coexista cu css-ul tau */}
    </div>
  );
}
