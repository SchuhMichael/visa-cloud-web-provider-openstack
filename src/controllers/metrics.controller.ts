import {NextFunction, Request, Response} from "express";
import {singleton} from "tsyringe";
import {GceServiceAlpha} from "../services";

@singleton()
export class MetricsController {

    private readonly _openstack: GceServiceAlpha;

    /**
     * Create a new image controller
     * @param openstack the openstack API http client.
     */
    constructor(readonly openstack: GceServiceAlpha) {
        this._openstack = openstack;
    }

    /**
     * Get a list of metrics
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async all(request: Request, response: Response, next: NextFunction) {
        try {
            const metrics = await this._openstack.metrics();
            response.json(metrics);
        } catch (error) {
            next(error);
        }
    }


}
