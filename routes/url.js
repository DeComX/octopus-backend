const express = require("express");
const router = express.Router();

const Url = require('../models/Url');

router.get("/:url", (req, res) => {
  const shortUrl = req.params.url;
  if (shortUrl) {
    Url.findOneAndUpdate(
        {short: shortUrl},
        {$push: {"clicks": new Date()}}
      ).then(url => {
        res.json(url.long);
      })
      .catch(
        err => res.status(400).json({ok: false, message: "Invalid short url."})
      );
  } else {
    res.status(400).json({ok: false, message: "Invalid short url."});
  }
});

module.exports = router;
