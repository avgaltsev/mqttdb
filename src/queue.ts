import {Logger, logMethodCallSignature} from "@somethings/logger";

// TODO: Add eslint rule forcing semicolon in this line.
export type ItemHandler<T> = (items: Array<T>) => Promise<unknown>;

export class Queue<T> extends Logger {
	private enqueuedItems: Array<T> = [];

	private currentTask: Promise<unknown> = Promise.resolve();

	public constructor(
		private process: ItemHandler<T>,
	) {
		super();
	}

	public addItems(item: T): void;
	public addItems(items: Array<T>): void;
	@logMethodCallSignature()
	public addItems(items: T | Array<T>): void {
		if (!Array.isArray(items)) {
			items = [items];
		}

		this.logInfo(`Enqueueing ${items.length} items.`);
		this.logDebug("Items to be enqueued:", items);

		this.enqueueItems(items);
	}

	@logMethodCallSignature()
	private enqueueItems(items: Array<T>, prepend = false): void {
		if (this.enqueuedItems.length === 0) {
			this.logInfo("Registering items processing after the currently running task.");

			this.logDebug("Current task:", this.currentTask);

			this.currentTask.then(() => {
				this.processItems();
			});
		}

		this.logDebug("Enqueued items before enqueueing:", this.enqueuedItems);

		if (prepend) {
			this.logInfo(`Returning ${items.length} items from failed processing to the queue.`);

			this.enqueuedItems.unshift(...items);
		} else {
			this.logInfo(`Adding ${items.length} items to the queue.`);

			this.enqueuedItems.push(...items);
		}

		this.logDebug("Enqueued items after enqueueing:", this.enqueuedItems);
	}

	@logMethodCallSignature()
	private processItems(): void {
		const processingItems = [...this.enqueuedItems];

		this.enqueuedItems.length = 0;

		this.logInfo(`Starting processing for ${processingItems.length} items.`);
		this.logDebug("Items to be processed:", processingItems);

		this.currentTask = this.process(processingItems).catch((reason) => {
			this.logError("Processing failed:", reason);

			this.enqueueItems(processingItems, true);
		});
	}
}
