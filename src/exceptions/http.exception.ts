export class HttpException extends Error {
    private readonly _status: number;

    constructor(message: string, status: number) {
        super(message);
        Object.setPrototypeOf(this, HttpException.prototype)
        this._status = status;
    }

    isStatus(status: number) {
        return this._status === status;
    }

    get status(): number {
        return this._status;
    }

}