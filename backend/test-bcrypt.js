const bcrypt = require('bcrypt');

async function testBcrypt() {
  const password = 'user123';
  
  // Test hash and compare
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password valid:', isValid);
  
  // Test against a base64 hash (old format)
  const base64Hash = Buffer.from(password).toString('base64');
  console.log('Base64 hash:', base64Hash);
  
  const isValidBase64 = await bcrypt.compare(password, base64Hash).catch(() => false);
  console.log('Base64 valid with bcrypt:', isValidBase64);
}

testBcrypt().catch(console.error);