const axios = require("axios");

const TIMEOUT_MS = 8000;

const client = axios.create({ timeout: TIMEOUT_MS });

async function fetchExternalData(name) {
  const encoded = encodeURIComponent(name);

  const [genderRes, ageRes, nationRes] = await Promise.all([
    client.get(`https://api.genderize.io?name=${encoded}`),
    client.get(`https://api.agify.io?name=${encoded}`),
    client.get(`https://api.nationalize.io?name=${encoded}`),
  ]);

  return {
    gender: genderRes.data,
    age: ageRes.data,
    nationality: nationRes.data,
  };
}

module.exports = { fetchExternalData };
