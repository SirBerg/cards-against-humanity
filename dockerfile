FROM chainguard/bun
WORKDIR /app
COPY ./ ./

RUN bun install && bun --bun run build

EXPOSE 3000
EXPOSE 3001

CMD ["bun", "--bun", "run", "start"]

