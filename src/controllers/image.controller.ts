import {NextFunction, Request, Response} from "express";
import {singleton} from "tsyringe";
import {OpenstackService} from "../services";

@singleton()
export class ImageController {

    private readonly _openstack: OpenstackService;

    /**
     * Create a new image controller
     * @param openstack the openstack API http client
     */
    constructor(readonly openstack: OpenstackService) {
        this._openstack = openstack;
    }

    /**
     * Get a list of all images
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async all(request: Request, response: Response, next: NextFunction) {
        try {
            const images = await this._openstack.images();
            response.json(images);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get an image for a given identifier
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async get(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            const image = await this._openstack.image(id);
            response.json(image);
        } catch (error) {
            next(error);
        }
    }

}
