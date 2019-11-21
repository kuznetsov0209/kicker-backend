const Router = require("koa-router");
const authModule = require("../app/authModule");
const teamsModule = require("../app/teamsModule");

const apiTournamentsRouter = new Router();

apiTournamentsRouter
  .post("/admin/api/teams", authModule.adminOnly, async ctx => {
    const { name, player1Id, player2Id } = ctx.request.body;

    const team = await teamsModule.createTeam({
      name,
      player1Id,
      player2Id
    });
    ctx.body = { team };
  })
  .post("/api/teams", authModule.authenticatedOnly, async ctx => {
    const { user } = ctx.state;
    const { name, player2Id } = ctx.request.body;

    const team = await teamsModule.createTeam({
      name,
      player1Id: user.id,
      player2Id
    });
    ctx.body = { team };
  })
  .get("/api/teams", authModule.authenticatedOnly, async ctx => {
    const teams = await teamsModule.getTeams();
    ctx.body = { teams };
  });

module.exports = apiTournamentsRouter;
