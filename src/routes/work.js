import security from "../lib/security";
import WorksService from "../services/work/work";

class WorksRoute {
    constructor(router) {
        this.router = router;
        this.registerRoutes();
    }

    registerRoutes() {

        this.router.post(
            "/v1/works/lanceWork",
            security.checkUserScope.bind(this, security.scope.CHEF),
            this.addWork.bind(this)
        );

        this.router.get(
            "/v1/works/:customerId/getprofil",
            this.getProfil.bind(this)
        );
        /******************************************* */
        this.router.get(
            "/v1/works",
            security.checkUserScope.bind(this, security.scope.CHEF),
            this.getWorks.bind(this)
        );
        
        this.router.get(
            "/v1/works/:id/getSingleWork",
            security.checkUserScope.bind(this, security.scope.CHEF),
            this.getSingleWork.bind(this)
        );

 
    
        this.router.put(
            "/v1/works/:id/updateWork",
            security.checkUserScope.bind(this, security.scope.CHEF),
            this.updateWork.bind(this)
        );

        this.router.delete(
            "/v1/works/:id/deleteWork",
            security.checkUserScope.bind(this, security.scope.CHEF),
            this.deleteWork.bind(this)
        );
    
    }
    getProfil(req, res, next) {
        WorksService.getProfil(req.params.customerId,req.query)
            .then(data => {
                res.send(data);
            })
            .catch(next);
    }

    addWork(req, res, next) {
        WorksService.addWork(req.body)
            .then(data => {
                res.send(data);
            })
            .catch(next);
    }
    /***********************************************************************/
    getWorks(req, res, next) {
        WorksService.getWorks(req.query)
        .then(data => {
            res.send(data);
        })
        .catch(next);
    }

    getSingleWork(req, res, next) {
        WorksService.getSingleWork(req.params.id)
            .then(data => {
                res.send(data);
            })
            .catch(next);
    }

    updateWork(req, res, next) {
        WorksService.updateWork(req.params.id,req.body)
            .then(data => {
                res.send(data);
            })
            .catch(next);
    }

    deleteWork(req, res, next) {
        WorksService.deleteWork(req.params.id)
            .then(data => {
                res.send(data);
            })
            .catch(next);
    }

}

export default WorksRoute;
