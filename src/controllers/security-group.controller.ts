import {NextFunction, Request, Response} from "express";
import {singleton} from "tsyringe";
import {OpenstackService} from "../services";

@singleton()
export class SecurityGroupController {

    private readonly _openstack: OpenstackService;

    /**
     * Create a new security group controller
     * @param openstack the openstack API http client
     */
    constructor(readonly openstack: OpenstackService) {
        this._openstack = openstack;
    }

    /**
     * Get a list of security groups
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async all(request: Request, response: Response, next: NextFunction) {
        try {
            const groups = await this._openstack.securityGroups();
            response.json(groups);
        } catch (error) {
            next(error);
        }
    }

}
