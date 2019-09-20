const Member = require("../models/Member");
const Session = require("../models/Session");
const Event = require("../models/Event");

// return a promise
const fillSession = (session) => {
  let sessionObj = session;
  try {
    sessionObj = session.toObject();
  } catch(e) {
    sessionObj = session;
  }

  return new Promise(
    (resolve, reject) => {
      Member.find({_id: session.speakers})
        .then(members => {
          sessionObj.speakers = members;
          resolve(sessionObj);
        })
        .catch(err => {
          sessionObj.speakers = [];
          resolve(sessionObj);
        });
    }
  );
}

const fillSessions = (sessions) => {
  const promises = sessions
    .map(session => fillSession(session));
  return new Promise(
    (resolve, reject) => {
      Promise.all(promises)
      .then((filled) => {
        resolve(filled);
      })
    }
  );
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
