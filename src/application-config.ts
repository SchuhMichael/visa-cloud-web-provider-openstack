export class ApplicationConfig {

    server: {
        port: number,
        host: string,
        authToken: string
    };

    logging: {
        level: string;
        timezone: string;
        syslog: {
            host: string,
            port: number,
            appName: string
        }
    };

    openstack: {
        identityEndpoint: string;
        computeEndpoint: string;
        imageEndpoint: string;
        networkEndpoint: string;
        applicationId: string;
        applicationSecret: string;
        addressProvider: string;
        addressProviderUUID: string;
        timeout: number;
    }

    constructor(data?: Partial<ApplicationConfig>) {
        Object.assign(this, data);
    }
}

let applicationConfig: ApplicationConfig;

export function APPLICATION_CONFIG(): ApplicationConfig {
    if (applicationConfig == null) {
        applicationConfig = {
            server: {
                port: process.env.VISA_WEB_PROVIDER_OPENSTACK_SERVER_PORT == null ? 4000 : +process.env.VISA_WEB_PROVIDER_OPENSTACK_SERVER_PORT,
                host: process.env.VISA_WEB_PROVIDER_OPENSTACK_SERVER_HOST == null ? 'localhost' : process.env.VISA_WEB_PROVIDER_OPENSTACK_SERVER_HOST,
                authToken: process.env.VISA_WEB_PROVIDER_OPENSTACK_SERVER_AUTH_TOKEN
            },
            logging: {
                level: process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_LEVEL == null ? 'info' : process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_LEVEL,
                timezone: process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_TIMEZONE,
                syslog: {
                    host: process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_HOST,
                    port: process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_PORT == null ? null : +process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_PORT,
                    appName: process.env.VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_APP_NAME
                }
            },
            openstack: {
                identityEndpoint: process.env.VISA_WEB_PROVIDER_OPENSTACK_IDENTITY_ENDPOINT,
                computeEndpoint: process.env.VISA_WEB_PROVIDER_OPENSTACK_COMPUTE_ENDPOINT,
                imageEndpoint: process.env.VISA_WEB_PROVIDER_OPENSTACK_IMAGE_ENDPOINT,
                networkEndpoint: process.env.VISA_WEB_PROVIDER_OPENSTACK_NETWORK_ENDPOINT,
                applicationId: process.env.VISA_WEB_PROVIDER_OPENSTACK_APPLICATION_ID,
                applicationSecret: process.env.VISA_WEB_PROVIDER_OPENSTACK_APPLICATION_SECRET,
                addressProvider: process.env.VISA_WEB_PROVIDER_OPENSTACK_ADDRESS_PROVIDER,
                addressProviderUUID: process.env.VISA_WEB_PROVIDER_OPENSTACK_ADDRESS_PROVIDER_UUID,
                timeout: process.env.VISA_WEB_PROVIDER_OPENSTACK_HTTP_TIMEOUT == null ? 5000 : +process.env.VISA_WEB_PROVIDER_OPENSTACK_HTTP_TIMEOUT
            }
        };
    }
    return applicationConfig;
}
