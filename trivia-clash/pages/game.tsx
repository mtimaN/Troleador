import { useState } from "react";
import Map from "../components/Map";
import QuestionPanel from "../components/QuestionPanel";
import { ADJ } from "../utils/adjacency";

type Owner = "unowned" | "player1" | "player2";

export default function GamePage() {
  const [turn, setTurn] = useState<Owner>("player1");
  const [regionOwner, setRegionOwner] = useState<Record<string, Owner>>({});
  const [activeRegion, setActiveRegion] = useState<string>("");

  // fiecare jucător alege la început un teritoriu de start
  const [initialClaim, setInitialClaim] = useState<Record<Owner, boolean>>({
    player1: false,
    player2: false,
    unowned: true, // ignorat
  });

  const switchTurn = () =>
    setTurn((prev) => (prev === "player1" ? "player2" : "player1"));

  const handleRegionClick = (regionId: string) => {
    console.log("Clicked region:", regionId, "by player:", turn);
    // ─── FAZA DE START ────────────────────────────────────────────────
    if (!initialClaim[turn]) {
      const alreadyOwned = regionOwner[regionId] && regionOwner[regionId] !== "unowned";
      if (alreadyOwned) return;
      setRegionOwner((prev) => ({ ...prev, [regionId]: turn }));
      setInitialClaim((prev) => ({ ...prev, [turn]: true }));
      switchTurn();
      return;
    }
    // nu putem sa ne atacam pe noi insine
    if (regionOwner[regionId] === turn) {
      console.log("Cannot attack own region:", regionId);
      return;
    }
    // ─── Faza de atac (cu întrebare) ─────────────────────────────────
    // daca teritoriul selectat nu este adiacent cu unul deja deținut
    const ownedRegions = Object.keys(regionOwner).filter(
      (id) => regionOwner[id] === turn
    );
    const isAdjacent = ownedRegions.some((id) =>
      // verifică dacă regiunea curentă este adiacentă cu oricare regiune
      ADJ[id]?.includes(regionId)
    );
    console.log("isAdjacent:", isAdjacent, "for region:", regionId);
    if (!isAdjacent) return;
    setActiveRegion(regionId);
  };

  const handleResult = (correct: boolean) => {
    if (correct) {
      setRegionOwner((prev) => ({ ...prev, [activeRegion]: turn }));
    }
    setActiveRegion("");
    switchTurn();
  };

  // pentru afișare: dacă jucătorul curent nu și-a ales teritoriul de start
  const needStart = !initialClaim[turn];

  return (
    <main className="flex">
      <div className="flex flex-col items-center p-4 gap-2">
        <h1 className="text-2xl font-bold">Triviador-AI</h1>
        <p>
          Turn:&nbsp;
          <span className={turn === "player1" ? "text-blue-600" : "text-red-600"}>
            {turn}
          </span>
        </p>
        {needStart && <p className="text-sm italic">Selectează teritoriul de început!</p>}

        {/* Harta */}
        <Map
          currentPlayer={turn}
          regionOwner={regionOwner}
          onSelect={handleRegionClick}
        />
      </div>

      {/* Panou întrebare */}
      {activeRegion && (
        <QuestionPanel regionId={activeRegion} onResult={handleResult} />
      )}
    </main>
  );
}
