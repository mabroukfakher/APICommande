import express from "express";
import SecurityTokensRoute from "./routes/routeDash/tokens";


const dashRouter = express.Router();

new SecurityTokensRoute(dashRouter);


export default dashRouter;
