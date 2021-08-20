import {NextFunction, Request, Response} from "express";
import {HttpException} from "../exceptions";
import {logger} from "./logger";

function handleDefault(response: Response, message: string) {
    logger.error(message);
    response.status(500);
    response.send('An error occurred');
    response.end();
}

function handleNotFound(response: Response) {
    response.status(404);
    response.json({message: "Not found"});
}

function handleBadRequest(response: Response, message: string) {
    response.status(400);
    response.json({error: message});
}

export function errorHandlerMiddleware(error: any, request: Request, response: Response, next: NextFunction) {
    const message = error.message;
    if (error instanceof HttpException) {
        if (error.isStatus(404)) {
            return handleNotFound(response);
        } else if (error.isStatus(400)) {
            return handleBadRequest(response, message);
        }
    }
    return handleDefault(response, message);
}

