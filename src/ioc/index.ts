import {IocContainer} from '@tsoa/runtime';
import {container} from 'tsyringe';
import {OpenstackAuthenticator, OpenstackService} from "../services";
import {GceServiceAlpha} from "../services";
import {APPLICATION_CONFIG} from "../application-config";
import {logger} from '../utils';


container.register<GceServiceAlpha>(GceServiceAlpha, {
    useValue: new GceServiceAlpha()
});

logger.debug("Registered GceServiceAlpha in ioc container");

export const iocContainer: IocContainer = {
    get: <T>(controller: { prototype: T }): T =>
        container.resolve<T>(controller as never),
};
export {container};
export default iocContainer;
