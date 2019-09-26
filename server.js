const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require('path');

const users = require("./routes/api/users");
const sessions = require("./routes/api/sessions");
const events = require("./routes/api/events");
const campaigns = require("./routes/api/campaigns");
const organizations = require("./routes/api/organizations");
const urls = require("./routes/api/urls");
const publicurl = require("./routes/url");
const config = require("./config");
const aclApi = require("./acl/acl_api");

const app = express();

const cors = require('cors');
const corsOptions = {
  origin: function (origin, callback) {
    if (origin === undefined || config.cors_whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions));

// Bodyparser middleware
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// DB Config
const options = {
  useNewUrlParser: true,
  useFindAndModify: false
};
mongoose
  .connect(config.mongoURI, options)
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

// Routes
app.all('*', require("./middleware/auth"));
app.use("/api/v1/publicurl", publicurl);
app.use("/api/v1/urls", urls);
app.use("/api/v1/users", users);
app.use("/api/v1/sessions", sessions);
app.use("/api/v1/events", events);
app.use("/api/v1/organizations", organizations);
app.use("/api/v1/campaigns", campaigns);
app.use("/api/v1/acl", aclApi);

app.use('/static', express.static(path.join(__dirname, 'files')))

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there

app.listen(port, () => console.log(`Server up and running on port ${port} !`));
