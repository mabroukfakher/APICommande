import security from "../lib/security";
import SecurityTokensService from "../services/security/tokens";

class SecurityTokensRoute {
  constructor(router) {
    this.router = router;
    this.registerRoutes();
  }

  registerRoutes() {

    this.router.get(
      "/v1/security/tokens",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getTokens.bind(this)
    );

    this.router.post(
      "/v1/security/tokens",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.addToken.bind(this)
    );

    this.router.get(
      "/v1/security/tokens/:id",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getSingleToken.bind(this)
    );
  
    this.router.put(
      "/v1/security/tokens/:id",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.updateToken.bind(this)
    );

    this.router.delete(
      "/v1/security/tokens/:id",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.deleteToken.bind(this)
    );
   

    this.router.post("/v1/authorize", this.DashboardSignin.bind(this));
  }

  async getTokens(req, res, next) {
    try {
      const data = await SecurityTokensService.getTokens(req.query);
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }


  async getSingleToken(req, res, next) {
    try {
      const data = await SecurityTokensService.getSingleToken(req.params.id);
      return data ? res.send(data) : res.status(404).end();
    } catch (err) {
      return next(err);
    }
  }

  async addToken(req, res, next) {
    try {
      const data = await SecurityTokensService.addToken(req.body);
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }

  async updateToken(req, res, next) {
    try {
      const data = await SecurityTokensService.updateToken(
        req.params.id,
        req.body
      );
      return data ? res.send(data) : res.status(404).end();
    } catch (err) {
      return next(err);
    }
  }

  async deleteToken(req, res, next) {
    try {
      const data = await SecurityTokensService.deleteToken(req.params.id);
      return res.end();
    } catch (err) {
      return next(err);
    }
  }

  async DashboardSignin(req, res, next) {
    try {
      const data = await SecurityTokensService.DashboardSignin(req);
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }
}

export default SecurityTokensRoute;
