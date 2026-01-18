require('dotenv').config();
const axios = require('axios');

async function checkTotal() {
  console.log('Checking dammymoihoan.wordpress.com...\n');
  
  // Binary search to find the last page
  let low = 1;
  let high = 2000;
  let lastValidPage = 1;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    
    try {
      const res = await axios.get(`https://dammymoihoan.wordpress.com/page/${mid}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      if (res.status === 200) {
        console.log(`Page ${mid}: EXISTS`);
        lastValidPage = mid;
        low = mid + 1;
      } else {
        console.log(`Page ${mid}: NOT FOUND (${res.status})`);
        high = mid - 1;
      }
    } catch (e) {
      console.log(`Page ${mid}: ERROR - ${e.message}`);
      high = mid - 1;
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n========================================');
  console.log(`Last valid page: ${lastValidPage}`);
  console.log(`Estimated total posts: ${lastValidPage * 10}`);
  console.log('========================================');
}

checkTotal().catch(console.error);
