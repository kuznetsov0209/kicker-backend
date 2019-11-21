const Router = require("koa-router");
const authModule = require("../app/authModule");
const tournamentsModule = require("../app/tournamentsModule");
const gamesModule = require("../app/gamesModule");
const teamsModule = require("../app/teamsModule");
const statsModule = require("../app/statsModule");

const apiTournamentsRouter = new Router();

apiTournamentsRouter
  .get("/api/tournaments/games", authModule.authenticatedOnly, async ctx => {
    const { team1Id, team2Id } = ctx.request.query;
    const team1 = await teamsModule.getTeam(team1Id);
    const team2 = await teamsModule.getTeam(team2Id);

    const games = await gamesModule.getGamesWithPlayers({
      team1PlayersIds: [team1.player1Id, team1.player2Id],
      team2PlayersIds: [team2.player1Id, team2.player2Id]
    });
    ctx.body = { games };
  })
  .post("/api/tournaments", authModule.adminOnly, async ctx => {
    const { user } = ctx.state;
    const { title, startDate, endDate } = ctx.request.body;

    const tournament = await tournamentsModule.createTournament({
      title,
      startDate,
      endDate,
      userId: user.id
    });
    ctx.body = { tournament };
  })
  .get("/api/tournaments", async ctx => {
    const tournaments = await tournamentsModule.getTournaments();
    ctx.body = { tournaments };
  })
  .get("/api/tournaments/last", async ctx => {
    const tournament = await tournamentsModule.getLastTournament();
    ctx.body = { tournament };
  })
  .get(
    "/api/tournaments/:tournamentId",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const tournament = await tournamentsModule.getTournament(tournamentId);
      ctx.body = { tournament };
    }
  )
  .get(
    "/api/tournaments/:tournamentId/games-results",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const gamesResults = await tournamentsModule.getGamesResults(
        tournamentId
      );
      ctx.body = { gamesResults };
    }
  )
  .get(
    "/api/tournaments/:tournamentId/stats",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const stats = await tournamentsModule.getStats(tournamentId);
      const games = await tournamentsModule.getGames(tournamentId);

      let usersStats = [];
      if (games.length > 0) {
        usersStats = await statsModule.getUsersStats({
          gamesIds: games.map(game => game.id)
        });
      }

      ctx.body = { stats, usersStats };
    }
  )
  .get(
    "/api/tournaments/:tournamentId/team",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const { user } = ctx.state;

      const teams = await tournamentsModule.getTournamentTeams(tournamentId);
      const userTeam = teams.find(
        team => team.player1Id === user.id || team.player2Id === user.id
      );

      ctx.body = { team: userTeam };
    }
  )
  .post(
    "/api/tournaments/:tournamentId/teams",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const { teamId } = ctx.request.body;

      const tournament = await tournamentsModule.linkTeam({
        tournamentId,
        teamId
      });
      ctx.body = { success: true };
    }
  )
  .post(
    "/api/tournaments/:tournamentId/schedule",
    authModule.adminOnly,
    async ctx => {
      const { tournamentId } = ctx.params;

      const tournament = await tournamentsModule.createTournamentGames(
        tournamentId
      );
      ctx.body = { success: true };
    }
  )
  .post("/api/tournaments/games", authModule.authenticatedOnly, async ctx => {
    const { tournamentGameId, gameId } = ctx.request.body;
    const tournament = await tournamentsModule.linkGame({
      tournamentGameId,
      gameId
    });
    ctx.body = { success: true };
  })
  .post(
    "/api/tournaments/:tournamentId/games",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const { gameId } = ctx.request.body;

      try {
        const game = await gamesModule.getGame(parseInt(gameId));

        const [player1Id, player2Id] = game.Users.filter(
          user => user.GamePlayer.team == 0
        ).map(user => user.id);
        const [player3Id, player4Id] = game.Users.filter(
          user => user.GamePlayer.team == 1
        ).map(user => user.id);

        const teams = await tournamentsModule.getTournamentTeams(tournamentId);
        const team1 = teams.find(
          team =>
            (team.player1Id == player1Id && team.player2Id == player2Id) ||
            (team.player1Id == player2Id && team.player2Id == player1Id)
        );
        const team2 = teams.find(
          team =>
            (team.player1Id == player3Id && team.player2Id == player4Id) ||
            (team.player1Id == player4Id && team.player2Id == player3Id)
        );

        const tournamentGames = await tournamentsModule.getTournamentGames(
          tournamentId
        );
        const tournamentGame = tournamentGames.find(
          tournamentGame =>
            (tournamentGame.team1.id === team1.id &&
              tournamentGame.team2.id === team2.id) ||
            (tournamentGame.team1.id === team2.id &&
              tournamentGame.team2.id === team1.id)
        );

        await tournamentsModule.linkGame({
          tournamentGameId: tournamentGame.id,
          gameId
        });

        ctx.body = { success: true };
      } catch (error) {
        ctx.body = { error };
      }
    }
  )
  .delete(
    "/api/tournaments/:tournamentId/teams",
    authModule.authenticatedOnly,
    async ctx => {
      const { tournamentId } = ctx.params;
      const { teamId } = ctx.request.body;

      const tournament = await tournamentsModule.unlinkTeam({
        tournamentId,
        teamId
      });
      ctx.body = { success: true };
    }
  );

module.exports = apiTournamentsRouter;
