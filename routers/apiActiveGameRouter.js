const Router = require("koa-router");
const sse = require("koa-sse-stream");
const EventEmitter = require("events");

class ActiveGameEmitter extends EventEmitter {}
const activeGameEmitter = new ActiveGameEmitter();

const apiActiveGameRouter = new Router();

apiActiveGameRouter
  .get(
    "/api/active-game/events",
    sse({
      maxClients: 5000,
      pingInterval: 30000
    }),
    async ctx => {
      function sendEventToClient(data) {
        ctx.sse.send(JSON.stringify(data));
      }

      activeGameEmitter.on("event", sendEventToClient);
      ctx.sse.on("close", () => {
        activeGameEmitter.removeListener("event", sendEventToClient);
      });
    }
  )
  .post("/api/active-game/events", async ctx => {
    activeGameEmitter.emit("event", ctx.request.body);
  });

module.exports = apiActiveGameRouter;
