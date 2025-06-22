#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


async function getAuth0Token() {
  try {
    const response = await axios.post('https://dev-wdrsweug2sfm7ykp.us.auth0.com/oauth/token', {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE || 'scholarship-app-tracker-api',
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Auth0 Token Generated Successfully!');
    console.log('🔑 Access Token:');
    console.log(response.data.access_token);
    console.log('\n📋 Token Type:', response.data.token_type);
    console.log('⏰ Expires In:', response.data.expires_in, 'seconds');
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error generating Auth0 token:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    console.log('\n💡 Make sure you have set AUTH0_CLIENT_SECRET in your .env file');
    console.log('💡 Get your client secret from Auth0 Dashboard → Applications → Your App → Settings');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getAuth0Token();
}

export { getAuth0Token }; 