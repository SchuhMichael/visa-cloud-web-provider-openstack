import {Flavour, Image, Instance, Metrics} from "../models";

export interface CloudProvider {

    /**
     * Get an instance for a given instance identifier
     * @param id the instance identifier
     */
    instance(id: string): Promise<Instance>;

    /**
     * Get a list of instances
     */
    instances(): Promise<Instance[]>;

    /**
     * Get a list of instance identifiers
     */
    instanceIdentifiers(): Promise<string[]>;

    /**
     * Get the security groups for a given instance identifier
     * @param id the instance identifier
     */
    securityGroups(id: string): Promise<string[]>;

    /**
     * Remove a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    removeSecurityGroup(id: string, name: string): Promise<void>;

    /**
     * Add a security for a given instance identifier
     * @param id the instance identifier
     * @param name the security group name
     */
    addSecurityGroup(id: string, name: string): Promise<void>;

    /**
     * Create a new instance
     * @param name the name of the instance
     * @param imageId the openstack image identifier
     * @param flavourId the openstack flavour identifier
     * @param securityGroups a list of openstack security groups
     * @param metadata the cloud init metadata
     * @param bootCommand the boot command to use when starting the instance
     */
    createInstance(name: string,
                   imageId: string,
                   flavourId: string,
                   securityGroups: string[],
                   metadata: Map<string, string>,
                   bootCommand: string): Promise<string>;

    /**
     * Delete an instance
     * @param id the instance identifier
     */
    delete(id: string): Promise<void>;

    /**
     * Shutdown an instance
     * @param id the instance identifier
     */
    shutdownInstance(id: string): Promise<void>;

    /**
     * Start an instance
     * @param id the instance identifier
     */
    startInstance(id: string): Promise<void>;

    /**
     * Reboot an instance
     * @param id the instance identifier
     */
    rebootInstance(id: string): Promise<void>;

    /**
     * Get a list of images
     */
    images(): Promise<Image[]>;

    /**
     * Get an image
     * @param id the image identifier
     */
    image(id: string): Promise<Image>;

    /**
     * Get a list of flavours
     */
    flavours(): Promise<Flavour[]>;

    /**
     * Get a flavour
     * @param id the flavour identifier
     */
    flavour(id: string): Promise<Flavour>;

    /**
     * Get the cloud metrics (i.e. memory used, number of instances etc.)
     */
    metrics(): Promise<Metrics>;

}
