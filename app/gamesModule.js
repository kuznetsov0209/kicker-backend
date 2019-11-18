const moment = require("moment");
const db = require("../models");

async function addGame(payload) {
  const game = await db.Game.create(payload, {
    include: [db.Game.GamePlayers, db.Game.Goals]
  });
  return game;
}

async function getGames(date) {
  const startOfWeek = moment(date)
    .startOf("week")
    .toDate();
  const endOfWeek = moment(date)
    .endOf("week")
    .toDate();
  const { Op } = db.Sequelize;

  const games = await db.Game.findAll({
    include: [{ model: db.User }, { model: db.Goal }],
    where: {
      createdAt: {
        [Op.and]: {
          [Op.gt]: startOfWeek,
          [Op.lt]: endOfWeek
        }
      }
    },
    order: [["createdAt", "DESC"]]
  });
  return games;
}

async function getGamesWithPlayers({ team1PlayersIds, team2PlayersIds }) {
  const { Op } = db.Sequelize;

  const gameIds = await db.sequelize.query(
    `
SELECT
  Games.id AS 'id'
FROM Games
  INNER JOIN GamePlayers as GamePlayers00
    ON Games.id = GamePlayers00.gameId AND GamePlayers00.team = 0 AND GamePlayers00.position = 0 
  INNER JOIN GamePlayers as GamePlayers01
    ON Games.id = GamePlayers01.gameId AND GamePlayers01.team = 0 AND GamePlayers01.position = 1
  INNER JOIN GamePlayers as GamePlayers10
    ON Games.id = GamePlayers10.gameId AND GamePlayers10.team = 1 AND GamePlayers10.position = 0 
  INNER JOIN GamePlayers as GamePlayers11
    ON Games.id = GamePlayers11.gameId AND GamePlayers11.team = 1 AND GamePlayers11.position = 1 
WHERE
  (
    GamePlayers00.userId IN (:team1PlayersIds) AND
    GamePlayers01.userId IN (:team1PlayersIds) AND
    GamePlayers10.userId IN (:team2PlayersIds) AND
    GamePlayers11.userId IN (:team2PlayersIds)
  )
  OR
  (
    GamePlayers00.userId IN (:team2PlayersIds) AND
    GamePlayers01.userId IN (:team2PlayersIds) AND
    GamePlayers10.userId IN (:team1PlayersIds) AND
    GamePlayers11.userId IN (:team1PlayersIds)
  )
  `,
    {
      replacements: { team1PlayersIds, team2PlayersIds },
      type: db.sequelize.QueryTypes.SELECT
    }
  );

  const games = db.Game.findAll({
    include: [{ model: db.User }, { model: db.Goal }],
    where: {
      id: {
        [Op.in]: gameIds.map(item => item.id)
      }
    },
    order: [["createdAt", "DESC"]]
  });

  return games;
}

async function getGame(gameId) {
  const game = await db.Game.findById(gameId, {
    include: [{ model: db.User }, { model: db.Goal }]
  });
  return game;
}

async function removeGame({ gameId }) {
  await db.Game.destroy({ where: { id: gameId } });
}

async function deleteGame(gameId) {
  await db.GamePlayer.destroy({ where: { gameId: gameId } });
  await db.Goal.destroy({ where: { gameId: gameId } });
  await db.Game.destroy({ where: { id: gameId } });
}

async function joinGame({ userId, gameId, team, position }) {
  const user = await db.User.findById(userId);
  const game = await db.Game.findById(gameId);
  if (game && user) {
    await game.addUser(user, { through: { team, position } });
  }
}

async function leftGame({ userId, gameId }) {
  const user = await db.User.findById(userId);
  const game = await db.Game.findById(gameId);
  if (game && user) {
    await game.removeUser(user);
  }
}

async function startGame({ gameId }) {
  const game = await db.Game.findById(gameId);
  if (game) {
    await game.update({ status: "STARTED" });
  }
  return game;
}

async function addGoal({ gameId, userId, ownGoal = false }) {
  const user = await db.User.findById(userId);
  const game = await db.Game.findById(gameId);
  const goal = db.Goal.build({ ownGoal });
  goal.setUser(user, { save: false });
  goal.setGame(game, { save: false });
  await goal.save();
  return goal;
}

async function removeGoal({ goalId }) {
  await db.Goal.destroy({ where: { id: goalId } });
}

async function removeLastGoal({ gameId, userId }) {
  const goal = await db.Goal.findOne({
    where: {
      gameId,
      userId
    },
    order: [["createdAt", "DESC"]]
  });
  await goal.destroy();
}

async function finishGame({ gameId }) {
  const game = await db.Game.findById(gameId);
  if (game) {
    await game.update({ status: "FINISHED" });
  }
  return game;
}

module.exports = {
  getGames,
  getGamesWithPlayers,
  getGame,
  addGame,
  removeGame,
  deleteGame,
  joinGame,
  leftGame,
  startGame,
  addGoal,
  removeGoal,
  removeLastGoal,
  finishGame
};
