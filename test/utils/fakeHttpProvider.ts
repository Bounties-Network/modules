import { JsonRPCRequest, JsonRPCResponse, Provider, Callback } from "web3/providers";
import { constants } from "./constants";

const isObject   = (object: any) => object !== null && !(Array.isArray(object)) && typeof object === 'object'
const isArray    = (object: any) => Array.isArray(object)
const isFunction = (object: any) => typeof object === 'function'

type ValidationCallback = (
    payload: JsonRPCRequest,
    callback: (e: Error, val: JsonRPCResponse) => void
) => void

export class FakeHttpProvider implements Provider {
    countId: number = 1
    response: JsonRPCResponse[] = []
    error: Error[] = []
    validation: ValidationCallback[] = []

    constructor() {}

    getErrorStub() {
        return {
            jsonrpc: '2.0',
            id: this.countId,
            error: {
                 code: 1234,
                message: 'Stub error'
            }
        }
    }

    getResponseStub() {
        return {
            jsonrpc: '2.0',
            id: this.countId,
            result: null
        }
    }

    send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>) {
        // set id
        if(payload.id)
            this.countId = payload.id;
        // else
        //     this.countId++;

        expect(isArray(payload) || isObject(payload)).toEqual(true);
        expect(isFunction(callback)).toEqual(true);

        // console.log(payload)

        var validation = this.validation.shift();

        if (validation) {
            // imitate plain json object
            validation(JSON.parse(JSON.stringify(payload)), callback);
        }

        let response = this.getResponse(payload)
        let error = this.getError(payload)

        setTimeout(function(){
            callback(null, response);
        }, 1)
    }

    getResponse(payload: JsonRPCResponse) {
        const response = this.response.shift() || this.getResponseStub()

        if(response) {
            if(isArray(response)) {
                // response = response.map((resp, index) => {
                //     resp.id = payload[index] ? payload[index].id : this.countId++;
                //     return resp;
                // })
            } else
                response.id = payload.id;
        }

        return response;
    }

    getError(payload: JsonRPCResponse) {
        const response = this.error.shift() as any

        if(response) {
            if(isArray(response)) {
                // response = response.map((resp, index) => {
                //     resp.id = payload[index] ? payload[index].id : this.countId++;
                //     return resp;
                // })
            } else
                response.id = payload.id
        }

        return response
    }



    injectValidation(callback: ValidationCallback): void
    injectValidation(callback: ValidationCallback, options: { gasPrice: string, txHash: string } ): void

    injectValidation(callback: ValidationCallback, options?: { gasPrice: string, txHash: string }) {
        if(options) {
            this.injectResult(options.gasPrice)
            this.validation.push((payload: JsonRPCRequest) => {
                expect(payload.method).toEqual('eth_gasPrice')
            })

            this.validation.push(callback);

            this.injectResult(options.txHash)
            this.injectResult({
                "status": true,
                "transactionHash": options.txHash,
                "transactionIndex": 0,
                "blockHash": "0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46",
                "blockNumber": 0,
                "contractAddress": constants.BOUNTY_ADDRESS,
                "cumulativeGasUsed": 1,
                "gasUsed": 1,
                "logs": [{}]
            })
            this.validation.push((payload: JsonRPCRequest) => {
                expect(payload.method).toEqual('eth_getTransactionReceipt')
                expect(payload.params).toEqual([options.txHash])
            })

            return
        }

        this.validation.push(callback);
    }

    injectResult(result: any) {
        let response = this.getResponseStub();
        response.result = result;

        this.response.push(response);
    };
}



// FakeHttpProvider.prototype.injectResponse = function (response) {
//     this.response = response;
// };



// FakeHttpProvider.prototype.injectBatchResults = function (results, error) {
//     var _this = this;
//     this.response.push(results.map(function (r) {
//         if(error) {
//             var response = _this.getErrorStub();
//             response.error.message = r;
//         } else {
//             var response = _this.getResponseStub();
//             response.result = r;
//         }
//         return response;
//     }));
// };

// FakeHttpProvider.prototype.injectError = function (error) {
//     var errorStub = this.getErrorStub();
//     errorStub.error = error; // message, code

//     this.error.push(errorStub);
// };


