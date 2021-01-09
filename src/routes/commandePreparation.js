import security from "../lib/security";
import CommandeService from "../services/commande/preparation/commande";

class CommandesRoute {
  constructor(router) {
    this.router = router
    this.registerRoutes()
  }

  registerRoutes() {
    this.router.get(
      "/v1/commandesPreparation",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getCommandes.bind(this)
    )
    this.router.get(
      "/v1/postsStatus",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getPosts.bind(this)
    )
    this.router.post(
      "/v1/commandesPreparation",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.addCommande.bind(this)
    )

    this.router.get(
      "/v1/commandesPreparation/:commandeId/get",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.getSingleCommande.bind(this)
    )

    this.router.delete(
      "/v1/commandesPreparation/:commandeId/delete",
      security.checkUserScope.bind(this, security.scope.CHEF),
      this.deleteCommande.bind(this)
    )
  }

  getCommandes(req, res, next) {
    CommandeService.getCommandes(req.query)
      .then((data) => {
        res.send(data)
      })
      .catch(next)
  }
  getPosts(req, res, next) {
    CommandeService.getPosts(req.query)
      .then((data) => {
        res.send(data)
      })
      .catch(next)
  }

  getSingleCommande(req, res, next) {
    CommandeService.getSingleCommande(req.params.commandeId)
      .then((data) => {
        if (data) {
          res.send(data)
        } else {
          res.status(404).end()
        }
      })
      .catch(next)
  }

  async addCommande(req, res, next) {
    await CommandeService.addCommande(req, res, next)
  }

  deleteCommande(req, res, next) {
    CommandeService.deleteCommande(req.params.commandeId)
      .then((data) => {
        res.send(data)
      })
      .catch(next)
  }
}

export default CommandesRoute;
