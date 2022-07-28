/* eslint-disable @typescript-eslint/naming-convention */
import crypto from 'crypto'
import SQS = require("aws-sdk/clients/sqs")
import Transformer from './Transformer'
import { Message } from './../providers/Provider'

interface PaymentEventMessage {
	event_details: { [key: string]: string } | { [key: string]: { [key: string]: string }  };
	resource_type?: string;
	resource_external_id?: string;
	event_date?: string;
	event_type?: string;
	parent_resource_external_id?: string;
	reproject_domain_object?: boolean;
	service_id?: string;
	live?: string;
	[key: string]: any | { [key: string]: string } | { [key: string]: { [key: string]: string }  };
}

// we can gaurantee the existence of required fields as anything with permissions
// to this resource will be validating data entry
function formatPaymentEventMessage(message: Message): PaymentEventMessage {
	const reservedKeys = [
		{ key: 'transaction_id', target: 'resource_external_id' },
		{ key: 'parent_transaction_id', target: 'parent_resource_external_id' },
		{ key: 'transaction_type', target: 'resource_type' },
		{ key: 'event_date', target: 'timestamp' },
		{ key: 'event_name', target: 'event_type' },
		{ key: 'reproject_domain_object', target: 'reproject_domain_object', targetBoolean: true },
		{ key: 'service_id', target: 'service_id' },
		{ key: 'live', target:'live', targetBoolean: true}
	]
	const formatted: PaymentEventMessage = { event_details: {} }

	// initially extract the reserved properties
	for (const reserved of reservedKeys) {
		let reservedEntry: any = message[reserved.key] && message[reserved.key].trim()
		if (reservedEntry) {
			if (reserved.targetBoolean) {
				reservedEntry = reservedEntry == 'true'
			}
			formatted[reserved.target] = reservedEntry
			delete message[reserved.key]
		}
	}

	// any remaining properties will override attributes of the transaction itself
	// put these in `event_data`
	for (const paymentEventMessageKey in message) {

		const paymentEventMessageValue = message[paymentEventMessageKey] &&
			(typeof message[paymentEventMessageKey] === 'string') ? message[paymentEventMessageKey].trim() : message[paymentEventMessageKey]

		if (paymentEventMessageValue) {

			// support only 1 level of nesting for second level attributes
			if (paymentEventMessageKey.includes('.')) {
				const [ topLevelKey, nestedKey ] = paymentEventMessageKey.split('.')
				const nestedObject: { [key: string]: string } = {}

				nestedObject[nestedKey] = paymentEventMessageValue
				formatted.event_details[topLevelKey] = nestedObject
			} else {
				formatted.event_details[paymentEventMessageKey] = paymentEventMessageValue
			}
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