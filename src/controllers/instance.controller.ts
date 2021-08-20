import {Request, Response} from "express";
import {singleton} from "tsyringe";
import {OpenstackService} from "../services";
import {NextFunction} from "express-serve-static-core";
import Joi from "joi";
import {HttpException} from "../exceptions";

@singleton()
export class InstanceController {

    private readonly _openstack: OpenstackService;

    /**
     * Create a new instance controller
     * @param openstack the openstack API http client
     */
    constructor(readonly openstack: OpenstackService) {
        this._openstack = openstack;
    }

    /**
     * Get a list of all instances
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async all(request: Request, response: Response, next: NextFunction) {
        try {
            const instances = await this._openstack.instances();
            response.json(instances);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async create(request: Request, response: Response, next: NextFunction) {
        try {
            const json = request.body;
            const schema = Joi.object({
                name: Joi.string().required().not().empty(),
                imageId: Joi.string().required().not().empty(),
                flavourId: Joi.string().required().not().empty(),
                securityGroups: Joi.array().items(Joi.string()),
                metadata: Joi.object().pattern(Joi.string(), Joi.string()),
                bootCommand: Joi.not().required()
            });
            const errors = schema.validate(json);
            if (errors.error) {
                throw new HttpException(errors.error.message, 400);
            } else {
                const {name, imageId, flavourId, securityGroups, metadata, bootCommand} = json;
                const id = await this._openstack.createInstance(
                    name,
                    imageId,
                    flavourId,
                    securityGroups,
                    metadata,
                    bootCommand);
                response.status(201).json({id});
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get an instance for a given identifier
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async get(request: Request, response: Response, next: NextFunction) {
        try {
            const instance = await this._openstack.instance(request.params.id);
            response.json(instance);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get the ip address of a given instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async ip(request: Request, response: Response, next: NextFunction) {
        try {
            const instance = await this._openstack.instance(request.params.id);
            const {address} = instance;
            response.json({ip: address});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add a security group for a given instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async addSecurityGroup(request: Request, response: Response, next: NextFunction) {
        try {
            const json = request.body;
            const schema = Joi.object({
                name: Joi.string().required().not().empty(),
            });
            const errors = schema.validate(json);
            if (errors.error) {
                throw new HttpException(errors.error.message, 400);
            } else {
                const {id} = request.params;
                const {name} = json;
                await this._openstack.addSecurityGroup(id, name);
                response.json({message: 'Added security group'});
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get the security groups for a given instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async securityGroups(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            const groups = await this._openstack.securityGroups(id);
            response.json(groups);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove a security group for a given instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async removeSecurityGroup(request: Request, response: Response, next: NextFunction) {
        try {
            const json = request.body;
            const schema = Joi.object({
                name: Joi.string().required().not().empty(),
            });
            const errors = schema.validate(json);
            if (errors.error) {
                throw new HttpException(errors.error.message, 400);
            } else {
                const {id} = request.params;
                const {name} = json;
                await this._openstack.removeSecurityGroup(id, name);
                response.json({message: 'Removed security group'});
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a list of all instance identifiers
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async identifiers(request: Request, response: Response, next: NextFunction) {
        try {
            const identifiers = await this._openstack.instanceIdentifiers();
            response.json(identifiers)
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete an instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async remove(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            await this._openstack.delete(id);
            response.json({message: 'Deleted instance'});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reboot an instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async reboot(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            await this._openstack.rebootInstance(id);
            response.json({message: 'Rebooting instance'});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Shutdown an instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async shutdown(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            await this._openstack.shutdownInstance(id);
            response.json({message: 'Shutting down instance'});
        } catch (error) {
            next(error);
        }
    }

    /**
     * Start an instance
     * @param request the http request
     * @param response the http response
     * @param next the next middleware handler
     */
    public async start(request: Request, response: Response, next: NextFunction) {
        try {
            const {id} = request.params;
            await this._openstack.startInstance(id);
            response.json({message: 'Starting instance'});
        } catch (error) {
            next(error);
        }
    }

}
