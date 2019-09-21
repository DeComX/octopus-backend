const homedir = require('os').homedir();
const fs = require('fs');

const configPath = homedir + "/code/configs/";
const configFiles = {
  'prod': 'keys.prod.json',
  'dev': 'keys.dev.json',
  'local': 'keys.local.json'
};

const loadConfig = () => {
  const mode = process.env.MODE || "local";
  const configFile = process.env.CONFIG_FILE || configPath + configFiles[mode];
  const rawdata = fs.readFileSync(configFile);
  return JSON.parse(rawdata);
}

module.exports = {
  config: loadConfig()
}
