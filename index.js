const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();

// Rate limit parameters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

// Apply rate limiter to all requests
app.use(limiter);

// Endpoint to fetch random user data
app.get("/random-user", async (req, res) => {
  try {
    const apiUrl = "https://randomuser.me/api/";
    const response = await axios.get(apiUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
