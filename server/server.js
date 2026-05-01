const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/client", express.static(path.join(__dirname, "../src/client")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/transaksi", require("./routes/transaksi"));
app.use("/api/tracking", require("./routes/tracking"));

// Root redirect ke login
app.get("/", (req, res) => {
  res.redirect("/client/login.html");
});

app.listen(PORT, () => {
  console.log(`✅ Server NyucyGo berjalan di http://localhost:${PORT}`);
  console.log(`📱 Akses: http://localhost:${PORT}/client/login.html`);
});
