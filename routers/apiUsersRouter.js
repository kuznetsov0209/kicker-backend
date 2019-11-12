const fsPromises = require("fs").promises;
const path = require("path");
const rimraf = require("rimraf");
const Router = require("koa-router");
const multer = require("@koa/multer");
const usersModule = require("../app/usersModule");
const authModule = require("../app/authModule");

const apiUsersRouter = new Router();
const upload = multer();

apiUsersRouter
  .get("/api/user", async ctx => {
    const user = ctx.state.user || null;
    ctx.body = { user };
  })
  .get("/api/users", async ctx => {
    const users = await usersModule.getUsers();
    ctx.body = { users };
  })
  .post("/api/users/:userId", authModule.adminOnly, async ctx => {
    const { userId } = ctx.params;
    const user = await usersModule.updateUser(userId, ctx.request.body);
    ctx.body = { user };
  })
  .post("/api/users/:userId/photo", upload.single("photo"), async ctx => {
    const { userId } = ctx.params;
    const user = await usersModule.getUser(userId);
    if (!user) {
      return ctx.throw(404);
    }

    const appRoot = path.dirname(require.main.filename);
    const avatarDir = path.resolve(appRoot, "public", userId);
    const avatarPath = path.resolve(avatarDir, ctx.file.originalname);

    await new Promise(resolve => rimraf(avatarDir, resolve));
    await fsPromises.mkdir(avatarDir, { recursive: true });
    await fsPromises.writeFile(avatarPath, ctx.file.buffer, err => {
      if (err) reject(err);
      resolve();
    });

    ctx.body = {
      avatarPath: `/${userId}/${ctx.file.originalname}`
    };
  });

module.exports = apiUsersRouter;
