const express = require("express");
const db = require("../config/db");
const router = express.Router();

// Login admin (tanpa bcrypt)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM admin WHERE username = ? AND password = ?",
      [username, password],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }

    const admin = rows[0];

    res.json({
      success: true,
      message: "Login berhasil",
      role: "admin",
      id: "admin",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Cek transaksi customer (untuk login tracking)
router.post("/cek-transaksi", async (req, res) => {
  const { invoice } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM transaksi WHERE id = ?", [
      invoice,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kode transaksi tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Transaksi ditemukan",
      role: "customer",
      id: invoice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
