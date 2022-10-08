import {Document, MongoClient} from "mongodb";

import {Logger, logMethodCallSignature} from "./logger";
import {DatabaseConfig} from "./config";

export class Database extends Logger {
	private clientPromise: Promise<MongoClient> | null = null;

	public constructor(
		private config: DatabaseConfig,
	) {
		super();
	}

	@logMethodCallSignature()
	private getClient(): Promise<MongoClient> {
		if (this.clientPromise === null) {
			this.logInfo(`Creating a new client with url ${this.config.url}.`);

			this.clientPromise = MongoClient.connect(this.config.url, {
				serverSelectionTimeoutMS: 3000,
				auth: {
					username: this.config.username,
					password: this.config.password,
				},
			});

			this.clientPromise.then((client) => {
				client.on("error", (error) => {
					this.logError("Error event triggered:", error);
					this.logInfo("Closing and resetting the client.");

					client.close();
					this.clientPromise = null;
				});
			}, (reason) => {
				this.logError("Connection failed:", reason);
				this.logInfo("Resetting the client.");

				this.clientPromise = null;
			});
		}

		return this.clientPromise;
	}

	@logMethodCallSignature()
	public save(collectionName: string, items: Array<Document>): Promise<boolean> {
		return this.getClient().then((client) => {
			this.logInfo(`Inserting ${items.length} items.`);
			this.logDebug("Items to be inserted:", items);

			const collection = client.db(this.config.db).collection(collectionName);
			const result = collection.insertMany(items);

			result.catch((reason) => {
				this.logError("Insert operation failed:", reason);
				this.logInfo("Closing and resetting the client.");

				client.close();
				this.clientPromise = null;
			});

			return result;
		}).then((result) => {
			this.logInfo(`Insert operation succeeded, ${result.insertedCount} items saved.`);

			return result.acknowledged;
		});
	}
}

/*
// This is a simplified version of MongoDB client, but it's currently not working properly.
// It supposedly automatically connects to the server on any operation, if it's not connected already.
// But if there is a failure on the first attempt (e.g. server is down when this program starts),
// all subsequent connection attempts will also fail even if the server is up now.
export class Database {
	private client: MongoClient;

	public constructor(
		private config: DatabaseConfig,
	) {
		this.client = new MongoClient(this.config.url, {
			serverSelectionTimeoutMS: 3000,
			auth: {
				username: this.config.username,
				password: this.config.password,
			},
		});

		// TODO: Maybe an "error" listener is needed.
		// There is a mention that the process can crash if no listener is set:
		// https://mongodb.github.io/node-mongodb-native/4.10/classes/MongoClient.html#errorMonitor.
		// But I couldn't find proof in the source code.
	}

	public async save(collectionName: string, items: Array<Document>): Promise<boolean> {
		const collection = this.client.db(this.config.db).collection(collectionName);
		const result = await collection.insertMany(items);

		return result.acknowledged;
	}
}
*/
