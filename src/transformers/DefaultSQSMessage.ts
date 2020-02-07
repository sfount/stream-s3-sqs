import crypto from 'crypto'
import SQS = require("aws-sdk/clients/sqs")
import Transformer from './Transformer'
import { Message } from './../providers/Provider'

export default class DefaultSQSMessage implements Transformer {
	transform(message: Message): SQS.SendMessageBatchRequestEntry {
		return {
			Id: crypto.randomBytes(16).toString('hex'),
			MessageBody: JSON.stringify(message)
		}
	}
}