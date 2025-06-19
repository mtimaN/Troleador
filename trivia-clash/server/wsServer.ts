import { createServer } from "http";
import { WebSocketServer } from "ws";

type Owner = "unowned" | "player1" | "player2";

interface GameState {
  regionOwner: Record<string, Owner>;
  turn: Owner;
  initialClaim: Record<Owner, boolean>;
}

interface ClientMessage {
  type: "action";
  payload: ClientAction;
}

type ClientAction =
  | { kind: "claim"; region: string }
  | { kind: "attack"; region: string; correct: boolean };

const state: GameState = {
  regionOwner: {},
  turn: "player1",
  initialClaim: { player1: false, player2: false, unowned: true },
};

function broadcast(wss: WebSocketServer) {
  const data = JSON.stringify({ type: "state", state });
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(data);
  });
}

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "state", state }));

  ws.on("message", (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());
      if (msg.type !== "action") return;
      const a = msg.payload;

      switch (a.kind) {
        case "claim":
          state.regionOwner[a.region] = state.turn;
          state.initialClaim[state.turn] = true;
          break;
        case "attack":
          if (a.correct) state.regionOwner[a.region] = state.turn;
          break;
      }

      state.turn = state.turn === "player1" ? "player2" : "player1";
      broadcast(wss);
    } catch (err) {
      console.error("Bad WS message", err);
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);
});
