import {singleton} from "tsyringe";
import {CloudInstanceState, Flavour, Image, Instance, InstanceFault, Metrics} from "../../models";
import axios, {AxiosInstance} from "axios";
import {HttpException} from "../../exceptions";
import {CloudProvider} from "../cloud-provider.interface";
import {APPLICATION_CONFIG} from '../../application-config';
import { serviceusage_v1 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';




import {logger} from "../../utils";
import {Mutex} from "async-mutex";

import { InstancesClient, DisksClient, ImagesClient, NetworksClient, MachineTypesClient, FirewallsClient } from '@google-cloud/compute';

@singleton()
export class GceServiceAlpha implements CloudProvider {

    private readonly _mutex: Mutex;
    private readonly _projectId: string;
    private readonly _zone: string;

    private readonly _instancesClient: InstancesClient;
    private readonly _networksClient: NetworksClient;
    private readonly _firewallsClient: FirewallsClient;
    private readonly _disksClient: DisksClient;
    private readonly _imagesClient: ImagesClient;
    private readonly _machineTypesClient: MachineTypesClient;
    private readonly _serviceUsageClient: serviceusage_v1.Serviceusage;



    /**
     * Create a new gce service
     */
    constructor() {
        logger.debug(`running constructor for GceServiceAlpha`);
        // todo: read projectId from the key file APPLICATION_CONFIG().gce.keyFile
        const gceConfig = APPLICATION_CONFIG().gce;
        const keyFile = require(gceConfig.keyFile);
        this._projectId = keyFile.project_id;
        this._zone = 'europe-west3-b'; // This should not be hardcoded, remove references and remove this attribute
        this._mutex = new Mutex();

        //this.createInstancesClient = this.createInstancesClient.bind(this);
        //this.createServiceUsageClient = this.createServiceUsageClient.bind(this);
             
        this._instancesClient = this.createInstancesClient();
        this._networksClient = this.createNetworksClient();
        this._firewallsClient = this.createFirewallsClient();
        this._disksClient = this.createDisksClient();
        this._imagesClient = this.createImagesClient();
        this._machineTypesClient = this.createMachineTypesClient();
        this._serviceUsageClient = this.createServiceUsageClient();
    }

    /**
     * Create a new instances client for gce
     * @private
     */
    private createInstancesClient():  InstancesClient {
        const client = new InstancesClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }

    /**
     * Create a new firewalls client for gce
     * @private
     */
    private createFirewallsClient(): FirewallsClient {
        const client = new FirewallsClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }
    
    /**
     * Create a new diks client for gce
     * @private
     */
        private createDisksClient(): DisksClient {
            const client = new DisksClient({
                keyFilename: APPLICATION_CONFIG().gce.keyFile,
            });
            return client;
        }
    
    /**
     * Create a new networks client for gce
     * @private
     */
    private createNetworksClient(): NetworksClient {
        const client = new NetworksClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }

    /**
     * Create a new images client for gce
     * @private
     */
    private createImagesClient(): ImagesClient {
        const client = new ImagesClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }

    /**
     * Create a new machine types client for gce
     * @private
     */
    private createMachineTypesClient(): MachineTypesClient {
        const client = new MachineTypesClient({
            keyFilename: APPLICATION_CONFIG().gce.keyFile,
        });
        return client;
    }

    /**
     * Create a new service usage client for gcp
     * @private
     */
    private createServiceUsageClient(): serviceusage_v1.Serviceusage {
        const keyFile = APPLICATION_CONFIG().gce.keyFile;
        
        // Read the credentials from the service account key file
        const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
        
        // Create a GoogleAuth client with the service account credentials
        const authClient = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        // Instantiate the Service Usage client with the auth client
        const client = new serviceusage_v1.Serviceusage({ auth: authClient });
        return client;
 
    }

    /**
     * Convert the gce instance response
     * @param server
     * @private
     */

    private async toInstance(server: any): Promise<Instance> {
        const state = (status): CloudInstanceState => {
            switch (status) {
                case "PROVISIONING":
                    return CloudInstanceState.BUILDING;
                case "STAGING":
                    return CloudInstanceState.BUILDING;
                case "RUNNING":
                    return CloudInstanceState.ACTIVE;
                case "STOPPING":
                    return CloudInstanceState.STOPPING;
                case "STOPPED":
                    return CloudInstanceState.STOPPED;
                case "SUSPENDING":
                    return CloudInstanceState.UNAVAILABLE;
                case "SUSPENDED":
                    return CloudInstanceState.UNAVAILABLE;
                case "TERMINATED":
                    return CloudInstanceState.ERROR;
                case "REPAIRING":
                    return CloudInstanceState.UNAVAILABLE;
                }
            }
        const instanceState = state(server.status);
        const zoneURL = server.zone;
        const zoneName = zoneURL.split('/').pop();
        logger.debug(`server in zone ${zoneName}`);
        const externalIP = server.networkInterfaces[0].accessConfigs[0].natIP;
        const createdAt = server.creationTimestamp;

        const diskURL = server.disks[0].source;
        const diskName = diskURL.split('/').pop();
        const [disk] = await this._disksClient.get({project: this._projectId, zone: zoneName, disk: diskName});
        const imageURL = disk.sourceImage;

        const instanceName = server.name;
        const instanceType = server.machineType;
        const instanceId = server.id;
        const networkURL = server.networkInterfaces[0].network;
        const networkName = networkURL.split('/').pop();

        const [network] = await this._networksClient.get({project: this._projectId, network: networkName});
        const [firewallRules] = await this._firewallsClient.list({project: this._projectId, filter: `network eq ${network.selfLink}`});
        const firewallRuleIds = firewallRules.map(rule => rule.id) as string[];
        logger.debug(`firewall rules ${firewallRuleIds}`)
        const instanceTags = server.tags.items;
        logger.debug(`tags ${instanceTags}`)
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
        const instanceFault = fault(server);
        return {id: instanceId,
                name: instanceName,
                state: instanceState,
                flavourId: instanceType,
                imageId: imageURL,
                createdAt: createdAt,
                address: externalIP,
                securityGroups: instanceTags,
                fault: instanceFault
            };
        }

    /**
     * Get an instance for a given instance identifier
     * @param id the instance identifier
     */
    async instance(id: string): Promise<Instance> {
        logger.info(`fetching instance ${id}`);
        const [server] = await this._instancesClient.get({project: this._projectId, zone: this._zone, instance: id});
        return this.toInstance(server);
    }

    /**
     * Get a list of instances
     */
    async instances(): Promise<Instance[]> {
        logger.info(`Fetching instances`);
        const iterable = this._instancesClient.aggregatedListAsync({project: this._projectId,}); 
        const instancesList: Instance[] = [];

        for await (const [zone, instancesObject] of iterable) {
            const instances = instancesObject.instances;
            if (instances && instances.length > 0) {
              console.log(` ${zone}`);
              for (const instance of instances) {
                console.log(` - ${instance.name} (${instance.machineType}) ${instance.status} ${instance.networkInterfaces[0].network}`);
                const mappedInstance = await this.toInstance(instance);
                instancesList.push(mappedInstance);                
              }
            }
          }
        return instancesList;
    }

    /**
     * Get a list of instance identifiers
     */
    async instanceIdentifiers(): Promise<string[]> {
        logger.info(`Fetching instances identifiers`);
        const iterable = this._instancesClient.aggregatedListAsync({project: this._projectId,}); 
        const identifiersList: string[] = [];

        for await (const [zone, instancesObject] of iterable) {
            const instances = instancesObject.instances;
            if (instances && instances.length > 0) {
              for (const instance of instances) {
                const identifier = instance.id.toString();
                identifiersList.push(identifier);
              }
            }
          }
        return identifiersList;
    }

    /**
     * Get the security groups for a given instance identifier
     * @param id the instance identifier
     */
    async securityGroupsForInstance(id: string): Promise<string[]> {
        logger.info(`fetching security groups for instance ${id}`);
        const allTargetTags = await this.securityGroups();
        logger.debug(`allTargetTags: ${Array.from(allTargetTags).join(', ')}`);
        const server = await this.instance(id)
        return server.securityGroups;
    }

    /**
     * Remove a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    /**
     * Remove a security group for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async removeSecurityGroupFromInstance(id: string, name: string): Promise<void> {
        logger.info(`Removing security group (tag) ${name} for instance: ${id}`);
        const allTargetTags = await this.securityGroups();
        if (!allTargetTags.includes(name)) {
            logger.error(`targetTag ${name} does not exist`);
            return;
            }   
        const [instance] = await this._instancesClient.get({project: this._projectId, zone: this._zone, instance: id});
        const tags = instance.tags.items.filter(tag => tag !== name);
        const [operation] = await this._instancesClient.setTags({
            project: this._projectId,
            zone: this._zone,
            instance: id,
            tagsResource: {items: tags}
        });
        logger.debug(operation);
    }
    
    /**
     * Add a security group for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    async addSecurityGroupForInstance(id: string, name: string): Promise<void> {
        
        logger.info(`Adding security group (tag) ${name} for instance: ${id}`);
        const allTargetTags = await this.securityGroups();
        if (!allTargetTags.includes(name)) {
            logger.error(`targetTag ${name} does not exist`);
            return;
        }
        const [instance] = await this._instancesClient.get({project: this._projectId, zone: this._zone, instance: id});
        const tags = instance.tags.items;
        
        if (!tags.includes(name)) {
            tags.push(name);
        }
        const [operation] = await this._instancesClient.setTags({
            project: this._projectId,
            zone: this._zone,
            instance: id,
            tagsResource: {items: tags}
        });
        logger.debug(operation);
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

            const instanceResource = {
                name: name,
                machineType: `zones/${this._zone}/machineTypes/${flavourId}`,
                networkInterfaces: [{
                    network: `projects/${this._projectId}/global/networks/default`,
                }],
                disks: [{
                    boot: true,
                    initializeParams: {
                        sourceImage: imageId,
                    },
                }],
                tags: {
                    items: securityGroups,
                },
                metadata: {
                    items: Array.from(metadata, ([key, value]) => ({ key, value })),
                },
            };

            const [operation] = await this._instancesClient.insert({
                instanceResource,
                project: this._projectId,
                zone: this._zone,
            });

            // Wait for the operation to complete
            const [response] = await operation.promise();

            // Fetch the instance
            const [instance] = await this._instancesClient.get({
                project: this._projectId,
                zone: this._zone,
                instance: name,
            });

            return instance.id.toString();
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
        logger.info(`Fetching images`);
        const [images] = await this._imagesClient.list({project: this._projectId});
        return images.map(image => ({
            id: String(image.id),
            name: image.name,
            size: Number(image.diskSizeGb),
            createdAt: image.creationTimestamp
        }));
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
        logger.info(`Fetching image: ${id}`);
        const [image] = await this._imagesClient.get({
            project: this._projectId,
            image: id
        });
        return {
            id: String(image.id),
            name: image.name,
            size: Number(image.diskSizeGb),
            createdAt: image.creationTimestamp
        };
    }


    /**
     * Get a list of flavours
     */
    async flavours(): Promise<Flavour[]> {
        logger.info(`Fetching flavours`);
        const [machineTypes] = await this._machineTypesClient.list({
            project: this._projectId,
            zone: this._zone,
        });        
        logger.debug(`Machine Types: ${JSON.stringify(machineTypes)}`);

        return machineTypes.map(machineType => ({
            id: machineType.name,
            name: machineType.name,
            cpus: Number(machineType.guestCpus),
            disk: Number(machineType.maximumPersistentDisksSizeGb),
            ram: Number(machineType.memoryMb)
        }));
    }

    /**
     * Get a flavour
     * @param id the flavour identifier
     */
    async flavour(id: string): Promise<Flavour> {
        logger.info(`Fetching flavour: ${id}`);
    
        const [machineType] = await this._machineTypesClient.get({
            project: this._projectId,
            zone: this._zone,
            machineType: id,
        });
    
        return {
            id: machineType.name,
            name: machineType.name,
            cpus: Number(machineType.guestCpus),
            disk: Number(machineType.maximumPersistentDisksSizeGb),
            ram: Number(machineType.memoryMb)
        };
    }
    async getCpuQuota(): Promise<number> {
        logger.debug(`Using _serviceUsageClient with projectID ${this._projectId}`);
        try {
            const response = await this._serviceUsageClient.services.list({
                parent: `projects/${this._projectId}`
            });
            logger.debug(`response: ${JSON.stringify(response)}`);
            const services = response.data.services || [];
            logger.debug(`fetched Services: ${JSON.stringify(services)}`);
            return services.length;
        } catch (err) {
            logger.error('Error listing services:', err);
            return 0;
        }
    }

        
    
    /**
     * Get the cloud metrics (i.e. memory used, number of instances etc.)
     */
    async metrics(): Promise<Metrics> {
        logger.debug(`async metrics(): Promise<Metrics> = {maxTotalRamSize: 0, totalRamUsed: 0, totalInstancesUsed: 0, maxTotalInstances: 0, maxTotalCores: 0, totalCoresUsed: 0}`);
        return {maxTotalRamSize: 0, totalRamUsed: 0, totalInstancesUsed: 0, maxTotalInstances: 0, maxTotalCores: await Number(this.getCpuQuota()), totalCoresUsed: 0};
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
    try {
        const [firewalls] = await this._firewallsClient.list({project: this._projectId});
        const targetTags = new Set<string>();

        // Iterate over all firewall rules
        for (const firewall of firewalls) {
            if (firewall.targetTags) {
                // Add all target tags from this rule to the set
                firewall.targetTags.forEach(tag => targetTags.add(tag));
            }
        }
        logger.debug(`collected targetTags in project ${this._projectId}: ${Array.from(targetTags).join(', ')}`);        return Array.from(targetTags); // Convert the Set to an Array
    } catch (err) {
        logger.error('Error fetching target tags from firewall rules:', err);
        return [];
    }
}
}