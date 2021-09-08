import {InstanceFault} from "./instance-fault.model";
import {CloudInstanceState} from "./instance-state.model";

export interface Instance {
    id: string;
    name: string;
    state: CloudInstanceState;
    flavourId: string;
    imageId: string;
    createdAt: string;
    address: string;
    securityGroups: string[];
    fault: InstanceFault;
}
