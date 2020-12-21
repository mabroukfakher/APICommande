import express from "express";
import SecurityTokensRoute from "./routes/tokens";
import RolesRoute from "./routes/role";


const dashRouter = express.Router();

new SecurityTokensRoute(dashRouter);
new RolesRoute(dashRouter);


export default dashRouter;
