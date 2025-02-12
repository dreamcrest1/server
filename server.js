const express = require("express");
const { simpleParser } = require("mailparser");
const Imap = require("imap-simple");
const cors = require("cors");
const path = require('path'); // Import the path module

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// IMAP configuration and the rest of your server code
const IMAP_CONFIG = {
  imap: {
    user: "",
    password: "Logical8794", // Example, replace with your actual password if different
    host: "mail.dreamcrest.net",
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
    debug: console.log,
  },
};

// Rest of your application logic here, like your route definitions
app.post("/fetch-latest-email", async (req, res) => {
  // Your existing endpoint logic
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
