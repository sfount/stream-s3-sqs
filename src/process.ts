import S3Provider from './providers/S3Provider'
import SQSConsumer from './consumers/SQSConsumer'
import GovUkPayPaymentEventMessage from './transformers/GovUKPayPaymentEventMessage'
const { PROVIDER_S3_BUCKET_NAME, PROVIDER_S3_SOURCE_FILE, CONSUMER_SQS_QUEUE_URL } = process.env

const s3Provider = new S3Provider(PROVIDER_S3_BUCKET_NAME, PROVIDER_S3_SOURCE_FILE)
const sqs = new SQSConsumer(CONSUMER_SQS_QUEUE_URL, new GovUkPayPaymentEventMessage()).writer()

s3Provider
	.stream()
	.pipe(sqs)