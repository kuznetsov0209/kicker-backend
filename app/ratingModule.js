const db = require("../models");
const elo = require("../services/elo");
const gamesModule = require("./gamesModule");
const usersModule = require("./usersModule");

const DEFAULT_RATING = 1400;

const TEAM_A = 0;
const TEAM_B = 1;

async function addGame(game) {
  const usersByTeam = {
    [TEAM_A]: game.Users.filter(user => user.GamePlayer.team === TEAM_A),
    [TEAM_B]: game.Users.filter(user => user.GamePlayer.team === TEAM_B)
  };
  const usersIdsByTeam = {
    [TEAM_A]: usersByTeam[TEAM_A].map(user => user.id),
    [TEAM_B]: usersByTeam[TEAM_B].map(user => user.id)
  };

  const scoreByTeam = {
    [TEAM_A]: game.Goals.filter(
      goal =>
        (usersIdsByTeam[TEAM_A].includes(goal.UserId) && !goal.ownGoal) ||
        (!usersIdsByTeam[TEAM_A].includes(goal.UserId) && goal.ownGoal)
    ),
    [TEAM_B]: game.Goals.filter(
      goal =>
        (usersIdsByTeam[TEAM_B].includes(goal.UserId) && !goal.ownGoal) ||
        (!usersIdsByTeam[TEAM_B].includes(goal.UserId) && goal.ownGoal)
    )
  };

  const ratingByTeam = {
    [TEAM_A]: usersByTeam[TEAM_A][0].rating + usersByTeam[TEAM_A][1].rating,
    [TEAM_B]: usersByTeam[TEAM_B][0].rating + usersByTeam[TEAM_B][1].rating
  };

  const {
    player1Points: eloPlayer1Points,
    player2Points: eloPlayer2Points
  } = elo.calculatePoints({
    player1: {
      rating: ratingByTeam[TEAM_A],
      score: scoreByTeam[TEAM_A]
    },
    player2: {
      rating: ratingByTeam[TEAM_B],
      score: scoreByTeam[TEAM_B]
    }
  });

  return {
    gameId: game.id,
    userA1Id: usersByTeam[TEAM_A][0].id,
    userA2Id: usersByTeam[TEAM_A][1].id,
    userB1Id: usersByTeam[TEAM_B][0].id,
    userB2Id: usersByTeam[TEAM_B][1].id,
    userA1Rating: usersByTeam[TEAM_A][0].rating,
    userA2Rating: usersByTeam[TEAM_A][1].rating,
    userB1Rating: usersByTeam[TEAM_B][0].rating,
    userB2Rating: usersByTeam[TEAM_B][1].rating,
    userA1Points: eloPlayer1Points / 2,
    userA2Points: eloPlayer1Points / 2,
    userB1Points: eloPlayer2Points / 2,
    userB2Points: eloPlayer2Points / 2
  };
}

async function recalculateStatistic() {
  const transaction = await db.sequelize.transaction();
  try {
    await resetUsersRating(transaction);
    await cleanGameRatingTable(transaction);
    await calculateStatistic(transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    throw error;
  }
}

async function resetUsersRating(transaction) {
  await db.sequelize.query(
    `UPDATE Users SET rating=${DEFAULT_RATING}, updatedAt=NOW()`,
    { transaction }
  );
}

async function getAllGamesId(transaction) {
  const gamesId = await db.sequelize.query(
    "SELECT id FROM Games ORDER BY createdAt",
    { type: db.sequelize.QueryTypes.SELECT, transaction }
  );
  return gamesId;
}

async function cleanGameRatingTable(transaction) {
  await db.GameRating.destroy({
    truncate: true,
    transaction
  });
}

async function calculateStatisticForGame(game, transaction) {
  const row = await addGame(game);
  await db.GameRating.create(row, { transaction });
  await usersModule.updateUser(
    row.userA1Id,
    { rating: row.userA1Rating + row.userA1Points },
    transaction
  );
  await usersModule.updateUser(
    row.userA2Id,
    { rating: row.userA2Rating + row.userA2Points },
    transaction
  );
  await usersModule.updateUser(
    row.userB1Id,
    { rating: row.userB1Rating + row.userB1Points },
    transaction
  );
  await usersModule.updateUser(
    row.userB2Id,
    { rating: row.userB2Rating + row.userB2Points },
    transaction
  );
}

async function calculateStatistic(transaction) {
  const gamesIdList = await getAllGamesId(transaction);
  for (let i = 0; i < gamesIdList.length; i++) {
    const game = await gamesModule.getGame(gamesIdList[i].id, transaction);
    if (gamesModule.isGameValid(game)) {
      await calculateStatisticForGame(game, transaction);
    }
  }
}

module.exports = {
  addGame,
  recalculateStatistic
};
