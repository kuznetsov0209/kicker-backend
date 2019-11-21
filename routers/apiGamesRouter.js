const Router = require("koa-router");
const gamesModule = require("../app/gamesModule");
const authModule = require("../app/authModule");

const apiGamesRouter = new Router();

apiGamesRouter
  .get("/api/games", authModule.authenticatedOnly, async ctx => {
    const games = await gamesModule.getGames(ctx.request.query.date);
    ctx.body = { games };
  })
  .get("/api/game/:gameId", authModule.authenticatedOnly, async ctx => {
    const { gameId } = ctx.params;
    const game = await gamesModule.getGame(gameId);
    ctx.body = { game };
  })
  .post("/api/game", authModule.authenticatedOnly, async ctx => {
    const game = await gamesModule.addGame(ctx.request.body);
    ctx.body = { game };
  })
  .delete("/api/games/:gameId", authModule.authenticatedOnly, async ctx => {
    try {
      const { gameId } = ctx.params;
      await gamesModule.deleteGame(gameId);
      ctx.body = { success: true };
    } catch (err) {
      ctx.throw(400);
    }
  });

module.exports = apiGamesRouter;
