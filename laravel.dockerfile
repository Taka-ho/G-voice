FROM php:8.2.6

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    libicu-dev \
    && docker-php-ext-install zip bcmath intl \
    && apt-get install redis -y \
    && apt-get install nodejs npm -y

RUN docker-php-ext-install pdo_mysql

# Composer のインストール
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 作業ディレクトリの設定
WORKDIR /app

# Laravel アプリケーションのコピー
COPY . .

ENV COMPOSER_ALLOW_SUPERUSER=1
# Composer による依存関係のインストール

RUN composer update
RUN composer install
RUN composer require guzzlehttp/guzzle
# Composer のオートロードの再生成
RUN composer dump-autoload

# predis/predis パッケージの追加

RUN composer require predis/predis

# Node.jsのインストールとnpmの依存関係のインストール
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs
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
