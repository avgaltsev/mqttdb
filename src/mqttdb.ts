import {Document} from "mongodb";

import {Logger, logMethodCallSignature} from "@somethings/logger";

import {Config} from "./config";
import {Database} from "./database";
import {Queue} from "./queue";
import {Mqtt} from "./mqtt";

interface Message {
	topic: string,
	payload: Document,
}

interface Queues {
	[topic: string]: Queue<Document>;
}

export class MqttDb extends Logger {
	private database: Database;
	private mqtt: Mqtt;
	private queues: Queues = {};

	public constructor(
		private config: Config,
	) {
		super();

		this.logWarning("MqttDb started. Creating database and MQTT instances.");

		this.database = new Database(this.config.database);

		this.mqtt = new Mqtt(this.config.mqtt, (packet) => {
			this.saveMessage({
				topic: packet.topic,
				payload: packet,
			});
		});

		this.mqtt;
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
		this.logDebug(`Saving payload for topic ${topic}.`, message.payload);

		queue.addItems(message.payload);
	}
}
