const Router = require("koa-router");
const statsModule = require("../app/statsModule");

const apiStatsRouter = new Router();

apiStatsRouter.get("/api/stats", async ctx => {
  const { date, userId } = ctx.request.query;
  const usersStats = await statsModule.getUsersStats({
    weekDate: date,
    userId
  });

  ctx.body = {
    usersStats: {
      ...usersStats,
      all: (usersStats.all || []).filter(item => item.games > 3)
    }
  };
});

apiStatsRouter.get("/leaderboard", async ctx => {
  const usersStats = await statsModule.getUsersStats({
    weekDate: new Date().toISOString()
  });
  const standings = usersStats
    ? (usersStats.all || [])
        .filter(item => item.games > 0)
        .map(item => {
          const initial = item.name
            .split(" ")
            .filter(Boolean)
            .map(word => word.trim()[0])
            .slice(0, 2)
            .join("");

          return Object.assign(item, { initial });
        })
        .sort((a, b) => b.rating - a.rating)
    : [];

  return ctx.render("leaderboard", { standings });
});

module.exports = apiStatsRouter;
