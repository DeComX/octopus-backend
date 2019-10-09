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
  const eventObj = (event instanceof Event)
    ? event.toObject()
    : event;
  return fillSessions(eventObj.sessions)
    .then(filledSessions => {
      eventObj.sessions = filledSessions;
      return Promise.resolve(eventObj);
    });
}

const fillEvents = (events) => {
  const promises = events
    .map(event => fillEvent(event));
  return Promise.all(promises);
}

const fillCampaign = (campaign) => {
  const campaignObj = (campaign instanceof Campaign)
    ? campaign.toObject()
    : campaign;
  return Event.findById(campaign.event)
    .then(event => {
      return fillEvent(event)
        .then(filledEvent => {
          campaignObj.event = filledEvent;
          return Promise.resolve(campaignObj);
        })
    })
    .catch(err => {
      campaignObj.event = null;
      return Promise.resolve(campaignObj);
    });
}

const fillCampaigns = (campaigns) => {
  const promises = campaigns
    .map(campaign => fillCampaign(campaign));
  return Promise.all(promises);
}

module.exports = {
  fillSession: fillSession,
  fillSessions: fillSessions,
  fillEvent: fillEvent,
  fillEvents: fillEvents,
  fillCampaign: fillCampaign,
  fillCampaigns: fillCampaigns
}
