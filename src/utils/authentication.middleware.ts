import {NextFunction, Request, Response} from "express";

import {APPLICATION_CONFIG} from "../application-config";
import {logger} from "./logger";

/**
 * Verifies the request header 'x-auth-token' if this has been specified in the application config
 */
export function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    const authToken = req.headers['x-auth-token'];

    if (APPLICATION_CONFIG().server.authToken != null && authToken !== APPLICATION_CONFIG().server.authToken) {
        logger.info(`Unauthorized request`);
        res.status(401).send(`Unauthorized`);

    } else {
        next();
    }
}

