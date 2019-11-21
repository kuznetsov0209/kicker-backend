const Router = require("koa-router");
const usersModule = require("../app/usersModule");
const authModule = require("../app/authModule");

const apiUsersRouter = new Router();

apiUsersRouter
  .get("/api/users", authModule.authenticatedOnly, async ctx => {
    const users = await usersModule.getUsers();
    ctx.body = { users };
  })
  .post("/api/users/:userId", authModule.adminOnly, async ctx => {
    const { userId } = ctx.params;
    const user = await usersModule.updateUser(userId, ctx.request.body);
    ctx.body = { user };
  });

module.exports = apiUsersRouter;
