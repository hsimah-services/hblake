FROM docker.io/library/rust:1-bookworm AS rust
FROM docker.io/library/php:8.3-cli-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libonig-dev libsqlite3-dev libzip-dev libxml2-dev build-essential && docker-php-ext-install pdo_sqlite mbstring zip dom xml xmlwriter && rm -rf /var/lib/apt/lists/*
COPY --from=docker.io/library/composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV PATH="/usr/local/cargo/bin:${PATH}" RUSTUP_HOME=/usr/local/rustup COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /app
