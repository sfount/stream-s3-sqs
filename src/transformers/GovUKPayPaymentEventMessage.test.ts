import GovUKPayPaymentEventMessage from './GovUKPayPaymentEventMessage'
describe('message formatter', () => {
	const messageFromS3Csv = {
		'transaction_id': ' some-transaction-id',
		'event_date': 'some-event-date',
		'parent_transaction_id': 'some-parent-transaction-id',
		'event_name': 'some-event-type',
		'transaction_type': 'some-resource-type',
		'reproject_domain_object': 'true',
		'service_id': 'some-service-id',
		'live': 'true',
		'reference': 'some-reference',
		'amount': 'some-amount',
		'will_have_empty_space': ' some-empty-space-values ',
		'value_omitted': '',
		'value_included': 'some-value',
		'boolean_string_lowercase_true': 'true',
		'boolean_string_uppercase_true': 'TRUE',
		'boolean_string_lowercase_false': 'false',
		'boolean_string_uppercase_false': 'FALSE',
		'empty_column': ''
	}

	// @ts-ignore
	messageFromS3Csv["boolean_value"] = true
	// @ts-ignore
	messageFromS3Csv["numeric_value"] = 123

	const messageBuilder = new GovUKPayPaymentEventMessage()

	test('correctly transforms known reserved columns', () => {
		const formatted = messageBuilder.transform({ ...messageFromS3Csv })
		const body = JSON.parse(formatted.MessageBody)

		expect(body).toHaveProperty('resource_external_id')
		expect(body).toHaveProperty('parent_resource_external_id')
		expect(body).toHaveProperty('resource_type')
		expect(body).toHaveProperty('timestamp')
		expect(body).toHaveProperty('event_details')
		expect(body).toHaveProperty('event_type')
		expect(body).toHaveProperty('reproject_domain_object', true)
		expect(body).toHaveProperty('service_id')
		expect(body).toHaveProperty('live', true)
		expect(body).toHaveProperty('event_details.boolean_value', true)
		expect(body).toHaveProperty('event_details.numeric_value', 123)
		expect(body).toHaveProperty('event_details.boolean_string_lowercase_true', true)
		expect(body).toHaveProperty('event_details.boolean_string_uppercase_true', true)
		expect(body).toHaveProperty('event_details.boolean_string_lowercase_false', false)
		expect(body).toHaveProperty('event_details.boolean_string_uppercase_false', false)
		expect(body).not.toHaveProperty('empty_column')
	})

	test('ignores reserved properties if not needed on transaction', () => {
		const formatted = messageBuilder.transform({ 'transaction_id': 'some-transaction-id' })
		const body = JSON.parse(formatted.MessageBody)

		expect(body).toHaveProperty('resource_external_id')
		expect(body).not.toHaveProperty('parent_resource_external_id')
	})

	test('correctly formats well formatted flat message', () => {
		const formatted = messageBuilder.transform({ ...messageFromS3Csv })
		const body = JSON.parse(formatted.MessageBody)

		expect(body.event_details.reference).toBe('some-reference')
		expect(body.event_details.amount).toBe('some-amount')
	})

	test('correctly strips empty space from both reserved and custom properties', () => {
		const formatted = messageBuilder.transform({ ...messageFromS3Csv })
		const body = JSON.parse(formatted.MessageBody)

		expect(body.resource_external_id).toBe('some-transaction-id')
		expect(body.event_details.will_have_empty_space).toBe('some-empty-space-values')
	})

	test('correctly ignores values from rows that have omitted values', () => {
		const formatted = messageBuilder.transform({ ...messageFromS3Csv })
		const body = JSON.parse(formatted.MessageBody)

		expect(body.event_details).not.toHaveProperty('value_omitted')
		expect(body.event_details.value_included).not.toHaveProperty('some-value')
	})

	test('correctly parses correctly formatted nested headers at one depth level', () => {
		const formatted = messageBuilder.transform({ 'nested.value': 'some-nested-value' })
		const body = JSON.parse(formatted.MessageBody)

		expect(body.event_details).toHaveProperty('nested')
		expect(body.event_details.nested).toHaveProperty('value')
		expect(body.event_details.nested.value).toBe('some-nested-value')
	})
})