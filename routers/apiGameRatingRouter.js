const Router = require("koa-router");
const ratingModule = require("../app/ratingModule");

const apiGameRatingRouter = new Router();

apiGameRatingRouter.post("/api/gameRating/test", async ctx => {
  const gameRating = await ratingModule.addGame(ctx.request.body);
  ctx.body = { gameRating };
});

apiGameRatingRouter.post("/api/gameRating/recalculateStatistic", async ctx => {
  const result = await ratingModule.recalculateStatistic();
  ctx.body = { result };
});

module.exports = apiGameRatingRouter;
