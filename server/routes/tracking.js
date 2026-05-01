const express = require("express");
const db = require("../config/db");
const router = express.Router();

// GET tracking by invoice
router.get("/:invoice", async (req, res) => {
  const { invoice } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM transaksi WHERE id = ?", [
      invoice,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kode transaksi tidak ditemukan" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
