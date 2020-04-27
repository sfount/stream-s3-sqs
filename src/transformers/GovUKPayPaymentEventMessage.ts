/* eslint-disable @typescript-eslint/camelcase */
import crypto from 'crypto'
import SQS = require("aws-sdk/clients/sqs")
import Transformer from './Transformer'
import { Message } from './../providers/Provider'

interface PaymentEventMessage {
	event_details: { [key: string]: string };
	resource_type?: string;
	resource_external_id?: string;
	event_date?: string;
	event_type?: string;
	parent_resource_external_id?: string;
	[key: string]: string | { [key: string]: string };
}

// we can gaurantee the existence of required fields as anything with permissions
// to this resource will be validating data entry
function formatPaymentEventMessage(message: Message): PaymentEventMessage {
	const reservedKeys = [
		{ key: 'transaction_id', target: 'resource_external_id' },
		{ key: 'parent_transaction_id', target: 'parent_resource_external_id' },
		{ key: 'transaction_type', target: 'resource_type' },
		{ key: 'event_date', target: 'timestamp' },
		{ key: 'event_name', target: 'event_type' }
	]
	const formatted: PaymentEventMessage = { event_details: {} }

	// initially extract the reserved properties
	for (const reserved of reservedKeys) {
		const reservedEntry = message[reserved.key] && message[reserved.key].trim()
		if (reservedEntry) {
			formatted[reserved.target] = reservedEntry
			delete message[reserved.key]
		}
	}

	// any remaining properties will override attributes of the transaction itself
	// put these in `event_data`
	for (const paymentEventMessageKey in message) {
		const paymentEventMessageValue = message[paymentEventMessageKey] && message[paymentEventMessageKey].trim()
		if (paymentEventMessageValue) {
			formatted.event_details[paymentEventMessageKey] = paymentEventMessageValue
		}
	}
	return formatted
}

export default class GovUkPayPaymentEventMessage implements Transformer {
	transform(message: Message): SQS.SendMessageBatchRequestEntry {
		return {
			Id: crypto.randomBytes(16).toString('hex'),
			MessageBody: JSON.stringify(
				formatPaymentEventMessage(message)
			)
		}
	}
}