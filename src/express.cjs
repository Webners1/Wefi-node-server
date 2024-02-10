const express = require('express');
const app = express();
const fetchTokenInfo = require('./monitor.cjs'); // Import the function from the logic file

// Define a route that triggers the fetchTokenInfo function
app.post('/', async (req, res) => {
  console.log("this")
   fetchTokenInfo(res); // Call the logic function to fetch token info
    const {body} = req; // Send the token info as a JSON response
    try {
        console.log(body);
      } catch (e) {
        console.log(e);
        return res.status(400).json();
      }
        return res.status(200).json();
});

const port = 3000; // Choose a port for your Express app (you can change it to your desired port)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
