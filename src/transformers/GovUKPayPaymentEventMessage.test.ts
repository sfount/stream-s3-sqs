import GovUKPayPaymentEventMessage from './GovUKPayPaymentEventMessage'
describe('message formatter', () => {
	const messageFromS3Csv = {
		'transaction_id': 'some-transaction-id',
		'event_date': 'some-event-date',
		'parent_transaction_id': 'some-parent-transaction-id',
		'event_name': 'some-event-type',
		'transaction_type': 'some-resource-type',
		'reference': 'some-reference',
		'amount': 'some-amount'
	}
	const messageBuilder = new GovUKPayPaymentEventMessage()

	test('correctly transforms known reserved columns', () => {
		const formatted = messageBuilder.transform(messageFromS3Csv)
		const body = JSON.parse(formatted.MessageBody)

		expect(body).toHaveProperty('resource_external_id')
		expect(body).toHaveProperty('parent_resource_external_id')
		expect(body).toHaveProperty('resource_type')
		expect(body).toHaveProperty('timestamp')
		expect(body).toHaveProperty('event_details')
		expect(body).toHaveProperty('event_type')
	})

	test('ignores reserved properties if not needed on transaction', () => {
		const formatted = messageBuilder.transform({ 'transaction_id': 'some-transaction-id' })
		const body = JSON.parse(formatted.MessageBody)

		expect(body).toHaveProperty('resource_external_id')
		expect(body).not.toHaveProperty('parent_resource_external_id')
	})

	test('correctly formats well formatted flat message', () => {
		const formatted = messageBuilder.transform(messageFromS3Csv)
		const body = JSON.parse(formatted.MessageBody)

		expect(body.event_details.reference).toBe('some-reference')
		expect(body.event_details.amount).toBe('some-amount')
	})
})