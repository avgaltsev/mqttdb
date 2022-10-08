const LOG_LEVEL = parseInt(process.env["LOG_LEVEL"] ?? "0", 10);

enum LogLevels {
	"ERROR" = 0,
	"INFO" = 1,
	"DEBUG" = 2,
}

interface InstanceCount {
	[className: string]: number;
}

type Method = (...args: Array<unknown>) => void;

function isMethod(value: unknown): value is Method {
	if (typeof value === "function") {
		return true;
	}

	return false;
}

type MethodDecorator = (target: unknown, name: string, descriptor: PropertyDescriptor) => PropertyDescriptor | void;

export function log(level: number, ...messages: Array<unknown>): void {
	if (level <= LOG_LEVEL) {
		console.log(new Date(), ...messages);
	}
}

export class Logger {
	private static instanceCount: InstanceCount = {};

	private className: string;
	private instance: number;

	public constructor() {
		this.className = Object.getPrototypeOf(this).constructor?.name ?? "Unknown";
		this.instance = (Logger.instanceCount[this.className] ?? 0) + 1;

		Logger.instanceCount[this.className] = this.instance;
	}

	public log(level: number, ...messages: Array<unknown>): void {
		log(level, LogLevels[level] ?? "UNKNOWN", `${this.className}[${this.instance}]:`, ...messages);
	}

	public logError(...messages: Array<unknown>): void {
		this.log(LogLevels.ERROR, ...messages);
	}

	public logInfo(...messages: Array<unknown>): void {
		this.log(LogLevels.INFO, ...messages);
	}

	public logDebug(...messages: Array<unknown>): void {
		this.log(LogLevels.DEBUG, ...messages);
	}
}

export function logMethodCallSignature(level = LogLevels.DEBUG): MethodDecorator {
	return function (target: unknown, name: string, descriptor: PropertyDescriptor): void {
		const originalMethod = descriptor.value;

		if (!isMethod(originalMethod)) {
			return;
		}

		if (!(target instanceof Logger)) {
			return;
		}

		descriptor.value = function (...args: Array<unknown>) {
			Logger.prototype.log.call(this, level, `Method ${name} called with ${args.length} arguments:`, ...args);

			return originalMethod.call(this, ...args);
		};
	};
}
