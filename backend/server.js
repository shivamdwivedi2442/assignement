import axios from "axios";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import "dotenv/config";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// home route

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Meta Lead POC backend is running",
  });
});

// Socket.IO

io.on("connection", (socket) => {
  console.log("Mobile connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Mobile disconnected:", socket.id);
  });
});

// Temporary test lead

app.post("/test-lead", (req, res) => {
  const lead = {
    id: Date.now().toString(),
    name: req.body.name || "Test User",
    email: req.body.email || "test@example.com",
    phone: req.body.phone || "9999999999",
    createdAt: new Date().toISOString(),
  };

  console.log("New test lead:", lead);

  io.emit("new_lead", lead);

  res.json({
    success: true,
    lead,
  });
});

// META WEBHOOK VERIFICATION

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification request received");

  if (
    mode === "subscribe" &&
    token === process.env.META_VERIFY_TOKEN
  ) {
    console.log("Webhook verified successfully");

    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");

  return res.sendStatus(403);
});

// META WEBHOOK

app.post("/webhook", async (req, res) => {
  console.log("META WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));

  res.sendStatus(200);

  try {
    if (req.body.object !== "page") {
      return;
    }
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") {
          continue;
        }

        const leadgenId = change.value?.leadgen_id;

        if (!leadgenId) {
          console.log("No leadgen_id found");
          continue;
        }

        console.log("New Meta Lead ID:", leadgenId);

        const response = await axios.get(
          `https://graph.facebook.com/${process.env.META_API_VERSION}/${leadgenId}`,
          {
            params: {
              access_token: process.env.META_PAGE_ACCESS_TOKEN,
              fields: "id,created_time,field_data",
            },
          }
        );

        const metaLead = response.data;

        const fields = metaLead.field_data || [];

        const getField = (fieldName) => {
          const field = fields.find((item) => item.name === fieldName);
          return field?.values?.[0] || "";
        };

        const lead = {
          id: metaLead.id,
          name: getField("full_name"),
          email: getField("email"),
          phone: getField("phone_number"),
          createdAt:
            metaLead.created_time || new Date().toISOString(),
        };

        io.emit("new_lead", lead);
      }
    }
  } catch (error) {
    console.error(
      "Meta lead processing error:",
      error.response?.data || error.message
    );
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});