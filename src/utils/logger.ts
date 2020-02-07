import crypto from 'crypto'
import { createLogger, transports, format } from 'winston'

const uid = process.env.JOB_ID || crypto.randomBytes(16).toString('hex')
const meta = {
	'@version': 1,
	'job_id': uid
}
const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({ alias: '@timestamp' }),
		format.json()
	),
	defaultMeta: meta,
	transports: [
		new transports.Console()
	]
})

export default logger