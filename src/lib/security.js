import expressJwt from "express-jwt";
import settings from "./settings";
import AuthHeader from "./auth-header";

const DEVELOPER_MODE = settings.developerMode === true;

const PATHS_WITH_OPEN_ACCESS = ["/api/v1/authorize"];

const scope = {
  CHEF: "chef",
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
    (user.scopes.includes(scope.CHEF) ||
      user.scopes.includes(requiredScope))
    ) {
      next();
    } else {
      res.status(403).send({ status: false, message: "Accès invalide" });
    }
  }
};




const applyMiddleware = app => {
  if (DEVELOPER_MODE === false) {
    app.use(
      expressJwt({
        secret: settings.jwtSecretKey,
      }).unless({ path: PATHS_WITH_OPEN_ACCESS })
    );
  }
};

const getAccessControlAllowOrigin = () =>
  [settings.BaseURL] || "*";

export default {
  checkUserScope,
  scope,
  applyMiddleware,
  getAccessControlAllowOrigin,
  DEVELOPER_MODE
};
