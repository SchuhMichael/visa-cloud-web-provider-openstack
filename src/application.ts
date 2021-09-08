import "reflect-metadata";
import {authenticationMiddleware, errorHandlerMiddleware, logger} from './utils';
import express from 'express'
import * as http from 'http';
import {
    FlavourController,
    ImageController,
    InstanceController,
    MetricsController,
    SecurityGroupController
} from "./controllers";
import {APPLICATION_CONFIG} from './application-config';
import {container} from "./ioc";

export class Application {

    private _server: http.Server;

    constructor() {
    }

    async start(): Promise<null> {
        if (!this._server) {
            // Start the application
            logger.info('Starting application');

            const app = express();
            const router = express.Router();
            app.use(express.json());

            router.use(authenticationMiddleware);

            /**
             * Routing for instances
             */
            router.get('/instances', (req, res, next) => container.resolve(InstanceController).all(req, res, next));
            router.post('/instances', (req, res, next) => container.resolve(InstanceController).create(req, res, next));
            router.get('/instances/identifiers', (req, res, next) => container.resolve(InstanceController).identifiers(req, res, next));
            router.get('/instances/:id', (req, res, next) => container.resolve(InstanceController).get(req, res, next));
            router.get('/instances/:id/security_groups', (req, res, next) => container.resolve(InstanceController).securityGroups(req, res, next));
            router.post('/instances/:id/security_groups', (req, res, next) => container.resolve(InstanceController).addSecurityGroup(req, res, next));
            router.post('/instances/:id/security_groups/remove', (req, res, next) => container.resolve(InstanceController).removeSecurityGroup(req, res, next));
            router.get('/instances/:id/ip', (req, res, next) => container.resolve(InstanceController).ip(req, res, next));
            router.delete('/instances/:id', (req, res, next) => container.resolve(InstanceController).remove(req, res, next));
            router.post('/instances/:id/start', (req, res, next) => container.resolve(InstanceController).start(req, res, next));
            router.post('/instances/:id/shutdown', (req, res, next) => container.resolve(InstanceController).shutdown(req, res, next));
            router.post('/instances/:id/reboot', (req, res, next) => container.resolve(InstanceController).reboot(req, res, next));

            /**
             * Routing for images
             */
            router.get('/images', (req, res, next) => container.resolve(ImageController).all(req, res, next));
            router.get('/images/:id', (req, res, next) => container.resolve(ImageController).get(req, res, next));

            /**
             * Routing for flavours
             */
            router.get('/flavours', (req, res, next) => container.resolve(FlavourController).all(req, res, next));
            router.get('/flavours/:id', (req, res, next) => container.resolve(FlavourController).get(req, res, next));

            /**
             * Routing for security groups
             */
            router.get('/security_groups', (req, res, next) => container.resolve(SecurityGroupController).all(req, res, next));

            /**
             * Routing for metrics
             */
            router.get('/metrics', (req, res, next) => container.resolve(MetricsController).all(req, res, next));

            app.use('/api', router);
            app.use(errorHandlerMiddleware);

            const port = APPLICATION_CONFIG().server.port;
            const host = APPLICATION_CONFIG().server.host;
            this._server = app.listen(port, host);

            logger.info(`Application started (listening on ${host}:${port})`);
        }

        return null;
    }

    async stop(): Promise<null> {
        if (this._server) {
            logger.info('Stopping http server...');
            this._server.close();

            logger.info('... http server stopped');
            this._server = null;
        }

        return null;
    }


}

