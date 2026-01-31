# Portify API Testing Guide

## Base URL

`http://portify-api:5000/api`

## Authentication

### Register

```bash
curl -X POST http://portify-api:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```
