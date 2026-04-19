# Name Profile API

##  Overview

This project is a RESTful API that accepts a name, enriches it using multiple external APIs, classifies the data, stores it in a database, and exposes endpoints to manage and retrieve the stored profiles.

---

## Features

* Fetches data from **3 external APIs**
* Classifies age into groups
* Determines most probable nationality
* Stores results in a database (SQLite)
* Prevents duplicate entries (idempotent)
* Supports filtering via query parameters
* Full CRUD support (Create, Read, Delete)
* Robust error handling

---

## Tech Stack

* Node.js
* Express.js
* SQLite
* Axios
* UUID

---

##  External APIs Used

* **Genderize** → https://api.genderize.io
* **Agify** → https://api.agify.io
* **Nationalize** → https://api.nationalize.io

---

## Installation & Setup

```bash
git clone <your-repo-url>
cd name-profile-api
npm install
npm start
```

Server runs at:

```
http://localhost:3000
```

---

## 📡 API Endpoints

### 1️⃣ Create Profile

**POST** `/api/profiles`

#### Request Body

```json
{
  "name": "ella"
}
```

#### Success Response (201)

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "created_at": "ISO_DATE"
  }
}
```

#### Duplicate Case (200)

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}
```

---

### Get Single Profile

**GET** `/api/profiles/{id}`

---

### Get All Profiles

**GET** `/api/profiles`

#### Optional Query Params:

* `gender`
* `country_id`
* `age_group`

Example:

```
/api/profiles?gender=male&country_id=NG
```

---

### Delete Profile

**DELETE** `/api/profiles/{id}`

Returns:

```
204 No Content
```

---

## Classification Rules

### Age Groups

* 0–12 → child
* 13–19 → teenager
* 20–59 → adult
* 60+ → senior

### Nationality

* Country with the **highest probability** from Nationalize API

---

## Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error message"
}
```

### Error Codes

* **400** → Missing or empty name
* **422** → Invalid type
* **404** → Profile not found
* **502** → External API failure
* **500** → Internal server error

---

## Idempotency

If a profile with the same name already exists:

* No new record is created
* Existing record is returned

---

## Data Storage

* SQLite database (`database.sqlite`)
* Unique constraint on `name`
* UUID used for IDs
* Timestamps in ISO 8601 (UTC)

---

## CORS

CORS is enabled:

```
Access-Control-Allow-Origin: *
```

---

## Testing

Use Postman or curl:

```bash
curl -X POST http://localhost:3000/api/profiles \
-H "Content-Type: application/json" \
-d '{"name":"ella"}'
```

---

## Author

Ifunanya