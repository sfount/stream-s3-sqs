import S3Provider from './S3Provider'

const s3Provider = new S3Provider('some-bucket', 'some-path')

describe('S3 content string parser', () => {
	test('strips always appended commas', () => {
		const exampleResult = '{"id": "5"},'
		const messages = s3Provider.parseS3SelectBytes(exampleResult)
		expect(messages).toHaveLength(1)
		expect(messages[0].id).toBe('5')
	})

	test('returns correct number of entries from content', () => {
		const exampleResult = '{"id": "5"},{"id": "6"},{"id": "7"},{"id": "8"}'
		const messages = s3Provider.parseS3SelectBytes(exampleResult)
		expect(messages).toHaveLength(4)
	})
})