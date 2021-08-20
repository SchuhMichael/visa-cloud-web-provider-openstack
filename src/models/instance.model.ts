import {InstanceFault} from "./instance-fault.model";

export interface Instance {
    id: string;
    name: string;
    state: string;
    flavorId: string;
    imageId: string;
    createdAt: string;
    address: string;
    securityGroups: string[];
    fault: InstanceFault;
}
