FROM docker.io/library/rust:1-bookworm AS rust
FROM docker.io/library/php:8.3-cli-bookworm
# GD re-encodes uploaded images, which strips EXIF and location metadata.
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libonig-dev libsqlite3-dev libzip-dev libxml2-dev libpng-dev libjpeg62-turbo-dev libwebp-dev build-essential && docker-php-ext-configure gd --with-jpeg --with-webp && docker-php-ext-install pdo_sqlite mbstring zip dom xml xmlwriter gd && rm -rf /var/lib/apt/lists/*
COPY --from=docker.io/library/composer:2 /usr/bin/composer /usr/bin/composer
# Post images may be up to 5 MB (server/src/Media.php).
RUN printf 'upload_max_filesize = 6M\npost_max_size = 8M\n' > /usr/local/etc/php/conf.d/uploads.ini
COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV PATH="/usr/local/cargo/bin:${PATH}" RUSTUP_HOME=/usr/local/rustup COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /app
