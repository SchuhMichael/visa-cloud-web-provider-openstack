import {NextFunction, Request, Response} from "express";
import {singleton} from "tsyringe";
import {OpenstackService} from "../services";

@singleton()
export class FlavourController {

    private readonly _openstack: OpenstackService;

    /**
     * Create a new flavour controller
     * @param openstack the openstack API http client
     */
    constructor(readonly openstack: OpenstackService) {
        this._openstack = openstack;
    }

    /**
     * Get a list of all flavours
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async all(request: Request, response: Response, next: NextFunction) {
        try {
            const flavours = await this._openstack.flavours();
            response.json(flavours);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a flavour for a given identifier
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async get(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            const flavor = await this._openstack.flavour(id);
            response.json(flavor);
        } catch (error) {
            next(error);
        }
    }

}
