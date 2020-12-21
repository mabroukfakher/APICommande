import express from "express";
import SecurityTokensRoute from "./routes/tokens";


const dashRouter = express.Router();

new SecurityTokensRoute(dashRouter);


export default dashRouter;
