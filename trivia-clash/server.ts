import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

// Note: If you see Deno warnings, fix your VS Code TypeScript version (see instructions above).
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --- TRIVIA GAME DATA & TYPES ---
interface Player {
  id: string;
  score: number;
}

interface Game {
  id: string;
  players: [Player, Player];
  currentQuestionIndex: number;
  playerAnswers: { [playerId: string]: string };
  roundTimer: NodeJS.Timeout | null; // This is the correct type for Node.js
}

const QUESTIONS = [
  {
    question: "What is the capital of Japan?",
    options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
    correctAnswer: "Tokyo",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: "Mars",
  },
  {
    question: 'Who wrote "To Kill a Mockingbird"?',
    options: [
      "Harper Lee",
      "Mark Twain",
      "J.K. Rowling",
      "F. Scott Fitzgerald",
    ],
    correctAnswer: "Harper Lee",
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Great White Shark", "Giraffe"],
    correctAnswer: "Blue Whale",
  },
];

const games = new Map<string, Game>();
let waitingPlayer: Player | null = null;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // --- Matchmaking Logic ---
    if (waitingPlayer) {
      const player1 = waitingPlayer;
      const player2 = { id: socket.id, score: 0 };
      waitingPlayer = null;

      const gameId = `${player1.id}-${player2.id}`;
      const newGame: Game = {
        id: gameId,
        players: [player1, player2],
        currentQuestionIndex: -1,
        playerAnswers: {},
        roundTimer: null,
      };
      games.set(gameId, newGame);

      io.sockets.sockets.get(player1.id)?.join(gameId);
      socket.join(gameId);

      io.to(gameId).emit("matchFound", newGame);
      console.log(`Match found! Game ID: ${gameId}`);

      setTimeout(() => sendNextQuestion(gameId), 1000);
    } else {
      waitingPlayer = { id: socket.id, score: 0 };
      socket.emit("waiting");
    }

    // --- Game Logic ---
    socket.on("submitAnswer", (gameId: string, answer: string) => {
      const game = games.get(gameId);
      if (!game || game.playerAnswers[socket.id]) return;

      game.playerAnswers[socket.id] = answer;
      console.log(`Player ${socket.id} answered: ${answer}`);

      const allPlayersAnswered = game.players.every((p) =>
        game.playerAnswers[p.id]
      );
      if (allPlayersAnswered) {
        if (game.roundTimer) clearTimeout(game.roundTimer);
        processRoundResults(gameId);
      } else {
        socket.to(gameId).emit("opponentAnswered");
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
      }
      games.forEach((game, gameId) => {
        if (game.players.some((p) => p.id === socket.id)) {
          io.to(gameId).emit("opponentDisconnected");
          games.delete(gameId);
        }
      });
    });
  });

  const sendNextQuestion = (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    game.currentQuestionIndex++;
    if (game.currentQuestionIndex >= QUESTIONS.length) {
      io.to(gameId).emit("gameOver", game);
      games.delete(gameId);
      return;
    }

    game.playerAnswers = {};
    const questionData = QUESTIONS[game.currentQuestionIndex];

    // FIX: The linter correctly warned `correctAnswer` was unused here.
    // We rename it to `_correctAnswer` to signal it's intentionally ignored.
    const { correctAnswer: _correctAnswer, ...questionForClient } =
      questionData;

    io.to(gameId).emit("newQuestion", {
      question: questionForClient,
      round: game.currentQuestionIndex + 1,
    });

    if (game.roundTimer) clearTimeout(game.roundTimer);
    game.roundTimer = setTimeout(() => {
      processRoundResults(gameId);
    }, 10000);
  };

  const processRoundResults = (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    // We clear the timer here in case this was triggered by all players answering
    if (game.roundTimer) clearTimeout(game.roundTimer);

    const correctAnswer = QUESTIONS[game.currentQuestionIndex].correctAnswer;
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

    game.players[0] = p1;
    game.players[1] = p2;

    io.to(gameId).emit("roundResult", {
      correctAnswer,
      playerAnswers: game.playerAnswers,
      roundWinnerId,
      game,
    });

    setTimeout(() => sendNextQuestion(gameId), 4000);
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

