import {getConfig} from "./config";
import {MqttDb} from "./mqttdb";

export async function main(): Promise<void> {
	const config = await getConfig();

	new MqttDb(config);
}
