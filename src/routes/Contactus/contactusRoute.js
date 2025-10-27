const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/googlesheet', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxTRTRRw5z1GVziXCSBJUTQ9i3WPyYQNh5IW3PhhRhVps46XuIRjKC_BjoX61QFgrbj2w/exec';
    
    // Create form data as URLSearchParams
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('subject', subject);
    formData.append('message', message);
    
    const response = await axios.post(scriptURL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000, // 10 second timeout
    });
    
    res.status(200).json({ 
      message: 'Contact form submitted successfully',
      data: response.data 
    });
    
  } catch (error) {
    console.error('❌ Error processing request');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    console.error('Stack Trace:', error.stack);
    
    res.status(500).json({
      error: 'Internal server error',
      details: error?.response?.data || error.message || 'Unknown error',
    });
  }
});

module.exports = router;