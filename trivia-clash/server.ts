import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ---------- TIPURI ----------
interface Player {
  id: string;
  score: number;
}
interface Game {
  id: string;
  players: [Player, Player];
  round: number;
  playerAnswers: Record<string, string>;
  roundTimer: NodeJS.Timeout | null;
  lastQuestion?: Question;
}
interface Question {
  question: string;
  options: [string, string, string, string];
  answer: string; // textul variantei corecte
}

// ---------- STATE ----------
const games = new Map<string, Game>();
let waitingPlayer: Player | null = null;

// ---------- HELPER: Fetch AI trivia ----------
async function fetchGeminiQuestion(
  topic = "random",
  difficulty = "medium",
): Promise<Question> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key");

  const prompt =
    `Generate a trivia question about ${topic}, difficulty ${difficulty}. Return strict JSON:
{
  "question": "...",
  "options": ["A","B","C","D"],
  "answer": "..."
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-1219:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("No content from Gemini");

  const clean = raw.replace(/```json|```/g, "").trim();
  const q = JSON.parse(clean);
  return q as Question;
}

// ---------- APP ----------
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // --- MATCHMAKING ---
    if (waitingPlayer) {
      const player1 = waitingPlayer;
      const player2: Player = { id: socket.id, score: 0 };
      waitingPlayer = null;

      const gameId = `${player1.id}-${player2.id}`;
      const newGame: Game = {
        id: gameId,
        players: [player1, player2],
        round: 0,
        playerAnswers: {},
        roundTimer: null,
      };
      games.set(gameId, newGame);

      io.sockets.sockets.get(player1.id)?.join(gameId);
      socket.join(gameId);

      io.to(gameId).emit("matchFound", newGame);
      console.log(`Match found! Game ID: ${gameId}`);

      void sendNextQuestion(gameId);
    } else {
      waitingPlayer = { id: socket.id, score: 0 };
      socket.emit("waiting");
    }

    // --- GAME LOGIC ---
    socket.on("submitAnswer", (gameId: string, answer: string) => {
      const game = games.get(gameId);
      if (!game || game.playerAnswers[socket.id]) return;

      game.playerAnswers[socket.id] = answer;

      const everyoneAnswered = game.players.every((p) =>
        game.playerAnswers[p.id]
      );
      if (everyoneAnswered) {
        if (game.roundTimer) clearTimeout(game.roundTimer);
        processRoundResults(gameId);
      } else {
        socket.to(gameId).emit("opponentAnswered");
      }
    });

    socket.on("disconnect", () => {
      if (waitingPlayer?.id === socket.id) waitingPlayer = null;
      games.forEach((game, gameId) => {
        if (game.players.some((p) => p.id === socket.id)) {
          io.to(gameId).emit("opponentDisconnected");
          games.delete(gameId);
        }
      });
    });
  });

  // ---------- FUNCTIONS ----------
  const sendNextQuestion = async (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    try {
      const questionData = await fetchGeminiQuestion("general", "medium");
      game.lastQuestion = questionData;
      game.round++;
      game.playerAnswers = {};

      io.to(gameId).emit("newQuestion", {
        question: {
          question: questionData.question,
          options: questionData.options,
        },
        round: game.round,
      });

      if (game.roundTimer) clearTimeout(game.roundTimer);
      game.roundTimer = setTimeout(() => processRoundResults(gameId), 10000);
    } catch (err) {
      console.error("Failed to fetch question:", err);
      io.to(gameId).emit("error", "Failed to fetch question.");
      games.delete(gameId);
    }
  };

  const processRoundResults = (gameId: string) => {
    const game = games.get(gameId);
    if (!game || !game.lastQuestion) return;

    if (game.roundTimer) clearTimeout(game.roundTimer);

    const correctAnswer = game.lastQuestion.answer;
    const [p1, p2] = game.players;
    const p1Answer = game.playerAnswers[p1.id];
    const p2Answer = game.playerAnswers[p2.id];

    const p1Correct = p1Answer === correctAnswer;
    const p2Correct = p2Answer === correctAnswer;

    let roundWinnerId: string | null = null;
    if (p1Correct && !p2Correct) {
      p1.score++;
      roundWinnerId = p1.id;
    } else if (!p1Correct && p2Correct) {
      p2.score++;
      roundWinnerId = p2.id;
    }

    game.players = [p1, p2];

    io.to(gameId).emit("roundResult", {
      correctAnswer,
      playerAnswers: game.playerAnswers,
      roundWinnerId,
      game,
    });

    // play up to 10 rounds then finish
    if (game.round >= 10) {
      io.to(gameId).emit("gameOver", game);
      games.delete(gameId);
    } else {
      setTimeout(() => sendNextQuestion(gameId), 4000);
    }
  };

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

