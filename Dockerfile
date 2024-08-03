# Ubuntuのベースイメージを指定
FROM ubuntu:latest

# PHP 8.2 PPAを追加
RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php && apt-get update

# 必要なパッケージおよびPHP 8.2のインストール
RUN apt-get install -y php8.2 php8.2-cli php8.2-fpm php8.2-zip php8.2-bcmath php8.2-intl php8.2-mysql php8.2-redis php8.2-curl \
    libzip-dev unzip curl git

# Docker CLIのインストール
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - \
    && echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y docker-ce-cli

# Composer のインストール
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Node.jsのインストール
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# 作業ディレクトリの設定
WORKDIR /app

# Laravel アプリケーションのコピー
COPY . .

ENV COMPOSER_ALLOW_SUPERUSER=1

# Composer による依存関係のインストール
RUN composer update && composer install && composer require guzzlehttp/guzzle

# Composer のオートロードの再生成
RUN composer dump-autoload

# predis/predis パッケージの追加
RUN composer require predis/predis

# npmの依存関係のインストール
RUN npm install --legacy-peer-deps

# Laravel/ui パッケージの追加
RUN composer require laravel/ui
RUN php artisan ui react

# Laravelのキャッシュをクリア
RUN php artisan optimize:clear

# アプリケーションキーの生成
RUN php artisan key:generate

# ポートのエクスポート
EXPOSE 8000
EXPOSE 5173

# サーバーの起動
CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
