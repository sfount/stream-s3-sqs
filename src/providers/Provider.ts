import { Readable } from 'stream'
export type Message = { [key: string]: string }
export interface ProgressPage {
	messages: Message[];
	progress: number;
}
export interface Provider {
	stream(): Readable;
}