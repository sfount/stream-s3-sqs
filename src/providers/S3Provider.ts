import { EventEmitter } from 'events'
import { Readable } from 'stream'
import logger from './../utils/logger'
import S3, { SelectObjectContentRequest, RecordsEvent, StatsEvent, ProgressEvent, ContinuationEvent, EndEvent } from 'aws-sdk/clients/s3'
import { Provider, Message, ProgressPage } from './Provider'
import { AWSError } from 'aws-sdk/lib/error'

const s3 = new S3()

// S3 ObjectContent request `Payload` doesn't seem to be playing well with Typescript definition, manually define
// event type until bug has been fixed
// see https://github.com/aws/aws-sdk-js/blob/master/clients/s3.d.ts
interface ObjectContentRequest {
	Records?: RecordsEvent; Stats?: StatsEvent; Progress?: ProgressEvent; Cont?: ContinuationEvent; End?: EndEvent;
}

export default class S3Provider implements Provider {
	bucketName: string
	sourceFile: string

	constructor(bucketName: string, sourceFile: string) {
		if (!bucketName || !sourceFile) {
			throw new Error('Invalid S3 provider params')
		}

		logger.info('Provider: using AWS S3', { 'bucket_name': bucketName, 'source_file': sourceFile })
		this.bucketName = bucketName
		this.sourceFile = sourceFile
	}

	stream(): Readable {
		const readableStream = new Readable({ objectMode: true, read(): void {} })

		this.getSourceFileContentLength()
			.then((totalFileSizeInBytes) => this.fetch(readableStream, totalFileSizeInBytes))
			.catch((error: AWSError) => {
				logger.error('Provider: failed to provide messages from S3', {
					'code': error.code,
					'status_code': error.statusCode,
					'request_id': error.requestId,
					'aws_message': error.message
				})
			})
		return readableStream
	}

	async getSourceFileContentLength(): Promise<number> {
		const targetFileHeaderObject = await s3.headObject({ Bucket: this.bucketName, Key: this.sourceFile}).promise()

		logger.info('Provider: fetched source file header info', {
			'content_length': targetFileHeaderObject.ContentLength,
			'content_type': targetFileHeaderObject.ContentType,
			'last_modified': targetFileHeaderObject.LastModified,
			'accept_range': targetFileHeaderObject.AcceptRanges
		})
		return targetFileHeaderObject.ContentLength
	}

	async fetch(stream: Readable, totalFileSizeInBytes: number): Promise<void> {
		const PAGE_SIZE_BYTES = 1000
		let bytesFrom = 0

		do {
			const targetBytes = bytesFrom + PAGE_SIZE_BYTES
			const messages = await this.fetchPage(bytesFrom, targetBytes)
			bytesFrom = targetBytes
			stream.push({
				messages,
				progress: bytesFrom
			} as ProgressPage)
		} while (bytesFrom < totalFileSizeInBytes)
		logger.info('Provider: completed fetching all rows from source file')
	}

	fetchPage(bytesFrom = 0, targetBytes: number): Promise<Message[]> {
		return new Promise((resolve, reject) => {
			const filePageRequestParams: SelectObjectContentRequest = {
				Bucket: this.bucketName,
				Key: this.sourceFile,
				InputSerialization: {
					CSV: {
						FileHeaderInfo: 'USE',
						RecordDelimiter: '\n',
						FieldDelimiter: ','
					},
				},
				OutputSerialization: {
					JSON: {
						RecordDelimiter: ','
					}
				},
				ScanRange: {
					Start: bytesFrom,
					End: targetBytes
				},
				Expression: 'SELECT * FROM S3Object',
				ExpressionType: 'SQL'
			}

			s3.selectObjectContent(filePageRequestParams, (error, response) => {
				if (error) {
					logger.error('Provider: failed to fetch page', {
						'bytes_from': bytesFrom,
						'bytes_to': targetBytes,
						'source_file': this.sourceFile
					})
					reject(error)
					return
				}

				const stream = response.Payload as EventEmitter
				const data: Message[] = []

				stream.on('data', (event: ObjectContentRequest) => {
					if (event.Records) {
						const messages = this.parseS3SelectBytes(event.Records.Payload.toString())
						data.push(...messages)
					}
				})

				stream.on('end', () => {
					resolve(data)
				})
			})
		})
	}

	parseS3SelectBytes(selectedContent: string): Message[] {
		const result = selectedContent.replace(/(,$)/g, '')
		return JSON.parse(`[${result}]`)
	}
}