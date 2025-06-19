import { useState } from "react";
import Map from "../components/Map";
import QuestionPanel from "../components/QuestionPanel";
import { ADJ } from "../utils/adjacency";
import "../styles/game.css"; // import CSS global

type Owner = "unowned" | "player1" | "player2";

const TOPICS = ["general", "sports", "history", "science", "movies"];

export default function GamePage() {
  const [turn, setTurn] = useState<Owner>("player1");
  const [regionOwner, setRegionOwner] = useState<Record<string, Owner>>({});
  const [activeRegion, setActiveRegion] = useState<string>("");
  const [choosingTopic, setChoosingTopic] = useState(false);
  const [chosenTopic, setChosenTopic] = useState<string | null>(null);
  const [initialClaim, setInitialClaim] = useState<Record<Owner, boolean>>({
    player1: false,
    player2: false,
    unowned: true,
  });

  const switchTurn = () =>
    setTurn((prev) => (prev === "player1" ? "player2" : "player1"));

  const handleRegionClick = (regionId: string) => {
    if (activeRegion) return; // nu permite click daca e deja intrebare

    const owner = regionOwner[regionId] ?? "unowned";

    // faza de start: alegi teritoriu neocupat
    if (!initialClaim[turn]) {
      if (owner !== "unowned") return;
      setRegionOwner((prev) => ({ ...prev, [regionId]: turn }));
      setInitialClaim((prev) => ({ ...prev, [turn]: true }));
      switchTurn();
      return;
    }

    // nu permite atac pe teritoriul propriu
    if (owner === turn) return;

    // verifica adiacenta fata de teritoriile detinute
    const owned = Object.keys(regionOwner).filter((id) => regionOwner[id] === turn);
    const adjacent = owned.some((id) => ADJ[id]?.includes(regionId));
    if (!adjacent) return;

    // deschide modalul pentru adversar sa aleaga topicul
    setActiveRegion(regionId);
    setChoosingTopic(true);
    setChosenTopic(null);
  };

  const confirmTopic = (topic: string) => {
    setChosenTopic(topic);
    setChoosingTopic(false);
  };

  const handleResult = (correct: boolean) => {
    if (correct) {
      setRegionOwner((prev) => ({ ...prev, [activeRegion]: turn }));
    }
    setActiveRegion("");
    setChosenTopic(null);
    switchTurn();
  };

  const needStart = !initialClaim[turn];

  return (
    <div className="page">
      <header className="topBar">Triviador-AI</header>

      <div className="body">
        {/* stanga: harta + info */}
        <div className="mapPane">
          <div className="turnBox">
            Turn:&nbsp;
            <span className={turn === "player1" ? "blue" : "red"}>{turn}</span>
          </div>

          {needStart && <p className="startHint">Selecteaza teritoriul de inceput!</p>}

          <div className="mapWrapper">
            <Map
              currentPlayer={turn}
              regionOwner={regionOwner}
              onSelect={handleRegionClick}
              disabled={!!activeRegion || choosingTopic}
            />
          </div>
        </div>

        {/* dreapta: alegerea topicului */}
        {choosingTopic && (
          <aside className="questionDrawer">
            <h3>Alege topicul pentru întrebare (jucătorul adversar)</h3>
            <div className="flex flex-col gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  className="answerBtn"
                  onClick={() => confirmTopic(t)}
                >
                  {t}
                </button>
              ))}
              <button className="answerBtn wrong" onClick={() => confirmTopic("general")}>
                Sar peste și folosesc topic general
              </button>
            </div>
          </aside>
        )}

        {/* dreapta: panoul intrebare */}
        {activeRegion && chosenTopic && !choosingTopic && (
          <>
            <div className="backdrop" onClick={() => handleResult(false)} />
            <aside className="questionDrawer">
              <p>
                Topic ales: <strong>{chosenTopic}</strong> | Dificultate: <strong>medium</strong>
              </p>
              <QuestionPanel
                regionId={activeRegion}
                onResult={handleResult}
                topic={chosenTopic}
                difficulty="medium"
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
