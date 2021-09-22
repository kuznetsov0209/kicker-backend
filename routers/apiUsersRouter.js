const Router = require("koa-router");
const usersModule = require("../app/usersModule");
const authModule = require("../app/authModule");

const apiUsersRouter = new Router();

apiUsersRouter
  .get("/api/user", async ctx => {
    const user = ctx.state.user || null;
    ctx.body = { user };
  })
  .get("/api/users", async ctx => {
    const users = await usersModule.getUsers();
    ctx.body = { users };
  })
  .post("/api/users/qr", async ctx => {
    const user = await usersModule.createUserWithExternalId(ctx.request.body);
    ctx.body = { user };
  })
  .post("/api/users/:userId", authModule.adminOnly, async ctx => {
    const { userId } = ctx.params;
    const user = await usersModule.updateUser(userId, ctx.request.body);
    ctx.body = { user };
  })
  .post("/api/user", async ctx => {
    const user = await usersModule.createUser(ctx.request.body);
    ctx.body = { user };
  });

module.exports = apiUsersRouter;
