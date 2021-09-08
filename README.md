# VISA Cloud Web Provider for OpenStack

This project contains the source code for an implementation of using OpenStack as a *Web Cloud Provider* in VISA.

VISA (Virtual Infrastructure for Scientific Analysis) makes it simple to create compute instances on facility cloud infrastructure to analyse your experimental data using just your web browser.

See the [User Manual](https://visa.readthedocs.io/en/latest/) for deployment instructions and end user documentation.

## Description

The VISA Cloud Web Provider OpenStack providers a RESTful web service for interacting with the [Openstack API](https://docs.openstack.org/api-ref/compute/). VISA can be configured to use a *web provider* that will contact your cloud provider of choice.

This project can be used as a good starting point if you wish to implement your own provider (i.e. proxmox, aws etc.)

**This is currently a WIP and is not at a mature enough level to be used in production on the VISA platform**

### Building the application

```
npm install
```

### Running the server
```
npm start
```

The application requires environment variables to be set. These can be in a `.env` file at the root of the project. Details of the environment variables are given below.


### Environment variables

The following environment variables are used to configure VISA Cloud Web Provider for OpenStack and can be placed in a `.env` file:

| Environment variable | Default value | Usage |
| ---- | ---- | ---- |
| VISA_WEB_PROVIDER_OPENSTACK_SERVER_PORT | 4000 | The port on which to run the server |
| VISA_WEB_PROVIDER_OPENSTACK_SERVER_HOST | localhost | The hostname on which the server is listening on |
| VISA_WEB_PROVIDER_OPENSTACK_SERVER_AUTH_TOKEN |  | The expected `x-auth-token` value |
| VISA_WEB_PROVIDER_OPENSTACK_LOG_LEVEL | 'info' | Application logging level |
| VISA_WEB_PROVIDER_OPENSTACK_LOG_TIMEZONE |  | The timezone for the formatting the time in the application log |
| VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_HOST |  | The syslog host (optional) |
| VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_PORT |  | The syslog port (optional) |
| VISA_WEB_PROVIDER_OPENSTACK_LOG_SYSLOG_APP_NAME |  | The syslog application name (optional) |
| VISA_WEB_PROVIDER_OPENSTACK_IDENTITY_ENDPOINT | | The API endpoint to the OpenStack Identity API |
| VISA_WEB_PROVIDER_OPENSTACK_COMPUTE_ENDPOINT | | The API endpoint to the OpenStack Compute API |
| VISA_WEB_PROVIDER_OPENSTACK_IMAGE_ENDPOINT | | The API endpoint to the OpenStack Image API |
| VISA_WEB_PROVIDER_OPENSTACK_NETWORK_ENDPOINT | | The API endpoint to the OpenStack Network API |
| VISA_WEB_PROVIDER_OPENSTACK_APPLICATION_ID | | The application id for an OpenStack Application Credential |
| VISA_WEB_PROVIDER_OPENSTACK_APPLICATION_SECRET | | The application secret for an OpenStack Application Credential |
| VISA_WEB_PROVIDER_OPENSTACK_ADDRESS_PROVIDER | | The OpenStack network address provider |
| VISA_WEB_PROVIDER_OPENSTACK_ADDRESS_PROVIDER_UUID | | The OpenStack network UUID |
| VISA_WEB_PROVIDER_OPENSTACK_HTTP_TIMEOUT | 5000 (5s) | The requests to OpenStack will timeout  if the duration (ms) exceeds this value |

## Acknowledgements

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/PaNOSC%20logo/PaNOSClogo_web_RGB.jpg" width="200px"/> 

VISA has been developed as part of the Photon and Neutron Open Science Cloud (<a href="http://www.panosc.eu" target="_blank">PaNOSC</a>)

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/images/logos/eu_flag_yellow_low.jpg"/>

PaNOSC has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement No 823852.
