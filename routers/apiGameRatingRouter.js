const Router = require("koa-router");
const ratingModule = require("../app/ratingModule");
const authModule = require("../app/authModule");

const apiGameRatingRouter = new Router();

apiGameRatingRouter.post("/api/gameRating/test", async ctx => {
  const gameRating = await ratingModule.addGame(ctx.request.body);
  ctx.body = { gameRating };
});

apiGameRatingRouter.post(
  "/api/gameRating/recalculateStatistic",
  authModule.adminOnly,
  async ctx => {
    try {
      ratingModule.recalculateStatistic();
      ctx.body = { status: "Recalculation process is started" };
    } catch (error) {
      ctx.throw(400);
    }
  }
);

module.exports = apiGameRatingRouter;
