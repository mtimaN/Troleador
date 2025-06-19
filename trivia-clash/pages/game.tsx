import { useState } from "react";
import Map from "../components/Map";
import QuestionPanel from "../components/QuestionPanel";
import { ADJ } from "../utils/adjacency";
import "../styles/game.css";      // <-- importam css-ul global

type Owner = "unowned" | "player1" | "player2";

export default function GamePage() {
  const [turn, setTurn] = useState<Owner>("player1");
  const [regionOwner, setRegionOwner] = useState<Record<string, Owner>>({});
  const [activeRegion, setActiveRegion] = useState<string>("");

  const [initialClaim, setInitialClaim] = useState<Record<Owner, boolean>>({
    player1: false,
    player2: false,
    unowned: true,
  });

  const switchTurn = () =>
    setTurn((prev) => (prev === "player1" ? "player2" : "player1"));

  const handleRegionClick = (regionId: string) => {
    if (!initialClaim[turn]) {
      if (regionOwner[regionId] && regionOwner[regionId] !== "unowned") return;
      setRegionOwner((prev) => ({ ...prev, [regionId]: turn }));
      setInitialClaim((prev) => ({ ...prev, [turn]: true }));
      switchTurn();
      return;
    }

    if (regionOwner[regionId] === turn) return;

    const owned = Object.keys(regionOwner).filter(
      (id) => regionOwner[id] === turn
    );
    const adjacent = owned.some((id) => ADJ[id]?.includes(regionId));
    if (!adjacent) return;

    setActiveRegion(regionId);
  };

  const handleResult = (correct: boolean) => {
    if (correct) {
      setRegionOwner((prev) => ({ ...prev, [activeRegion]: turn }));
    }
    setActiveRegion("");
    switchTurn();
  };

  const needStart = !initialClaim[turn];

  return (
    <div className="page">
      <header className="topBar">Triviador-AI</header>

      <div className="body">
        {/* stanga – harta + info */}
        <div className="mapPane">
          <div className="turnBox">
            Turn:&nbsp;
            <span className={turn === "player1" ? "blue" : "red"}>{turn}</span>
          </div>

          {needStart && (
            <p className="startHint">Selecteaza teritoriul de inceput!</p>
          )}

          <div className="mapWrapper">
            <Map
              currentPlayer={turn}
              regionOwner={regionOwner}
              onSelect={handleRegionClick}
              disabled={!!activeRegion} // blocam click-ul cand apare panelul
            />
          </div>
        </div>

        {/* dreapta – drawer cu intrebarea */}
        {activeRegion && (
          <>
            <div
              className="backdrop"
              onClick={() => handleResult(false)}
            />
            <aside className="questionDrawer">
              <QuestionPanel regionId={activeRegion} onResult={handleResult} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
