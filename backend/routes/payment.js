const express = require('express');
const router = express.Router();
const axios = require('axios');

const CHAPA_SECRET_KEY = process.env.JWT_SECRET || 'CHASECK_TEST-0SSGXnZlJQ2rtLaswaUXtLhxAczMjV4i';
const CHAPA_URL = process.env.CHAPA_URL || 'https://api.chapa.co/v1/transaction/initialize';

const config = {
  headers: {
    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
};

router.post('/payment/initialize', async (req, res) => {
  const { email, first_name, last_name, amount, currency, tx_ref } = req.body;
  if (!email || !first_name || !last_name || !amount || !currency || !tx_ref) {
    return res.status(400).json({ status: 'error', message: req.t('payment.missing_fields') });
  }

  const CALLBACK_URL = 'https://edir-if1t.onrender.com/api/verify-payment/';
  const RETURN_URL = 'http://localhost:3000/contributions/'; // Ensure this is correct

  const data = {
    amount: Number(amount),
    currency,
    email,
    first_name,
    last_name,
    tx_ref,
    callback_url: CALLBACK_URL + tx_ref,
    return_url: RETURN_URL + '?tx_ref=' + tx_ref,
  };

  console.log('Payment data sent to Chapa:', data); // Debug log
  try {
    const response = await axios.post(CHAPA_URL, data, config);
    console.log('Chapa API response:', response.data);
    res.json({
      message: req.t('payment.initialize_success'),
      data: response.data,
    });
  } catch (err) {
    console.error('Chapa API error:', err.response?.data || err.message);
    res.status(500).json({
      status: 'error',
      message: req.t('payment.initialize_error'),
      details: err.response?.data || err.message,
    });
  }
});

router.get('/verify-payment/:txRef', async (req, res) => {
  const { txRef } = req.params;
  try {
    const paymentResponse = await axios.get(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
    });
    if (paymentResponse.data.status === 'success') {
      return res.json({
        status: 'success',
        message: req.t('payment.verify_success'),
        data: paymentResponse.data,
      });
    } else {
      return res.json({
        status: 'failed',
        message: req.t('payment.verify_failed'),
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return res.status(500).json({
      status: 'error',
      message: req.t('payment.verify_error'),
      details: error.message,
    });
  }
});

module.exports = router;