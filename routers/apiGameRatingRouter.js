const Router = require("koa-router");
const ratingModule = require("../app/ratingModule");

const apiGameRatingRouter = new Router();

apiGameRatingRouter.post("/api/gameRating/test", async ctx => {
  const gameRating = await ratingModule.addGame(ctx.request.body);
  ctx.body = { gameRating };
});

apiGameRatingRouter.get("/api/gameRating/recalculationStatus", async ctx => {
  const statusObj = ratingModule.getRecalculationStatus();
  ctx.body = { status: statusObj.status, dateTime: statusObj.date };
});

apiGameRatingRouter.post("/api/gameRating/recalculateStatistic", async ctx => {
  try {
    const statusObj = ratingModule.getRecalculationStatus();
    if (statusObj.status === "IN PROGRESS") {
      ctx.body = { status: statusObj.status, beginAt: statusObj.date };
    } else {
      ratingModule.recalculateStatistic();
      ctx.body = { status: "Recalculation process is started" };
    }
  } catch (error) {
    ctx.throw(500);
  }
});

module.exports = apiGameRatingRouter;
