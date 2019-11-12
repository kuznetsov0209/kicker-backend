const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const moment = require("moment");
require("moment/locale/ru");
moment.locale("ru");

const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const session = require("koa-session");
const passport = require("koa-passport");
const cors = require("koa-cors");
const render = require("koa-ejs");
const serve = require("koa-static-server");

const authRouter = require("./routers/authRouter");
const apiGameRatingRouter = require("./routers/apiGameRatingRouter");
const apiUsersRouter = require("./routers/apiUsersRouter");
const apiGamesRouter = require("./routers/apiGamesRouter");
const apiStatsRouter = require("./routers/apiStatsRouter");
const apiProfileRouter = require("./routers/apiProfileRouter");
const apiTournamentsRouter = require("./routers/apiTournamentsRouter");
const apiTeamsRouter = require("./routers/apiTeamsRouter");

const server = new Koa();
render(server, {
  root: path.join(__dirname, "views"),
  layout: false,
  viewExt: "ejs",
  cache: false,
  debug: false
});

server.keys = [process.env.SECRET_KEY];
server.use(cors({ credentials: true }));
server.use(session({}, server));
server.use(passport.initialize());
server.use(passport.session());
server.use(bodyParser());
server.use(serve({ rootDir: "public" }));

server.use(authRouter.routes());
server.use(apiGameRatingRouter.routes());
server.use(apiUsersRouter.routes());
server.use(apiGamesRouter.routes());
server.use(apiStatsRouter.routes());
server.use(apiProfileRouter.routes());
server.use(apiTournamentsRouter.routes());
server.use(apiTeamsRouter.routes());

server.listen(process.env.PORT);
