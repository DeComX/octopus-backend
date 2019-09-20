const express = require("express");
const router = express.Router();

const uuid = require('uuidv4').default;
const Url = require('../../models/Url');

const doesExist = async (short) => {
  Url.findOne({short: short})
    .then(url => {return (!!url);})
    .catch(err => {return true;});
}

const MAX_TRY = 3;
const getShortUrl = async (tried = 0) => {
  if (tried >= MAX_TRY) {
    return null;
  };
  const value = uuid().slice(0, 6);
  console.log("tried: " + value);
  const exist = await doesExist(value);
  if (exist) {
    return getShortUrl(tried + 1);
  } else {
    return value;
  }
};

router.get("/", (req, res) => {
  const url = req.body.url;
  if (url) {
    Url.findOne({short: url})
      .then(data => res.json(data))
      .catch(
        err => res.status(400).json({
          ok: false,
          message: err
        }))
  } else {
    err => res.status(400).json(
      {ok: false, message: "Invalid short url"}
    )
  }
});

const wrap = require("../../middleware/wrap");
router.post("/", wrap(async (req, res) => {
  const shortUrl = await getShortUrl();
  console.log("generated: " + shortUrl);
  if (shortUrl) {
    new Url({
      short: shortUrl,
      long: req.body.longurl,
      clicks: 0
    }).save()
      .then(data => res.json(data))
      .catch(error => res.status(400).json(
        {ok: false, message: "Failed to save the generated url"}));
  } else {
    res.json({ok: false, message: "Failed to generate short url."})
  }
}));

module.exports = router;
