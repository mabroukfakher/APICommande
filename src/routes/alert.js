import security from "../lib/security";
import AlertsService from "../services/alert/alert";

class AlertsRoute {
  constructor(router) {
    this.router = router;
    this.registerRoutes();
  }

  registerRoutes() {

    this.router.get(
      "/v1/alert",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getAlert.bind(this)
    );
    this.router.post(
        "/v1/alert",
        security.checkUserScope.bind(this, security.scope.Mixte),
        this.addAlert.bind(this)
    );
    this.router.put(
        "/v1/alert/:id/stopAlert",
        security.checkUserScope.bind(this, security.scope.CHEF),
        this.updateAlert.bind(this)
    );
  }

  async getAlert(req, res, next) {
    try {
      const data = await AlertsService.getAlert();
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }
  async addAlert(req, res, next) {
    try {
      const data = await AlertsService.addAlert(req.body);
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }
  async updateAlert(req, res, next) {
    try {
      const data = await AlertsService.updateAlert(req.params.id);
      return res.send(data);
    } catch (err) {
      return next(err);
    }
  }

}

export default AlertsRoute;
