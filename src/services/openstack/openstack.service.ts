import {singleton} from "tsyringe";
import {Flavour, Image, Instance, InstanceFault, Metrics} from "../../models";
import axios, {AxiosInstance} from "axios";
import {OpenstackAuthenticator} from "./openstack-authenticator";
import {HttpException} from "../../exceptions";
import {CloudProvider} from "../cloud-provider.interface";
import {logger} from "../../utils";
import {Mutex} from "async-mutex";

@singleton()
export class OpenstackService implements CloudProvider {

    private readonly _client: AxiosInstance;
    private readonly _endpoints: { computeEndpoint: string; imageEndpoint: string };
    private readonly _network: { addressProvider: string; addressProviderUUID: string };
    private readonly _authenticator: OpenstackAuthenticator;
    private readonly _mutex: Mutex;

    /**
     * Create a new openstack service
     * @param endpoints the openstack api endpoints
     * @param network the openstack network configuration
     * @param authenticator the openstack authenticator service
     * @param timeout the openstack http timeout
     */
    constructor(
        endpoints: {
            computeEndpoint: string,
            imageEndpoint: string
        },
        network: { addressProvider: string; addressProviderUUID: string },
        authenticator: OpenstackAuthenticator,
        timeout: number
    ) {
        this._endpoints = endpoints;
        this._network = network;
        this._client = this.createClient(timeout);
        this._authenticator = authenticator;
        this._mutex = new Mutex();
    }

    /**
     * Create a new axios client
     * @param timeout the http timeout for requests
     * @private
     */
    private createClient(timeout: number): AxiosInstance {
        const client = axios.create({
            timeout
        });
        client.interceptors.request.use(async config => {

            if (this._authenticator.isAuthenticated() === false) {
                const release = await this._mutex.acquire();
                try {
                    await this._authenticator.authenticate();
                } finally {
                    release();
                }
            }
            const {token} = this._authenticator.getPrincipal();
            config.headers['X-Auth-Token'] = token;
            return config;
        });
        client.interceptors.response.use((response) => response, (error) => {
            if (error instanceof HttpException) {
                throw error;
            }
            if (axios.isAxiosError(error)) {
                throw new HttpException(error.message, error?.response?.status);
            }
        });
        return client;
    }

    /**
     * Convert the openstack server response
     * @param server
     * @private
     */
    private toInstance(server: any): Instance {
        const fault = (server): InstanceFault => {
            const data = server['fault'];
            if (data) {
                const {message, code, details, created} = data;
                return {
                    message,
                    code,
                    details: details,
                    createdAt: created
                }
            }
            return null;
        };

        const securityGroups = (groups): string[] => {
            if (groups) {
                return groups.map(group => group.name);
            }
            return [];
        }
        const address = (addresses): string => {
            if (addresses) {
                const provider = addresses[this._network.addressProvider];
                if (provider) {
                    if (provider.length > 0) {
                        return provider[0]['addr'];
                    }
                }
            }
            return null;
        };
        const {id, name, flavor, image, created, addresses, security_groups, status} = server;
        return {
            id,
            name: name,
            state: status,
            flavorId: flavor.id,
            imageId: image.id,
            createdAt: created,
            address: address(addresses),
            securityGroups:  securityGroups(security_groups),
            fault: fault(server)
        };
    }

    /**
     * Get an instance for a given instance identifier
     * @param id the instance identifier
     */
    async instance(id: string): Promise<Instance> {
        logger.info(`Fetching instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}`;
        const result = await this._client.get(url);
        const {data} = result;
        const {server} = data;
        return this.toInstance(server);
    }

    /**
     * Get a list of instances
     */
    async instances(): Promise<Instance[]> {
        logger.info(`Fetching instances`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/detail`;
        const result = await this._client.get(url);
        const {data} = result;
        const {servers} = data;
        return servers.map(this.toInstance);
    }

    /**
     * Get a list of instance identifiers
     */
    async instanceIdentifiers(): Promise<string[]> {
        logger.info(`Fetching instance identifiers`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers`;
        const result = await this._client.get(url);
        const {data} = result;
        const {servers} = data;
        return servers.map(server => server.id);
    }

    /**
     * Get the security groups for a given instance identifier
     * @param id the instance identifier
     */
    async securityGroups(id: string): Promise<string[]> {
        logger.info(`Fetching security groups for instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/os-security-groups`;
        const result = await this._client.get(url);
        const {data} = result;
        const groups = data.security_groups;
        return groups.map(group => group.name);
    }

    /**
     * Remove a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async removeSecurityGroup(id: string, name: string): Promise<void> {
        logger.info(`Removing security group ${name} for instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        await this._client.post(url, {
            removeSecurityGroup: {
                name
            }
        });
    }

    /**
     * Add a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async addSecurityGroup(id: string, name: string): Promise<void> {
        logger.info(`Adding security group ${name} for instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        await this._client.post(url, {
            addSecurityGroup: {
                name
            }
        });
    }

    /**
     * Create a new instance
     * @param name the name of the instance
     * @param imageId the openstack image identifier
     * @param flavourId the openstack flavour identifier
     * @param securityGroups a list of openstack security groups
     * @param metadata the cloud init metadata
     * @param bootCommand the boot command to use when starting the instance
     */
    async createInstance(name: string,
                         imageId: string,
                         flavourId: string,
                         securityGroups: string[],
                         metadata: Map<string, string>,
                         bootCommand: string): Promise<string> {
        logger.info(`Creating new instance: ${name}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers`;
        const server = {
            name,
            imageRef: imageId,
            flavorRef: flavourId,
            security_groups: securityGroups.map(group => {
                return {
                    name: group
                }
            }),
            networks: [
                {
                    uuid: this._network.addressProviderUUID
                }
            ],
            metadata,
            user_data: Buffer.from(bootCommand).toString('base64')
        }

        const result = await this._client.post(url, {server});
        const {data} = result;
        return data.server.id;
    }

    /**
     * Shutdown an instance
     * @param id the instance identifier
     */
    async shutdownInstance(id: string): Promise<void> {
        logger.info(`Shutting down instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        await this._client.post(url, {'os-stop': null});
    }

    /**
     * Start an instance
     * @param id the instance identifier
     */
    async startInstance(id: string): Promise<void> {
        logger.info(`Starting instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        await this._client.post(url, {'os-start': null});
    }

    /**
     * Reboot an instance
     * @param id the instance identifier
     */
    async rebootInstance(id: string): Promise<void> {
        logger.info(`Rebooting instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        await this._client.post(url, {'reboot': {'type': 'HARD'}});
    }

    /**
     * Get a list of images
     */
    async images(): Promise<Image[]> {
        logger.info(`Fetching images`);
        const url = `${this._endpoints.imageEndpoint}/v2/images`;
        const result = await this._client.get(url);
        const {data} = result;
        return data.images.map(image => {
            return {
                id: image.id,
                name: image.name,
                size: image.size,
                createdAt: image['created_at']
            };
        });
    }

    /**
     * Delete an instance
     * @param id the instance identifier
     */
    async delete(id: string): Promise<void> {
        logger.info(`Deleting instance: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}`;
        await this._client.delete(url);
    }

    /**
     * Get an image
     * @param id the image identifier
     */
    async image(id: string): Promise<Image> {
        logger.info(`Fetching image: ${id}`);
        const url = `${this._endpoints.imageEndpoint}/v2/images/${id}`;
        const result = await this._client.get(url);
        const {data} = result;
        return {
            id: data.id,
            name: data.name,
            size: data.size,
            createdAt: data['created_at']
        };
    }

    /**
     * Get a list of flavours
     */
    async flavours(): Promise<Flavour[]> {
        logger.info(`Fetching flavours`);
        const url = `${this._endpoints.computeEndpoint}/v2/flavors/detail`;
        const result = await this._client.get(url);
        const {data} = result;
        return data.flavors.map(image => {
            return {
                id: image.id,
                name: image.name,
                cpus: image.vcpus,
                disk: image.disk,
                ram: image.ram
            };
        });
    }

    /**
     * Get a flavour
     * @param id the flavour identifier
     */
    async flavour(id: string): Promise<Flavour> {
        logger.info(`Fetching flavour: ${id}`);
        const url = `${this._endpoints.computeEndpoint}/v2/flavors/${id}`;
        const result = await this._client.get(url);
        const {data} = result;
        const flavour = data.flavor;
        return {
            id: flavour.id,
            name: flavour.name,
            cpus: flavour.vcpus,
            ram: flavour.ram,
            disk: flavour.disk
        };
    }

    /**
     * Get the cloud metrics (i.e. memory used, number of instances etc.)
     */
    async metrics(): Promise<Metrics> {
        logger.info(`Fetching metrics`);
        const url = `${this._endpoints.computeEndpoint}/v2/limits`;
        const result = await this._client.get(url);
        const {data} = result;
        const limits = data['limits']['absolute'];
        return {
            maxTotalRamSize: limits.maxTotalRAMSize,
            totalRamUsed: limits.totalRAMUsed,
            totalInstancesUsed: limits.totalInstancesUsed,
            maxTotalInstances: limits.maxTotalInstances,
            maxTotalCores: limits.maxTotalCores,
            totalCoresUsed: limits.totalCoresUsed,
        };
    }


}
