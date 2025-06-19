"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Define the types to match the server
interface Player {
  id: string;
  score: number;
}
interface Game {
  id: string;
  players: [Player, Player]; /* ...other fields */
}
interface Question {
  question: string;
  options: string[];
}
interface RoundResult {
  correctAnswer: string;
  playerAnswers: { [playerId: string]: string };
  roundWinnerId: string | null;
  game: Game;
}

export default function HomePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clientId, setClientId] = useState("");
  const [gameState, setGameState] = useState<
    "waiting" | "playing" | "result" | "gameOver" | "disconnected"
  >("connecting");
  const [game, setGame] = useState<Game | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server!", newSocket.id);
      setClientId(newSocket.id);
    });

    newSocket.on("waiting", () => setGameState("waiting"));

    newSocket.on("matchFound", (initialGame: Game) => {
      setGame(initialGame);
      setGameState("playing");
    });

    newSocket.on(
      "newQuestion",
      (
        { question: newQuestion, round: newRound }: {
          question: Question;
          round: number;
        },
      ) => {
        setQuestion(newQuestion);
        setRound(newRound);
        setResult(null);
        setAnswered(false);
        setGameState("playing");
      },
    );

    newSocket.on("roundResult", (resultData: RoundResult) => {
      setResult(resultData);
      setGame(resultData.game); // Update score
      setGameState("result");
    });

    newSocket.on("gameOver", (finalGame: Game) => {
      setGame(finalGame);
      setGameState("gameOver");
    });

    newSocket.on("opponentDisconnected", () => setGameState("disconnected"));

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const submitAnswer = (answer: string) => {
    if (!socket || !game) return;
    setAnswered(true);
    socket.emit("submitAnswer", game.id, answer);
  };

  // --- Render Functions for UI clarity ---

  const renderWaitingScreen = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">Waiting for an opponent...</h2>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto">
      </div>
    </div>
  );

  const renderGameScreen = () => {
    if (!game || !question) return null;
    const me = game.players.find((p) => p.id === clientId);
    const opponent = game.players.find((p) => p.id !== clientId);

    return (
      <div className="w-full max-w-2xl">
        {/* Scoreboard */}
        <div className="flex justify-between items-center bg-slate-700 p-4 rounded-lg mb-6">
          <div className="text-left">
            <p className="text-lg font-bold text-blue-400">You</p>
            <p className="text-2xl">{me?.score} Regions</p>
          </div>
          <p className="text-xl font-bold">Round {round}</p>
          <div className="text-right">
            <p className="text-lg font-bold text-red-400">Opponent</p>
            <p className="text-2xl">{opponent?.score} Regions</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {question.question}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option) => (
              <button
                key={option}
                disabled={answered}
                onClick={() => submitAnswer(option)}
                className="p-4 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
          {answered && !result && (
            <p className="text-center mt-4 text-yellow-400">
              Waiting for opponent...
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderResultScreen = () => {
    if (!result) return null;
    const myAnswer = result.playerAnswers[clientId];
    const wonRound = result.roundWinnerId === clientId;
    const drewRound = result.roundWinnerId === null;

    let resultMessage = "";
    if (wonRound) resultMessage = "You won the region!";
    else if (drewRound) resultMessage = "It's a draw!";
    else resultMessage = "Your opponent won the region.";

    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-2xl">
        <h2
          className={`text-4xl font-bold mb-4 ${wonRound ? "text-green-400" : "text-red-400"
            }`}
        >
          {resultMessage}
        </h2>
        <p className="text-lg">
          The correct answer was:{" "}
          <strong className="text-yellow-300">{result.correctAnswer}</strong>
        </p>
        <p className="mt-2">
          Your answer:{" "}
          <span
            className={myAnswer === result.correctAnswer
              ? "text-green-400"
              : "text-red-400"}
          >
            {myAnswer || "No answer"}
          </span>
        </p>
      </div>
    );
  };

  const renderEndScreen = (message: string, color: string) => (
    <div
      className={`text-center p-8 bg-slate-800 rounded-lg shadow-2xl ${color}`}
    >
      <h2 className="text-4xl font-bold mb-4">{message}</h2>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-blue-600 rounded hover:bg-blue-500"
      >
        Play Again
      </button>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Trivia Clash
      </h1>

      {gameState === "connecting" && <p>Connecting to server...</p>}
      {gameState === "waiting" && renderWaitingScreen()}
      {(gameState === "playing" || gameState === "result") &&
        renderGameScreen()}
      {gameState === "result" && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          {renderResultScreen()}
        </div>
      )}
      {gameState === "gameOver" && renderEndScreen("Game Over!", "text-white")}
      {gameState === "disconnected" &&
        renderEndScreen("Opponent Disconnected", "text-yellow-400")}
    </main>
  );
}
