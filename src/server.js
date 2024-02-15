import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetchTokenInfo from './monitor.cjs';

/**
 * Init express
 */
const app = express();

/**
 * Cors setup
 */
var whitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors());

/**
 * Set basic express settings
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Helmet for basic security in production
 */
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
}

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

/**
 * Exporting express app instance
 */
export default app;
