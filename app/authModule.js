const passport = require("koa-passport");
const GoogleStrategy = require("passport-google-auth").Strategy;
const usersModule = require("../app/usersModule");
const db = require("../models");

function initPassportStrategies() {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async function(id, done) {
    try {
      const user = await db.User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.GOOGLE_CALLBACK_HOST}/auth/google/callback`
      },
      async function(accessToken, refreshToken, profile, done) {
        try {
          const { value: email } = profile.emails.find(
            item => item.type.toLowerCase() === "account"
          );

          const params = {
            email,
            photoUrl: profile.image && profile.image.url,
            name:
              profile.displayName ||
              (profile.name &&
                [profile.name.givenName, profile.name.familyName]
                  .filter(str => str)
                  .join(" "))
          };

          // if (!email.includes("@mercurydevelopment.com")) {
          //   done(new Error("The party is private. Mercury only"));
          // }

          let user = await db.User.findOne({ where: { email } });
          if (user) {
            await user.update(params);
          } else {
            user = await db.User.create(params);
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

function authenticatedOnly(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next();
  }
  ctx.throw(401);
}

async function adminOnly(ctx, next) {
  if (ctx.isAuthenticated()) {
    const isAdmin = await usersModule.isAdmin(ctx.state.user.id);
    if (isAdmin) {
      return next();
    }
    ctx.throw(403);
  } else {
    ctx.throw(401);
  }
}

module.exports = {
  initPassportStrategies,
  authenticatedOnly,
  adminOnly
};
