const express = require("express");
const axios = require("axios");

const app = express();

const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
const MAX_RANDOM_USER_REQUESTS = 7;
const MAX_COIN_GECKO_REQUESTS = 5;
const randomUserRequestMap = new Map(); // Map to store random user requests per IP
const coinGeckoRequestMap = new Map(); // Map to store CoinGecko requests per IP

const getRandomUserData = async () => {
  try {
    const apiUrl = "https://randomuser.me/api/";
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Failed to fetch random user data");
  }
};

const getCoinGeckoData = async () => {
  try {
    const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Failed to fetch CoinGecko data");
  }
};

const randomUserRateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const currentTimestamp = Date.now();
  const requests = randomUserRequestMap.get(ip) || [];
  console.log(randomUserRequestMap.get(ip));
  console.log(requests, req.ip);
  requests.push(currentTimestamp);
  randomUserRequestMap.set(ip, requests);
  randomUserRequestMap.set(
    ip,
    requests.filter((timestamp) => timestamp > currentTimestamp - WINDOW_SIZE)
  );
  if (randomUserRequestMap.get(ip).length > MAX_RANDOM_USER_REQUESTS) {
    res.status(429).send("Too many requests for random user data from this IP, please try again later");
    return;
  }
  next();
};

const coinGeckoRateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const currentTimestamp = Date.now();
  const requests = coinGeckoRequestMap.get(ip) || [];
  requests.push(currentTimestamp);
  coinGeckoRequestMap.set(ip, requests);
  coinGeckoRequestMap.set(
    ip,
    requests.filter((timestamp) => timestamp > currentTimestamp - WINDOW_SIZE)
  );
  if (coinGeckoRequestMap.get(ip).length > MAX_COIN_GECKO_REQUESTS) {
    res.status(429).send("Too many requests for CoinGecko data from this IP, please try again later");
    return;
  }
  next();
};

app.use("/random-user", randomUserRateLimitMiddleware);
app.use("/coin-gecko", coinGeckoRateLimitMiddleware);

app.get("/random-user", async (req, res) => {
  try {
    const userData = await getRandomUserData();
    res.json(userData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/coin-gecko", async (req, res) => {
  try {
    const coinGeckoData = await getCoinGeckoData();
    res.json(coinGeckoData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
