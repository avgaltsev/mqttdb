import {Client, connect, IPublishPacket} from "mqtt";

import {Logger, logMethodCallSignature} from "./logger";
import {MqttConfig} from "./config";

export type MessageCallback = (message: IPublishPacket) => void;

export class Mqtt extends Logger {
	private client: Client;

	public constructor(
		private config: MqttConfig,
		private messageCallback: MessageCallback,
	) {
		super();

		this.client = this.createClient();

		this.client;
	}

	@logMethodCallSignature()
	private createClient(): Client {
		const client = connect(this.config.url, {
			username: this.config.username,
			password: this.config.password,
		});

		client.on("error", (error) => {
			this.logError("Error event triggered:", error);
		});

		client.on("connect", (packet) => {
			this.logInfo("Connected successfully.");
			this.logDebug("MQTT CONNACK message received:", packet);

			// There is a bug in mqttjs typings, it's not supporting null as an error
			// but in fact it can be null if no error triggered.
			client.subscribe("#", (error: Error | null) => {
				if (error !== null) {
					this.logError("Subscription failed:", error);
				} else {
					this.logInfo("Subscribed successfully.");
				}
			});
		});

		client.on("message", (topic, payload, packet) => {
			topic;

			this.logDebug("MQTT message received:", packet);

			try {
				const decodedPacket = {
					...packet,
					payload: JSON.parse(payload.toString("utf8")),
				};

				this.logDebug("MQTT message decoded:", decodedPacket);

				this.messageCallback(decodedPacket);
			} catch (error) {
				this.logError("Decoding MQTT payload failed:", error);
			}
		});

		return client;
	}
}
