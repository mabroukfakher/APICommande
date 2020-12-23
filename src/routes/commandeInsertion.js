import security from "../lib/security";
import ComposantsService from "../services/commande/Insetion/composant";
import CommandeService from "../services/commande/Insetion/commande";

class CommandesRoute {
	constructor(router) {
		this.router = router;
		this.registerRoutes();
	}

	registerRoutes() {
		//commandes
		this.router.get(
			'/v1/commandes',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.getCommandes.bind(this)
		);

		this.router.post(
			'/v1/commandes',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.addCommande.bind(this)
		);

		this.router.get(
			'/v1/commandes/:commandeId',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.getSingleCommande.bind(this)
		);

		this.router.put(
			'/v1/commandes/:commandeId',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.updateCommande.bind(this)
		);

		this.router.delete(
			'/v1/commandes/:commandeId',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.deleteCommande.bind(this)
		);
		
		//composants
		this.router.post(
			"/v1/commandes/:commandeId/composants",
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.uploadComposant.bind(this)
		);

		this.router.get(
			'/v1/commandes/:commandeId/composants',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.getcomposants.bind(this)
		);

		this.router.delete(
			'/v1/commandes/:commandeId/composants/:composantId',
			security.checkUserScope.bind(this, security.scope.CHEF),
			this.deletecomposant.bind(this)
		);
	}
	//commandes
	getCommandes(req, res, next) {
		CommandeService.getCommandes(req.query)
			.then(data => {
				res.send(data);
			})
			.catch(next);
	}

	getSingleCommande(req, res, next) {
		CommandeService.getSingleCommande(req.params.commandeId)
			.then(data => {
				if (data) {
					res.send(data);
				} else {
					res.status(404).end();
				}
			})
			.catch(next);
	}

	addCommande(req, res, next) {
		CommandeService.addCommande(req.body)
			.then(data => {
				res.send(data);
			})
			.catch(next);
	}

	updateCommande(req, res, next) {
		CommandeService.updateCommande(req.params.commandeId, req.body)
			.then(data => {
				if (data) {
					res.send(data);
				} else {
					res.status(404).end();
				}
			})
			.catch(next);
	}

	deleteCommande(req, res, next) {
		CommandeService.deleteCommande(req.params.commandeId)
			.then(data => {
				res.send(data);
			})
			.catch(next);
	}

	//composants
	async uploadComposant(req, res, next) {
		await ComposantsService.uploadComposant(req,res,next);
	}

  	getcomposants(req, res, next) {
		ComposantsService.getcomposants(req.params.commandeId)
			.then(data => {
				res.send(data);
			})
			.catch(next);
	}

	deletecomposant(req, res, next) {
		ComposantsService.deletecomposant(
			req.params.commandeId,
			req.params.composantId
		).then(data => {
			res.send(data);
		});
	}

}

export default CommandesRoute;
