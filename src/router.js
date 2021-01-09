import express from "express";
import SecurityTokensRoute from "./routes/tokens";
import RolesRoute from "./routes/role";
import CommandesInsertionRoute from "./routes/commandeInsertion";
import CommandesPreparationRoute from "./routes/commandePreparation";
import WorksRoute from "./routes/work";
import ReportingsRoute from "./routes/reporting";


const dashRouter = express.Router();

new SecurityTokensRoute(dashRouter);
new RolesRoute(dashRouter);
new CommandesInsertionRoute(dashRouter);
new CommandesPreparationRoute(dashRouter);
new WorksRoute(dashRouter);
new ReportingsRoute(dashRouter);


export default dashRouter;
