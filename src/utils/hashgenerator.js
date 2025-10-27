// hash_generator.js - Run this file to generate password hashes
const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = [
    '12345678',
    'labincharge123', 
    'labassistant123',
  ];

  console.log('Password Hashes for SQL:');
  console.log('========================');
  
  for (let password of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Password: "${password}"`);
    console.log(`Hash: "${hash}"`);
    console.log('---');
  }
}

generateHashes().catch(console.error);