//const moment = require("moment");
const db = require("../models");
const elo = require("../services/elo");

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
    await resetRating(transaction);
    await cleanGameRatingTable(transaction);
    await fillGameRatingTable(transaction);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
  }
}

async function resetRating(transaction) {
  await db.sequelize.query(
    `UPDATE Users SET rating=${DEFAULT_RATING}, updatedAt=NOW()`,
    { transaction }
  );
}

async function cleanGameRatingTable(transaction) {
  await db.GameRating.destroy({
    truncate: true,
    transaction
  });
}

async function createRowGameRating(game, transaction) {
  const row = await addGame(game);
  await db.GameRating.create(row, { transaction });
}

async function fillGameRatingTable(transaction) {
  const games = await getAllGames(transaction);
  games.map(async game => {
    if (game.Users && game.Users.length === 4) {
      await createRowGameRating(game, transaction);
    }
  });
}

async function getAllGames(transaction) {
  const games = await db.Game.findAll({
    include: [{ model: db.User }, { model: db.Goal }],
    order: [["createdAt"]],
    transaction
  });
  return games;
}

module.exports = {
  addGame,
  recalculateStatistic
};
