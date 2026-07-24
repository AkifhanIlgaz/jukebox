.PHONY: dev frontend backend

dev:
	@trap 'kill 0' EXIT INT TERM; \
	$(MAKE) backend & \
	$(MAKE) frontend & \
	wait

frontend:
	cd frontend && npm run dev

backend:
	cd backend && go run cmd/api
