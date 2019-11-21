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

async function updateUser(userId, payload, params) {
  const user = await db.User.findById(userId, {
    transaction: params
      ? params.transaction
        ? params.transaction
        : undefined
      : undefined
  });
  if (user) {
    await user.update(payload, {
      fields: ["name", "photoUrl", "rating"],
      transaction: params
        ? params.transaction
          ? params.transaction
          : undefined
        : undefined
    });
  }
  return user;
}

module.exports = {
  getUsers,
  updateUser,
  isAdmin
};
