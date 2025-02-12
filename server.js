const express = require("express");
const { simpleParser } = require("mailparser");
const Imap = require("imap-simple");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// IMAP configuration
const IMAP_CONFIG = {
  imap: {
    user: "",
    password: "Logical8794", // ✅ Hardcoded password (per your request)
    host: "mail.dreamcrest.net",
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
    debug: console.log,
  },
};

app.post("/fetch-latest-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    console.log("🔍 Connecting to IMAP...");
    IMAP_CONFIG.imap.user = email;
    const connection = await Imap.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Sort messages by date (latest first)
    messages.sort((a, b) => b.attributes.date - a.attributes.date);

    let latestNetflixEmail = null;

    for (const message of messages) {
      const headerPart = message.parts.find(part => part.which === "HEADER");
      const subject = headerPart?.body?.subject?.[0] || "";

      if (subject.toLowerCase().includes("netflix") || subject.toLowerCase().includes("household")) {
        latestNetflixEmail = message;
        console.log("✅ Found matching email:", subject);
        break; // Stop after finding the first matching email
      }
    }

    if (!latestNetflixEmail) {
      console.log("❌ No recent Netflix or Household emails found.");
      connection.end();
      return res.json({ body: "❌ No recent Netflix or Household emails found." });
    }

    // Extract email body
    const parts = Imap.getParts(latestNetflixEmail.attributes.struct);
    let body = "No content available";

    for (const part of parts) {
      if (part.type === "text" && (part.subtype === "plain" || part.subtype === "html")) {
        const partData = await connection.getPartData(latestNetflixEmail, part);
        if (part.subtype === "html") {
          body = partData; // Prefer HTML content
          break;
        }
        if (part.subtype === "plain" && !body.includes("html")) {
          body = partData; // Use plain text as fallback
        }
      }
    }

    connection.end();
    res.json({ body });

  } catch (err) {
    console.error("❌ Error Fetching Email:", err);
    res.status(500).json({ error: "Failed to fetch email", details: err.message });
  }
});

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, "public"))); 

// Handle root URL request by serving index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
