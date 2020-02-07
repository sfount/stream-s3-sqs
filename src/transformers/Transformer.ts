import SQS = require('aws-sdk/clients/sqs')
export default interface Transformer {
	transform(message: { [key: string]: string }): SQS.SendMessageBatchRequestEntry;
}