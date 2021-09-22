const db = require("../models");

async function getUsers() {
  const users = await db.User.findAll();
  return users;
}

async function isAdmin(userId) {
  const user = await db.User.findById(userId);
  // @todo: Create user access permissions system
  return user.email === process.env.ADMIN_EMAIL;
}

async function updateUser(userId, payload, params = {}) {
  const user = await db.User.findById(userId, {
    transaction: params.transaction
  });
  if (user) {
    await user.update(payload, {
      fields: ["name", "photoUrl", "rating"],
      transaction: params.transaction
    });
  }
  return user;
}

async function createUserWithExternalId(payload) {
  let user = await db.User.findOne({
    where: {
      externalId: payload.externalId
    }
  });
  if (!user) {
    user = await db.User.create({
      name: payload.name,
      externalId: payload.externalId
    });
  }
  return user;
}

async function createUser(payload) {
  let user = await db.User.findOne({
    where: {
      email: payload.email
    }
  });

  const params = {
    name: payload.name,
    email: payload.email,
    photoUrl: payload.image
  };

  if (user) {
    await user.update(params);
  } else {
    user = await db.User.create(params);
  }
  return user;
}

module.exports = {
  getUsers,
  updateUser,
  createUserWithExternalId,
  isAdmin,
  createUser
};
