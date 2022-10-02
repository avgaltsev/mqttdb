```bash
docker build -t avgaltsev/mqttdb:0.0.0 ./
```

Create mqttdb config.

```bash
docker volume create mqttdb-config
```

Copy `src/json/default-config.json` to `config.json` inside the volume `mqttdb-config` and edit it.

Start the container.

```bash
docker run -d --name=mqttdb --restart=unless-stopped --net=host -v mqttdb-config:/root/config/ avgaltsev/mqttdb:0.0.0
```

Updating config.

```bash
sudo nano /var/lib/docker/volumes/mqttdb-config/_data/config.json
docker restart mqttdb
```
