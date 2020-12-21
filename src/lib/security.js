import expressJwt from "express-jwt";
import settings from "./settings";
import SecurityTokensService from "../services/security/tokens";
import AuthHeader from "./auth-header";

const DEVELOPER_MODE = settings.developerMode === true;
const SET_TOKEN_AS_REVOKEN_ON_EXCEPTION = true;

const PATHS_WITH_OPEN_ACCESS = ["/api/v1/authorize", /\/ajax\//i];

const scope = {
  ADMIN: "admin",
  PREPARATION: "preparation",
  Insertion: "insertion"
};

const checkUserScope = (requiredScope, req, res, next) => {

  if (DEVELOPER_MODE === true) {
    next();
  } else {
    const user = AuthHeader.decodeUserLoginAuth(req.headers["x-access-token"]);

    if (
    user &&
    user.scopes &&
    user.scopes.length > 0 &&
    (user.scopes.includes(scope.ADMIN) ||
      user.scopes.includes(requiredScope))
    ) {
      next();
    } else {
      res.status(403).send({ status: false, message: "Accès invalide" });
    }
  }
};

const checkUserToken = (req, res, next) => {

  try {
    const user = AuthHeader.decodeUserLoginAuth(req.headers["x-access-token"]);
    if (user.id !== undefined) {
      req.user = user;
      next();
    } else {
      return res.status(401).send({
        status: false,
        messageEN: "token_error",
        message: "token_error"
      });
    }
  } catch (err) {
    return res.status(401).send({
      status: false,
      messageEN: "token_error",
      message: "token_error"
    });
  }

};


const checkTokenInBlacklistCallback = async (req, payload, done) => {
  try {
    const { jti } = payload;
    const blacklist = await SecurityTokensService.getTokensBlacklist();
    const tokenIsRevoked = blacklist.includes(jti);
    return done(null, tokenIsRevoked);
  } catch (e) {
    done(e, SET_TOKEN_AS_REVOKEN_ON_EXCEPTION);
  }
};

const applyMiddleware = app => {
  if (DEVELOPER_MODE === false) {
    app.use(
      expressJwt({
        secret: settings.jwtSecretKey,
        isRevoked: checkTokenInBlacklistCallback
      }).unless({ path: PATHS_WITH_OPEN_ACCESS })
    );
  }
};

const getAccessControlAllowOrigin = () =>
  [settings.adminBaseURL] || "*";

export default {
  checkUserScope,
  scope,
  applyMiddleware,
  getAccessControlAllowOrigin,
  DEVELOPER_MODE,
  checkUserToken
};
