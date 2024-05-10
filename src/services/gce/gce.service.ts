import {singleton} from "tsyringe";
import {CloudInstanceState, Flavour, Image, Instance, InstanceFault, Metrics} from "../../models";
import axios, {AxiosInstance} from "axios";
import {HttpException} from "../../exceptions";
import {CloudProvider} from "../cloud-provider.interface";
import {APPLICATION_CONFIG} from '../../application-config';

import {logger} from "../../utils";
import {Mutex} from "async-mutex";

import { InstancesClient } from '@google-cloud/compute';

@singleton()
export class GceServiceAlpha implements CloudProvider {

    private readonly _client: InstancesClient;
    private readonly _mutex: Mutex;
    private readonly projectId: string;

    /**
     * Create a new gce service
     */
    constructor() {
        this._client = this.createClient();
        this._mutex = new Mutex();
    }

    /**
     * Create a new compute client for gce
     * @private
     */
    private createClient():  InstancesClient {
        const client = new InstancesClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }

    /**
     * Convert the openstack server response
     * @param server
     * @private
     */
    private toInstance(server: any): Instance {
        logger.debug(`private toInstance(server: any): Instance = {id: 'dummy-id', name: 'dummy-name', state: CloudInstanceState.ACTIVE, flavourId: 'dummy-flavour-id', imageId: 'dummy-image-id', createdAt: 'dummy-date', address: 'dummy-address', securityGroups: ['dummy-sec-group-0'], fault: null}`);
        return {id: 'dummy-id', name: 'dummy-name', state: CloudInstanceState.ACTIVE, flavourId: 'dummy-flavour-id', imageId: 'dummy-image-id', createdAt: 'dummy-date', address: 'dummy-address', securityGroups: ['dummy-sec-group-0'], fault: null};
        // const fault = (server): InstanceFault => {
        //     const data = server['fault'];
        //     if (data) {
        //         const {message, code, details, created} = data;
        //         return {
        //             message,
        //             code,
        //             details: details,
        //             createdAt: created
        //         }
        //     }
        //     return null;
        // };

        // const securityGroups = (groups): string[] => {
        //     if (groups) {
        //         return groups.map(group => group.name);
        //     }
        //     return [];
        // }

        // const address = (addresses): string => {
        //     if (addresses) {
        //         const provider = addresses[this._network.addressProvider];
        //         if (provider) {
        //             if (provider.length > 0) {
        //                 return provider[0]['addr'];
        //             }
        //         }
        //     }
        //     return null;
        // };

        // const state = (status, taskStatus): CloudInstanceState => {
        //     switch (status) {
        //         case "BUILD":
        //         case "REBUILD":
        //             return CloudInstanceState.BUILDING;
        //         case "ACTIVE":
        //             if ("powering-off" === taskStatus) {
        //                 return CloudInstanceState.STOPPING;
        //             } else {
        //                 return CloudInstanceState.ACTIVE;
        //             }
        //         case "HARD_REBOOT":
        //         case "REBOOT":
        //             return CloudInstanceState.REBOOTING;
        //         case "MIGRATING":
        //         case "RESCUE":
        //         case "RESIZE":
        //         case "REVERT_RESIZE":
        //         case "VERIFY_SIZE":
        //             return CloudInstanceState.UNAVAILABLE;
        //         case "DELETED":
        //         case "SHELVED":
        //         case "SHELVED_OFFLOADED":
        //         case "SOFT_DELETED":
        //             return CloudInstanceState.DELETED;
        //         case "PAUSED":
        //         case "SHUTOFF":
        //         case "SUSPENDED":
        //             return CloudInstanceState.STOPPED;
        //         case "ERROR":
        //             return CloudInstanceState.ERROR;
        //         case "UNKNOWN":
        //         default:
        //             return CloudInstanceState.UNKNOWN;
        //     }
        // }

        // const {id, name, flavor, image, created, addresses, security_groups, status} = server;
        // return {
        //     id,
        //     name: name,
        //     // getting the task state is not very nice....
        //     state: state(status, server['OS-EXT-STS:task_state']),
        //     flavourId: flavor.id,
        //     imageId: image.id,
        //     createdAt: created,
        //     address: address(addresses),
        //     securityGroups: securityGroups(security_groups),
        //     fault: fault(server)
        // };

    }

    /**
     * Get an instance for a given instance identifier
     * @param id the instance identifier
     */
    async instance(id: string): Promise<Instance> {
        logger.debug('async instance(id: string): Promise<Instance> = {id: "dummy-id", name: "dummy-name", state: CloudInstanceState.ACTIVE, flavourId: "dummy-flavour-id", imageId: "dummy-image-id", createdAt: "dummy-date", address: "dummy-address", securityGroups: ["dummy-sec-group-0"], fault: null}');
        return {id: 'dummy-id', name: 'dummy-name', state: CloudInstanceState.ACTIVE, flavourId: 'dummy-flavour-id', imageId: 'dummy-image-id', createdAt: 'dummy-date', address: 'dummy-address', securityGroups: ['dummy-sec-group-0'], fault: null};
        // logger.info(`Fetching instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const {server} = data;
        // return this.toInstance(server);
    }

    /**
     * Get a list of instances
     */
    async instances(): Promise<Instance[]> {
        logger.debug('async instances(): Promise<Instance[]> = [{id: "dummy-id", name: "dummy-name", state: CloudInstanceState.ACTIVE, flavourId: "dummy-flavour-id", imageId: "dummy-image-id", createdAt: "dummy-date", address: "dummy-address", securityGroups: ["dummy-sec-group-0"], fault: null}]');
        logger.info(`Fetching instances`);
        const projectId = 'visa-420109';
        logger.debug(`gce authenticated with key at ${APPLICATION_CONFIG().gce.keyFile}`);
        const aggListRequest = this._client.aggregatedListAsync({project: projectId,}); 
        for await (const [zone, instancesObject] of aggListRequest) {
            const instances = instancesObject.instances;
            if (instances && instances.length > 0) {
              console.log(` ${zone}`);
              for (const instance of instances) {
                console.log(` - ${instance.name} (${instance.machineType})`);
              }
            }
          }
        return [{id: 'dummy-id', name: 'dummy-name', state: CloudInstanceState.ACTIVE, flavourId: 'dummy-flavour-id', imageId: 'dummy-image-id', createdAt: 'dummy-date', address: 'dummy-address', securityGroups: ['dummy-sec-group-0'], fault: null}];
        
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/detail`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const {servers} = data;
        // return servers.map(this.toInstance.bind(this));
    }

    /**
     * Get a list of instance identifiers
     */
    async instanceIdentifiers(): Promise<string[]> {
        logger.debug(`async instanceIdentifiers(): Promise<string[]> = ['dummy-id-1', 'dummy-id-2']`);
        return ['dummy-id-1', 'dummy-id-2']
        // logger.info(`Fetching instance identifiers`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const {servers} = data;
        // return servers.map(server => server.id);
    }

    /**
     * Get the security groups for a given instance identifier
     * @param id the instance identifier
     */
    async securityGroupsForInstance(id: string): Promise<string[]> {
        logger.debug(`async securityGroupsForInstance(id: string): Promise<string[]> = ['dummy-sec-group-0','dummy-sec-group-1']`);
        return ['dummy-sec-group-0','dummy-sec-group-1']
        // logger.info(`Fetching security groups for instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/os-security-groups`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const groups = data.security_groups;
        // return groups.map(group => group.name);
    }

    /**
     * Remove a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async removeSecurityGroupFromInstance(id: string, name: string): Promise<void> {
        logger.debug(`async removeSecurityGroupFromInstance(id: string, name: string): Promise<void> = {}`);
        return ;
        // logger.info(`Removing security group ${name} for instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        // await this._client.post(url, {
        //     removeSecurityGroup: {
        //         name
        //     }
        // });
    }

    /**
     * Add a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async addSecurityGroupForInstance(id: string, name: string): Promise<void> {
        logger.debug(`async addSecurityGroupForInstance(id: string, name: string): Promise<void>'`);
        return ;
        // logger.info(`Adding security group ${name} for instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        // await this._client.post(url, {
        //     addSecurityGroup: {
        //         name
        //     }
        // });
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
        logger.debug(`async createInstance(name: string, imageId: string, flavourId: string, securityGroups: string[], metadata: Map<string, string>, bootCommand: string): Promise<string> = 'dummy-id'`);
        return 'dummy-id'
        // logger.info(`Creating new instance: ${name}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers`;
        // const server = {
        //     name,
        //     imageRef: imageId,
        //     flavorRef: flavourId,
        //     security_groups: securityGroups.map(group => {
        //         return {
        //             name: group
        //         }
        //     }),
        //     networks: this._network.addressProviderUUID.split(',').map((uuid) => (
        //         {
        //             uuid: uuid
        //         }
        //     )),
        //     metadata,
        //     user_data: Buffer.from(bootCommand).toString('base64')
        // }

        // const result = await this._client.post(url, {server});
        // const {data} = result;
        // return data.server.id;
    }

    /**
     * Shutdown an instance
     * @param id the instance identifier
     */
    async shutdownInstance(id: string): Promise<void> {
        logger.debug(`async shutdownInstance(id: string): Promise<void>`);
        return ;
        // logger.info(`Shutting down instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        // await this._client.post(url, {'os-stop': null});
    }

    /**
     * Start an instance
     * @param id the instance identifier
     */
    async startInstance(id: string): Promise<void> {
        logger.debug(`async startInstance(id: string): Promise<void>`);
        return ;
        // logger.info(`Starting instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        // await this._client.post(url, {'os-start': null});
    }

    /**
     * Reboot an instance
     * @param id the instance identifier
     */
    async rebootInstance(id: string): Promise<void> {
        logger.debug(`async rebootInstance(id: string): Promise<void>`);
        return ;
        // logger.info(`Rebooting instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}/action`;
        // await this._client.post(url, {'reboot': {'type': 'HARD'}});
    }

    /**
     * Get a list of images
     */
    async images(): Promise<Image[]> {
        logger.debug(`async images(): Promise<Image[]> = [{id: 'dummy-image-0', name: 'dummy-image-0', size: 0, createdAt: 'dummy-date'}]`);
        return [{id: 'dummy-image-0', name: 'dummy-image-0', size: 0, createdAt: 'dummy-date'}];
        // logger.info(`Fetching images`);
        // const url = `${this._endpoints.imageEndpoint}/v2/images`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // return data.images.map(image => {
        //     return {
        //         id: image.id,
        //         name: image.name,
        //         size: image.size,
        //         createdAt: image['created_at']
        //     };
        // });
    }

    /**
     * Delete an instance
     * @param id the instance identifier
     */
    async deleteInstance(id: string): Promise<void> {
        logger.debug(`async deleteInstance(id: string): Promise<void> = {}`)
        return ;
        // logger.info(`Deleting instance: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/servers/${id}`;
        // await this._client.delete(url);
    }

    /**
     * Get an image
     * @param id the image identifier
     */
    async image(id: string): Promise<Image> {
        logger.debug(`async image(id: string): Promise<Image> = {id: 'dummy-image-0', name: 'dummy-image-0', size: 0, createdAt: 'dummy-date'}`);
        return {id: 'dummy-image-0', name: 'dummy-image-0', size: 0, createdAt: 'dummy-date'};
        // logger.info(`Fetching image: ${id}`);
        // const url = `${this._endpoints.imageEndpoint}/v2/images/${id}`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // return {
        //     id: data.id,
        //     name: data.name,
        //     size: data.size,
        //     createdAt: data['created_at']
        // };
    }

    /**
     * Get a list of flavours
     */
    async flavours(): Promise<Flavour[]> {
        logger.debug(`async flavours(): Promise<Flavour[]> = [{id: 'dummy-flavour-0', name: 'dummy-flavour-0', cpus: 0, ram: 0, disk: 0}]`);
        return [{id: 'dummy-flavour-0', name: 'dummy-flavour-0', cpus: 0, ram: 0, disk: 0}];
        // logger.info(`Fetching flavours`);
        // const url = `${this._endpoints.computeEndpoint}/v2/flavors/detail`;
        // // logger.info(`Fetching flavours: ${url}`);
        // const result = await this._client.get(url);
        // const {data} = result;
        // return data.flavors.map(image => {
        //     return {
        //         id: image.id,
        //         name: image.name,
        //         cpus: image.vcpus,
        //         disk: image.disk,
        //         ram: image.ram
        //     };
        // });
    }

    /**
     * Get a flavour
     * @param id the flavour identifier
     */
    async flavour(id: string): Promise<Flavour> {
        logger.debug(`async flavour(id: string): Promise<Flavour> = {id: 'dummy-flavour-0', name: 'dummy-flavour-0', cpus: 0, ram: 0, disk: 0}`);
        return {id: 'dummy-flavour-0', name: 'dummy-flavour-0', cpus: 0, ram: 0, disk: 0};
        // logger.info(`Fetching flavour: ${id}`);
        // const url = `${this._endpoints.computeEndpoint}/v2/flavors/${id}`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const flavour = data.flavor;
        // return {
        //     id: flavour.id,
        //     name: flavour.name,
        //     cpus: flavour.vcpus,
        //     ram: flavour.ram,
        //     disk: flavour.disk
        // };
    }

    /**
     * Get the cloud metrics (i.e. memory used, number of instances etc.)
     */
    async metrics(): Promise<Metrics> {
        logger.debug(`async metrics(): Promise<Metrics> = {maxTotalRamSize: 0, totalRamUsed: 0, totalInstancesUsed: 0, maxTotalInstances: 0, maxTotalCores: 0, totalCoresUsed: 0}`);
        return {maxTotalRamSize: 0, totalRamUsed: 0, totalInstancesUsed: 0, maxTotalInstances: 0, maxTotalCores: 0, totalCoresUsed: 0};
        // logger.info(`Fetching metrics`);
        // const url = `${this._endpoints.computeEndpoint}/v2/limits`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const limits = data['limits']['absolute'];
        // return {
        //     maxTotalRamSize: limits.maxTotalRAMSize,
        //     totalRamUsed: limits.totalRAMUsed,
        //     totalInstancesUsed: limits.totalInstancesUsed,
        //     maxTotalInstances: limits.maxTotalInstances,
        //     maxTotalCores: limits.maxTotalCores,
        //     totalCoresUsed: limits.totalCoresUsed,
        // };
    }

    /**
     * Get all available security groups
     */
    async securityGroups(): Promise<string[]> {
        logger.debug(`async securityGroups(): Promise<string[]> = ['dummy-sec-group-0']`);
        return ['dummy-sec-group-0'];
        // logger.info(`Fetching all available security groups`);
        // const url = `${this._endpoints.networkEndpoint}/v2.0/security-groups`;
        // const result = await this._client.get(url);
        // const {data} = result;
        // const groups = data.security_groups;
        // return groups.map(group => group.name).sort((a, b) => a.localeCompare(b));
    }

}
