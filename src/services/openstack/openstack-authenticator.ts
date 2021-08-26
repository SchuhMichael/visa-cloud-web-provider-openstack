import axios, {AxiosInstance, AxiosResponse} from "axios";
import {formatDuration, intervalToDuration, isAfter, sub} from "date-fns";
import {logger} from "../../utils";
import {HttpException} from "../../exceptions";

export class OpenstackAuthenticator {


    private readonly _endpoint: string;
    private readonly _id: string;
    private readonly _secret: string;
    private _principal: { token: string, expiresAt: Date } = null;
    private readonly _client: AxiosInstance;

    /**
     * Create a new openstack authenticator
     * @param endpoint the openstack identity endpoint
     * @param id the openstack application id
     * @param secret the openstack application secret
     * @param timeout the openstack http timeout
     */
    constructor(readonly endpoint: string,
                readonly id: string,
                readonly secret: string,
                readonly timeout: number) {
        this._endpoint = endpoint;
        this._id = id;
        this._secret = secret;
        this._client = axios.create({
            timeout
        });
    }

    /**
     * Check if the authentication token has expired
     * We invalidate the token if it will expire in the next 30 minutes
     * @private
     */
    private isTokenExpired(): boolean {
        const now = new Date();
        const validity = sub(now, {minutes: 30});
        if (isAfter(validity, this._principal.expiresAt,)) {
            logger.info('Token has expired');
            this._principal = null;
            return true;
        }
        return false;
    }

    /**
     * Send the authentication request to openstack
     * @private
     */
    private async sendRequest(): Promise<AxiosResponse> {
        const url = `${this._endpoint}/v3/auth/tokens`;
        return await axios.post(url, {
            auth: {
                identity: {
                    methods: ['application_credential'],
                    application_credential: {
                        id: this._id,
                        secret: this._secret
                    }
                }
            }
        });
    }

    /**
     * Handle the openstack authentication response
     * @param response the response from openstack
     * @private
     */
    private handleResponse(response: AxiosResponse): void {
        const {data, headers, status} = response;
        if (status === 201) {
            const token = headers['x-subject-token'];
            const expiresAt = new Date(data.token.expires_at);
            const duration = intervalToDuration({
                start: new Date(),
                end: expiresAt
            });
            logger.info(`Fetched new auth token from openstack. The token will expire in: ${formatDuration(duration)}`);
            this._principal = {token, expiresAt};
        }
    }

    /**
     * Authenticate to openstack
     */
    public async authenticate(): Promise<void> {
        try {
            const response = await this.sendRequest();
            this.handleResponse(response);
        } catch (error) {
            throw new HttpException(`Error authenticating to openstack: ${error.message}`, error?.response?.status);
        }
    }

    /**
     * Are we authenticated to openstack?
     * This will also check that the token hasn't expired
     */
    public isAuthenticated(): boolean {
        if (this._principal === null) {
            return false;
        }
        return !this.isTokenExpired();
    }

    /**
     * Get the principal (the token secret and when it expires)
     */
    public getPrincipal(): { token: string; expiresAt: Date } {
        return this._principal;
    }

}
