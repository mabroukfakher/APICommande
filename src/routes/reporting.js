import security from "../lib/security";
import ReportingsService from "../services/reportings/reporting";

class ReportingsRoute {
  constructor(router) {
    this.router = router;
    this.registerRoutes();
  }

  registerRoutes() {

    this.router.get(
      "/v1/reportingCI",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getReporingsCI.bind(this)
    );
    this.router.get(
        "/v1/reportingCP",
        security.checkUserScope.bind(this, security.scope.CHEF),
        this.getReporingsCP.bind(this)
      );
  }

  async getReporingsCI(req, res, next) {
    try {
      const data = await ReportingsService.getReporingsCommandeInsetion();
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }
  async getReporingsCP(req, res, next) {
    try {
      const data = await ReportingsService.getReporingsCommandePreparation();
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }

}

export default ReportingsRoute;
