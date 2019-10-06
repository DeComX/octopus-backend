const User = require("../models/User");
const Session = require("../models/Session");
const Event = require("../models/Event");
const Campaign = require("../models/Campaign");

const userPublicFields = require("../models/fields/user").publicFields;

// return a promise
const fillSession = (session) => {
  const sessionObj = (session instanceof Session)
    ? session.toObject()
    : session;
  return User.find(
    {_id: session.speakers},
    Object.keys(userPublicFields || {}).join(' ')
  ).then(users => {
    sessionObj.speakers = users;
    return Promise.resolve(sessionObj);
  })
  .catch(err => {
    sessionObj.speakers = [];
    return Promise.resolve(sessionObj);
  });
}

const fillSessions = (sessions) => {
  const promises = sessions
    .map(session => fillSession(session));
  return Promise.all(promises);
}

const fillEvent = (event) => {
  let eventObj = event.toObject();
  return new Promise(
    (resolve, reject) => {
      fillSessions(event.sessions)
        .then(filledSessions => {
          eventObj.sessions = filledSessions;
          resolve(eventObj);
        });
    }
  );
}

const fillEvents = (events) => {
  const promises = events
    .map(event => fillEvent(event));
  return new Promise(
    (resolve, reject) => {
      Promise
        .all(promises)
        .then((filled) => resolve(filled));
    }
  );
}

const fillCampaign = (campaign) => {
  let campaignObj = campaign.toObject();
  return new Promise(
    (resolve, reject) => {
      Event.findById(campaign.event)
        .then(event => {
          fillEvent(event)
            .then(filledEvent => {
              campaignObj.event = filledEvent;
              resolve(campaignObj);
            })
        })
        .catch(err => {
          campaignObj.event = null;
          resolve(campaignObj);
        });
    }
  );
}

const fillCampaigns = (campaigns) => {
  const promises = campaigns
    .map(campaign => fillCampaign(campaign));
  return new Promise(
    (resolve, reject) => {
      Promise
        .all(promises)
        .then((filled) => resolve(filled));
    }
  );
}

module.exports = {
  fillSession: fillSession,
  fillSessions: fillSessions,
  fillEvent: fillEvent,
  fillEvents: fillEvents,
  fillCampaign: fillCampaign,
  fillCampaigns: fillCampaigns
}
