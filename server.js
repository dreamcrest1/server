const express = require("express");
const { simpleParser } = require("mailparser");
const Imap = require("imap-simple");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ Allow CORS for `code.dreamcrest.net`
app.use(cors({
  origin: "https://code.dreamcrest.net", 
  methods: "POST",
  allowedHeaders: ["Content-Type"]
}));

const IMAP_CONFIG = {
  imap: {
    user: "",
    password: "Logical8794",
    host: "mail.dreamcrest.net",
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false }, // Ignore SSL cert errors
    debug: console.log, // Log IMAP activity for debugging
  },
};

app.post("/fetch-emails", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    console.log(`📧 Connecting to IMAP for ${email}...`);
    IMAP_CONFIG.imap.user = email;

    const connection = await Imap.connect(IMAP_CONFIG);
    console.log("✅ IMAP Connected!");

    await connection.openBox("INBOX");
    console.log("📂 Opened INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    const emails = [];
    for (let msg of messages) {
      const header = msg.parts.find((part) => part.which === "HEADER");
      const bodyPart = msg.parts.find((part) => part.which === "TEXT");

      if (!header) continue;

      const subject = header.body.subject ? header.body.subject[0] : "No Subject";
      if (!subject.toLowerCase().includes("netflix") && !subject.toLowerCase().includes("household")) continue; // ✅ Filter Netflix & Household emails

      let emailBody = "No body available"; // Default if missing
      if (bodyPart) {
        try {
          const parsed = await simpleParser(bodyPart.body);
          emailBody = parsed.text || parsed.html || "No content"; // Fallback if text is empty
        } catch (parseError) {
          console.error("⚠️ Error parsing email body:", parseError);
        }
      }

      emails.push({
        subject,
        from: header.body.from ? header.body.from[0] : "Unknown",
        date: header.body.date ? header.body.date[0] : "Unknown",
        body: emailBody,
      });
    }

    connection.end();
    console.log(`✅ Fetched ${emails.length} emails`);
    res.json({ emails });
  } catch (err) {
    console.error("❌ IMAP Error:", err);
    res.status(500).json({ error: "Failed to fetch emails", details: err.message });
  }
});

// ✅ Use dynamic port for Render hosting
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
