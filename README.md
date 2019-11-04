# olx-scrapper

Scraps [olx.pl](olx.pl) selected topic and sends Notifications when a new offer is created.

# Additional parameters

--maxPrice (set max price filter)
Example :
yarn start --maxPrice 1200

--rooms (set maximum rooms included smaller (1-4))
Example :
yarn start --rooms 3

Set the values generated from google applications to receive messages with the new offer to the email address:
- user_name (email)
- refresh_token
- access_token
- client_id
- client_secret
- email_to

BuildUrl - search url