FROM php:8.2-apache

WORKDIR /var/www/html

# Enable mod_rewrite
RUN a2enmod rewrite

# Install system dependencies for PHP extensions and cleanup
RUN apt-get update && apt-get install -y \
    curl \
    libmagickwand-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libpng-dev \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/*

# Install and enable PHP extensions
RUN pecl install imagick && docker-php-ext-enable imagick \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd mysqli zip \
    && docker-php-ext-enable mysqli

# Allow PDF processing in ImageMagick
RUN sed -i 's|<policy domain="coder" rights="none" pattern="PDF" />|<policy domain="coder" rights="read" pattern="PDF" />|' /etc/ImageMagick-6/policy.xml

# Set PHP file upload parameters
RUN echo "upload_max_filesize=50M\npost_max_size=50M" > /usr/local/etc/php/conf.d/uploads.ini

# Create log & temp directories and set permissions
RUN mkdir -p /var/log/navplan/ /var/www/html/tmp/ && chmod -R 777 /var/log/navplan/ /var/www/html/tmp/

# Copy sample data
COPY charts ./charts
RUN mkdir -p terraintiles && \
    for tile in N46E006 N46E007 N46E008 N46E009 N46E010 N47E006 N47E007 N47E008 N47E009 N47E010; do \
        curl -o ./terraintiles/${tile}.hgt https://www.navplan.ch/terraintiles/${tile}.hgt; \
    done

# Copy php files
COPY php ./php

# Copy html, js, css & icon directories
COPY about ./about
COPY angularjs ./angularjs
COPY bootstrap ./bootstrap
COPY css ./css
COPY edituser ./edituser
COPY font-awesome ./font-awesome
COPY fonts ./fonts
COPY forgotpw ./forgotpw
COPY icon ./icon
COPY js ./js
COPY login ./login
COPY map ./map
COPY openlayers ./openlayers
COPY services ./services
COPY settings ./settings
COPY tracks ./tracks
COPY waypoints ./waypoints
COPY .htaccess ./
COPY *.php ./
COPY *.html ./
COPY *.js ./
COPY *.png ./
COPY version.txt ./

EXPOSE 80

CMD ["apache2-foreground"]
