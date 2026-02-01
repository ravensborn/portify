# Portify API Testing Guide

## Base URL

`https://backend.my-portify.com/api`

## Authentication

### Register

```bash
curl -X POST https://backend.my-portify.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```
