FROM php:8.2-apache

WORKDIR /var/www/html

COPY . .

RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN a2enmod rewrite

ENV PORT=8000

RUN sed -i 's/Listen 80/Listen 8000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8000>/' /etc/apache2/sites-available/000-default.conf

EXPOSE 8000

CMD ["apache2-foreground"]