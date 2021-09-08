import {IocContainer} from '@tsoa/runtime';
import {container} from 'tsyringe';
import {OpenstackAuthenticator, OpenstackService} from "../services";
import {APPLICATION_CONFIG} from "../application-config";

container.register<OpenstackService>(OpenstackService, {
    useValue: new OpenstackService(
        {
            computeEndpoint: APPLICATION_CONFIG().openstack.computeEndpoint,
            imageEndpoint: APPLICATION_CONFIG().openstack.imageEndpoint,
            networkEndpoint: APPLICATION_CONFIG().openstack.networkEndpoint
        },
        {
            addressProvider: APPLICATION_CONFIG().openstack.addressProvider,
            addressProviderUUID: APPLICATION_CONFIG().openstack.addressProviderUUID
        },
        new OpenstackAuthenticator(
            APPLICATION_CONFIG().openstack.identityEndpoint,
            APPLICATION_CONFIG().openstack.applicationId,
            APPLICATION_CONFIG().openstack.applicationSecret,
            APPLICATION_CONFIG().openstack.timeout
        ),
        APPLICATION_CONFIG().openstack.timeout
    )
});
export const iocContainer: IocContainer = {
    get: <T>(controller: { prototype: T }): T =>
        container.resolve<T>(controller as never),
};
export {container};
export default iocContainer;
