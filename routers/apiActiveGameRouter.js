const Router = require("koa-router");
const sse = require("koa-sse-stream");
const EventEmitter = require("events");

const gameEventEmitter = new EventEmitter();

const apiActiveGameRouter = new Router();

const TeamPosition = {
  Red: 0,
  Blue: 1
};

const PlayerPosition = {
  Forward: 0,
  Defender: 1
};

const gameSlots = [
  {
    team: TeamPosition.Red,
    position: PlayerPosition.Defender,
    user: null
  },
  {
    team: TeamPosition.Blue,
    position: PlayerPosition.Forward,
    user: null
  },
  {
    team: TeamPosition.Red,
    position: PlayerPosition.Forward,
    user: null
  },
  {
    team: TeamPosition.Blue,
    position: PlayerPosition.Defender,
    user: null
  }
];

function handleSelectPlayer({ team, position, user }) {
  const gameSlot = gameSlots.find(
    gameSlot => gameSlot.position === position && gameSlot.team === team
  );
  const prevGameSlot = gameSlots.find(
    gameSlot => gameSlot.user && gameSlot.user.id === user.id
  );
  if (prevGameSlot) {
    prevGameSlot.user = null;
  }
  if (gameSlot !== prevGameSlot) {
    gameSlot.user = user;
  }
}

function handleResetGame() {
  gameSlots.forEach(gameSlot => {
    gameSlot.user = null;
  });
}

const ACTION_SELECT_PLAYER = "select-player";
const ACTION_RESET_PLAYERS = "reset-players";
const ACTION_UPDATE_ALL_PLAYERS = "update-all-players";

apiActiveGameRouter
  .get(
    "/api/active-game/events",
    sse({
      maxClients: 5000,
      pingInterval: 30000
    }),
    async ctx => {
      const dispatch = payload => ctx.sse.send(JSON.stringify(payload));

      dispatch({
        type: ACTION_UPDATE_ALL_PLAYERS,
        payload: { gameSlots }
      });

      gameEventEmitter.on("event", dispatch);
      ctx.sse.on("close", () => {
        gameEventEmitter.removeListener("event", dispatch);
      });
    }
  )
  .post("/api/active-game/events", async ctx => {
    const { type, payload } = ctx.request.body;

    switch (type) {
      case ACTION_SELECT_PLAYER:
        handleSelectPlayer(payload);
        gameEventEmitter.emit("event", {
          type: ACTION_UPDATE_ALL_PLAYERS,
          payload: { gameSlots }
        });
        break;
      case ACTION_RESET_PLAYERS:
        handleResetGame();
        gameEventEmitter.emit("event", {
          type: ACTION_UPDATE_ALL_PLAYERS,
          payload: { gameSlots }
        });
        break;
    }

    ctx.status = 204;
  });

module.exports = apiActiveGameRouter;
