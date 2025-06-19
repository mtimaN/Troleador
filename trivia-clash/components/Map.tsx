// components/Map.tsx
import { useEffect, useState } from "react";
import { ADJ } from "../utils/adjacency";

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

  // Helper function to check if a region can be conquered by current player
  const canPlayerConquerRegion = (regionId: string): boolean => {
    if (currentPlayer === "unowned") return false;

    // Get player's owned territories
    const playerTerritories = Object.entries(regionOwner)
      .filter(([_, owner]) => owner === currentPlayer)
      .map(([id, _]) => id);

    // If player has no territories yet, they can conquer any region (for initial claim)
    if (playerTerritories.length === 0) return true;

    // Check if the target region is adjacent to any of the player's territories
    const adjacentRegions = ADJ[regionId] || [];
    return playerTerritories.some((territory) =>
      adjacentRegions.includes(territory) || ADJ[territory]?.includes(regionId)
    );
  };

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
      const canConquer = canPlayerConquerRegion(id);
      console.log(`Region ${id} - Owner: ${owner}, Can Conquer: ${canConquer}`);

      // coloreaza in functie de proprietar si disponibilitate
      if (owner === "player1") {
        el.style.fill = "#1e90ff";
      } else if (owner === "player2") {
        el.style.fill = "#ff6347";
      } else if (owner === "unowned") {
        if (canConquer && !disabled) {
          // Available to conquer - bright green with subtle animation
          el.style.fill = "#32cd32";
          el.style.stroke = "#228b22";
          el.style.strokeWidth = "2px";
          el.style.filter = "drop-shadow(0 0 4px rgba(50, 205, 50, 0.6))";
        } else {
          // Not available to conquer - muted gray
          el.style.fill = "#d3d3d3";
          el.style.stroke = "#a9a9a9";
          el.style.strokeWidth = "1px";
          el.style.filter = "none";
        }
      }

      // seteaza cursorul si logica de click
      el.style.cursor =
        owner === "unowned" && !disabled && canConquer ? "pointer" : "default";

      el.onclick = () => {
        // if (disabled || owner !== "unowned" || !canConquer) return;
        onSelect(id);
      };

      // Add tooltip for non-conquerable territories
      if (owner === "unowned" && !canConquer && !disabled) {
        el.title = "You can only conquer territories adjacent to your own!";
      } else {
        el.title = "";
      }
    });
  }, [svgMarkup, regionOwner, currentPlayer, disabled]);

  return (
    <div>
      <div
        id="svg-wrapper"
        className="w-full max-w-xl mx-auto"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />

      {/* Legend */}
      <div className="mt-4 flex justify-center">
        <div className="bg-white rounded-lg p-3 shadow-md">
          <h4 className="text-sm font-semibold mb-2">Map Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Player 1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Player 2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-700"></div>
              <span>Can conquer</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Cannot conquer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
