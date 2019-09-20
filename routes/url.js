const express = require("express");
const router = express.Router();

const Url = require('../models/Url');

router.get("/:url", (req, res) => {
  const url = req.params.url;
  if (url) {
    Url.findOne({short: url})
      .then(url => res.json(url.long))
      .catch(
        err => res.status(400).json({ok: false, message: "Invalid short url."})
      );
  } else {
    res.status(400).json({ok: false, message: "Invalid short url."});
  }
});

module.exports = router;
