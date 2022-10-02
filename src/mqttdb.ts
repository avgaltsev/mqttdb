import {Config} from "./config";

export class MqttDb {
	public constructor(
		private config: Config,
	) {
		console.log(this.config);
	}
}
