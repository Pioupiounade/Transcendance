FROM debian:bookworm

RUN apt update && apt install -y nginx openssl

COPY conf/nginx.conf /etc/nginx/sites-available/default

RUN mkdir -p /etc/nginx/ssl && \
	openssl req -x509 -nodes -days 365 \
	-newkey rsa:2048 \
	-keyout /etc/nginx/ssl/inception.key \
	-out /etc/nginx/ssl/inception.crt \
	-subj "/CN=mlelu.42.fr"

CMD ["nginx", "-g", "daemon off;"]