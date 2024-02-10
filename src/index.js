const express = require('express');
const app = express();
const fetchTokenInfo = require('./monitor.cjs'); // Import the function from the logic file

// Define a route that triggers the fetchTokenInfo function
app.post('/wait', async (req, res) => {
    const tokenInfo = fetchTokenInfo(req.body); // Call the logic function with the webhook data
    try {
        console.log(tokenInfo);
        // Process the wallet data here (e.g., save to a database, send notifications, etc.)
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
