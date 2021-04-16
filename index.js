const { v4: uuidv4 } = require("uuid");
const app = require("express")();
const http = require("http");
const websocketserver = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(8080, () => console.log("server up and running on 8080"));

const clients = {};
const games = {};

app.listen(8081, () => console.log("Listening on 8081"));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const wsServer = new websocketserver({
  httpServer: httpServer,
});

wsServer.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  connection.on("open", () => console.log("Connection opened"));
  connection.on("close", () => console.log("Connection closed"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);

    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = uuidv4();
      games[gameId] = {
        id: gameId,
        cells: 20,
        clients: [],
      };
      const payload = {
        method: "create",
        game: games[gameId],
      };
      const connection = clients[clientId].connection;
      connection.send(JSON.stringify(payload));
    }
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      const color = { 0: "red", 1: "blue", 2: "green" }[game.clients.length];
      game.clients.push({
        clientId: clientId,
        color: color,
      });
      if (game.clients.length >= 3) {
        //max players reacher
      }
      const payload = {
        method: "join",
        game,
      };
      game.clients.forEach((client) => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
      const connection = clients[clientId].connection;
      connection.send(JSON.stringify(payload));
    }
  });
  const clientId = uuidv4();
  clients[clientId] = {
    connection: connection,
  };
  const payload = {
    method: "connect",
    clientId: clientId,
  };
  connection.send(JSON.stringify(payload));
});
