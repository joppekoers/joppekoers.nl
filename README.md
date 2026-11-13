# [joppekoers.nl](https://joppekoers.nl)

My very first deployed project with the goal of learning webdev

Tech learned in chronological order

- git
- Javascript
- NodeJS
- Express
- EJS
- Linux servers
- Docker (compose)
- TypeScript
- ESLint & Prettier
- SvelteKit
- GitHub actions
- Watchtower

## Usage

```shell
cd frontend
bun install
bun run dev
# other terminal
cd backend
bun install
bun run dev
```

Or via docker compose

```
docker compose up --build
```

# Production

When running the cms behind a NGINX reverse proxy use:

```nginx
server {
	listen 80;
	server_name <yourdomain>;
	location / {
		proxy_pass http://cms:1337/;

		# https://stackoverflow.com/questions/42589781
		# The below is equivalent to "include proxy_params;"
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

CI triggers Watchtower through `https://joppekoers.nl/watchtower`. Add this inside the joppekoers.nl `server` block:

```nginx
location /watchtower/ {
	proxy_pass http://127.0.0.1:8081/;
	proxy_read_timeout 300s;
	proxy_set_header Host $http_host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}
```
