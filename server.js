const express = require("express");
const { simpleParser } = require("mailparser");
const Imap = require("imap-simple");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// IMAP configuration (update with actual credentials)
const IMAP_CONFIG = {
  imap: {
    user: "",
    password: "Logical8794",
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
    IMAP_CONFIG.imap.user = email;
    const connection = await Imap.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    messages.sort((a, b) => b.attributes.date - a.attributes.date); // Sort to get latest message

    const latestMessage = messages[0]; // Get the latest message
    const parts = Imap.getParts(latestMessage.attributes.struct);

    let body = "No content available";
    for (const part of parts) {
      if (part.type === 'text' && (part.subtype === 'plain' || part.subtype === 'html')) {
        const partData = await connection.getPartData(latestMessage, part);
        if (part.subtype === 'html') {
          body = partData; // Prefer HTML content
          break; // If HTML content found, break the loop
        }
        if (part.subtype === 'plain' && !body.includes('html')) {
          body = partData; // Use plain text as fallback
        }
      }
    }

    connection.end();
    res.json({ body: body });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch email", details: err.message });
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
