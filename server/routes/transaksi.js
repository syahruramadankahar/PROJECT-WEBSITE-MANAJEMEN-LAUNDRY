const express = require("express");
const db = require("../config/db");
const router = express.Router();

// GET semua transaksi
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM transaksi ORDER BY createdAt DESC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single transaksi by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transaksi WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST transaksi baru
router.post("/", async (req, res) => {
  const { id, nama, hp, layanan, berat, harga, estimasi } = req.body;

  try {
    await db.query(
      `INSERT INTO transaksi (id, nama, hp, layanan, berat, harga, status, estimasi) 
             VALUES (?, ?, ?, ?, ?, ?, 'Diterima', ?)`,
      [id, nama, hp, layanan, berat, harga, estimasi],
    );

    res.status(201).json({
      success: true,
      message: "Transaksi berhasil ditambahkan",
      id: id,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update status transaksi
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await db.query("UPDATE transaksi SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ success: true, message: "Status berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE transaksi
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM transaksi WHERE id = ?", [id]);
    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
