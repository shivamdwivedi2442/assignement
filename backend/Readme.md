# Meta Lead Ads + React Native PoC

A Proof of Concept that receives leads from Meta Lead Ads and displays them live in an already-open React Native application using a Node.js backend, Meta Webhooks, Meta Graph API, and Socket.IO.

## Overview

The flow of the application is:

```text
Meta Lead Testing Tool
        ↓
Meta Webhook
        ↓
Node.js + Express Backend
        ↓
Meta Graph API
        ↓
Socket.IO
        ↓
React Native App
        ↓
Live Lead List
```

The main goal is to make a lead appear in the React Native application automatically without refreshing the application or manually requesting the lead.

---

## Features

* Meta Lead Ads webhook integration
* Meta webhook verification
* Meta Graph API integration
* React Native lead dashboard
* Real-time lead updates using Socket.IO
* Backend connection status
* Live lead counter
* Test lead endpoint for local testing
* Environment variables for sensitive configuration

---

## Tech Stack

### Frontend

* React Native
* JavaScript
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* Axios
* CORS

### Meta Integration

* Meta Lead Testing Tool
* Meta Webhooks
* Meta Graph API

---

# Project Structure

```text
project/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── App.js
    ├── package.json
    └── ...
```

---

# Backend Setup

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

The server listens on:

```text
0.0.0.0:5000
```

so that it can also be accessed from other devices on the same network.

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

META_VERIFY_TOKEN=leadpoc2026

META_API_VERSION=vXX.X

META_PAGE_ACCESS_TOKEN=YOUR_PAGE_ACCESS_TOKEN
```

The actual Page Access Token should not be committed to GitHub.

The verify token used in Meta must match the value configured in:

```env
META_VERIFY_TOKEN
```

For example:

```env
META_VERIFY_TOKEN=leadpoc2026
```

---

# Webhook Verification

The backend provides:

```text
GET /webhook
```

Meta sends the following parameters during webhook verification:

```text
hub.mode
hub.verify_token
hub.challenge
```

The backend checks whether:

```text
hub.mode = subscribe
```

and whether the received verify token matches:

```text
META_VERIFY_TOKEN
```

If both match, the backend returns the challenge.

Example test URL:

```text
https://YOUR-NGROK-DOMAIN.ngrok-free.dev/webhook?hub.mode=subscribe&hub.verify_token=leadpoc2026&hub.challenge=test123
```

If the configuration is correct, the browser should return:

```text
test123
```

If the browser returns:

```text
403 Forbidden
```

check the following:

1. `META_VERIFY_TOKEN` exists in `.env`
2. The token matches exactly
3. The backend was restarted after changing `.env`
4. The ngrok tunnel is pointing to port `5000`
5. The `/webhook` route is running on the backend

---

# Ngrok Setup

Meta needs a publicly accessible HTTPS webhook URL.

For local development, ngrok can be used to expose the backend.

Start the backend first:

```bash
npm start
```

Then start ngrok:

```bash
ngrok http 5000
```

Ngrok will provide a public HTTPS URL similar to:

```text
https://your-domain.ngrok-free.dev
```

The webhook URL for Meta will be:

```text
https://your-domain.ngrok-free.dev/webhook
```

---

# React Native Setup

Go to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Install Socket.IO client if required:

```bash
npm install socket.io-client
```

Start the React Native application using the normal React Native/Expo command for the project.

---

# Socket.IO Connection

The React Native application connects to the backend using Socket.IO.

For an Android emulator, the backend running on the development computer can normally be accessed using:

```js
const SOCKET_URL = "http://10.0.2.2:5000";
```

For a physical Android device, use the computer's local network IP:

```js
const SOCKET_URL = "http://192.168.x.x:5000";
```

The phone and computer should be connected to the same network.

---

# How Real-Time Leads Work

When the React Native application starts, it establishes a Socket.IO connection with the backend.

The application listens for:

```text
new_lead
```

When the backend receives and processes a Meta lead, it emits:

```js
io.emit("new_lead", lead);
```

The React Native application receives the event:

```js
socket.on("new_lead", (lead) => {
    setLeads((previousLeads) => [lead, ...previousLeads]);
});
```

The new lead is then immediately added to the list.

No refresh is required.

---

# Meta Lead Flow

The complete process is:

### 1. Submit Test Lead

A test lead is submitted using Meta's Lead Testing Tool.

### 2. Meta Sends Webhook

Meta sends a webhook request to:

```text
POST /webhook
```

### 3. Backend Receives Lead ID

The backend reads:

```text
leadgen_id
```

from the webhook payload.

### 4. Fetch Lead Details

The backend uses the Meta Graph API to retrieve the lead details.

The required information includes:

```text
id
created_time
field_data
```

### 5. Extract Lead Fields

The backend extracts fields such as:

```text
full_name
email
phone_number
```

and creates a lead object.

### 6. Socket.IO Broadcast

The backend emits:

```js
io.emit("new_lead", lead);
```

### 7. React Native Updates

The React Native application receives the event and updates its state.

The new lead immediately appears in the dashboard.

---

# Test Lead Endpoint

A temporary endpoint is also included for testing the real-time pipeline independently from Meta.

Endpoint:

```text
POST /test-lead
```

Example request:

```json
{
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210"
}
```

Example PowerShell command:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/test-lead" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Rahul Kumar","email":"rahul@example.com","phone":"9876543210"}'
```

The backend creates the lead and emits the same:

```text
new_lead
```

Socket.IO event.

This endpoint is mainly useful for verifying that the backend-to-React-Native real-time communication is working independently.

---

# React Native Dashboard

The React Native application displays:

* Backend connection status
* Number of live leads
* Lead name
* Email
* Phone number
* Lead creation time

Example:

```text
Meta Lead Dashboard

🟢 Backend Connected

Live Leads (1)

Rahul Kumar
📧 rahul@example.com
📱 9876543210
```

---

# Error Handling / Meta Testing Issue

During testing, the webhook event can reach the backend successfully while the Meta Graph API may not return the expected dummy lead details from the testing environment.

The backend logs the webhook payload and the lead generation ID so that the issue can be identified.

The real-time Socket.IO pipeline can also be tested using the `/test-lead` endpoint.

This separates the Meta API/testing issue from the React Native and Socket.IO implementation and makes it possible to verify the real-time part of the PoC independently.

---

# Security

Sensitive values such as the following are stored in environment variables:

```text
META_VERIFY_TOKEN
META_PAGE_ACCESS_TOKEN
```

The `.env` file should not be committed to the repository.

Add it to `.gitignore`:

```text
.env
node_modules/
```

---

# Assignment Demonstration

The demonstration should show:

1. React Native application already open
2. Backend connected
3. Meta Lead Testing Tool
4. Test lead submission
5. Webhook reaching the backend
6. Lead processing
7. Lead appearing automatically in the React Native application

The important part is that no manual action is required on the React Native application after submitting the lead.

---

# Architecture Summary

```text
                 META
                  │
                  │ Lead submission
                  ▼
          Meta Lead Testing Tool
                  │
                  │ Webhook
                  ▼
        ┌─────────────────────┐
        │  Node.js + Express  │
        │       Backend       │
        └──────────┬──────────┘
                   │
                   │ leadgen_id
                   ▼
          Meta Graph API
                   │
                   │ lead details
                   ▼
        ┌─────────────────────┐
        │      Socket.IO      │
        └──────────┬──────────┘
                   │
                   │ new_lead
                   ▼
        ┌─────────────────────┐
        │    React Native     │
        │     Dashboard       │
        └─────────────────────┘
                   │
                   ▼
             Live Lead List
```

---

# Conclusion

This PoC demonstrates a real-time lead delivery pipeline from Meta Lead Ads to a React Native application.

The backend handles Meta webhook verification, receives lead events, retrieves lead details through the Meta Graph API, and broadcasts the processed lead using Socket.IO.

The React Native application maintains a live Socket.IO connection and automatically updates the lead list whenever a new lead is received.
#   a s s i g n e m e n t  
 #   a s s i g n e m e n t - b a c k e n d  
 #   a s s i g n e m e n t - b a c k e n d  
 