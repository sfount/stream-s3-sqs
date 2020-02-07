import { Writable } from 'stream'
import { ProgressPage } from './../providers/Provider'

// interface could use generics to firm up configuring the transformer
export default interface Consumer {
	writer(): Writable;
	receiveMessageBatchFromStream(page: ProgressPage, encoding: string, done: (error?: Error) => void): void;
}