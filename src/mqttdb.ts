import {Document} from "mongodb";

import {Logger, logMethodCallSignature} from "./logger";
import {Config} from "./config";
import {Database} from "./database";
import {Queue} from "./queue";

interface Message {
	topic: string,
	payload: Document,
}

interface Queues {
	[topic: string]: Queue<Document>;
}

export class MqttDb extends Logger {
	private database: Database;
	private queues: Queues = {};

	public constructor(
		private config: Config,
	) {
		super();

		this.database = new Database(this.config.database);

		this.test("topic2");
	}

	private async test(topic: string): Promise<void> {
		setTimeout(async () => {
			this.saveMessage({topic, payload: {a: "1a"}});
			this.saveMessage({topic, payload: {a: "1b"}});
		}, 1000);

		setTimeout(async () => {
			this.saveMessage({topic, payload: {a: "10a"}});
			this.saveMessage({topic, payload: {a: "10b"}});
			this.saveMessage({topic, payload: {a: "10c"}});
		}, 10000);

		setTimeout(async () => {
			this.saveMessage({topic, payload: {a: "20a"}});
			this.saveMessage({topic, payload: {a: "20b"}});
			this.saveMessage({topic, payload: {a: "20c"}});
			this.saveMessage({topic, payload: {a: "20d"}});
		}, 20000);

		setTimeout(async () => {
			this.saveMessage({topic, payload: {a: "30a"}});
			this.saveMessage({topic, payload: {a: "30b"}});
			this.saveMessage({topic, payload: {a: "30c"}});
		}, 30000);
	}

	@logMethodCallSignature()
	private saveMessage(message: Message): void {
		const topic = message.topic;
		let queue = this.queues[topic];

		if (queue === undefined) {
			this.logInfo(`Creating a new queue for topic ${topic}.`);

			queue = new Queue((items) => {
				return this.database.save(topic, items);
			});

			this.queues[topic] = queue;
		}

		this.logDebug("Existing queues:", Object.keys(this.queues));

		this.logInfo(`Saving payload for topic ${topic}:`, message.payload);

		queue.addItems(message.payload);
	}
}
