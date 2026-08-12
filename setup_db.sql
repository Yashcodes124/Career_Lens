CREATE USER careerlens_user WITH PASSWORD 'careerlens_password';
CREATE DATABASE careerlens_db OWNER careerlens_user;
GRANT ALL PRIVILEGES ON DATABASE careerlens_db TO careerlens_user;
