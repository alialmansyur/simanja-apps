FROM node:22

WORKDIR /app

# We don't copy files or npm install here because we use bind mounts in dev
# so the host files are synced. But we can define the entrypoint.
CMD ["npm", "run", "dev", "--", "--host"]
