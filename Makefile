.PHONY: dev build start clean docker-build docker-up docker-down

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

clean:
	rm -rf .next

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
