module.exports = {
  mongoURI: "mongodb://root:root@mongo:27017/dev?authSource=admin",
  secretOrKey: process.env.SECRET || 'secret',
  'googleAuth' : {
    'clientID': '640401081274-hv1gj27pfofkg504mct41n8jh3k2bkgc.apps.googleusercontent.com',
    'clientSecret': 'your-secret',
    'callbackURL': 'https://api.abcer.world/auth/google/callback'
  }
};
