-- Run this once against the existing CAGNEX Postgres database.
alter table if exists users
  add column if not exists phone_number text not null default '';
