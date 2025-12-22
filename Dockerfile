FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules
RUN a2enmod rewrite

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Set working directory
WORKDIR /var/www/html
