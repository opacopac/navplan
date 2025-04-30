FROM mariadb:10.6

COPY db_init_scripts/01_create_db_structure.sql /docker-entrypoint-initdb.d/
COPY db_init_scripts/02_grant_user_privileges.sql /docker-entrypoint-initdb.d/
COPY db_init_scripts/03_sample_data_navaids2.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
