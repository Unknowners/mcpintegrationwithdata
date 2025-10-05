#!/usr/bin/env node
/**
 * Тестування MCP DocuMinds сервера
 */

const axios = require('axios');

async function testMCPDocuMinds() {
  const baseUrl = 'https://mcp.documinds.online';
  
  console.log('🧪 Тестування MCP DocuMinds сервера');
  console.log(`🔗 URL: ${baseUrl}`);
  console.log('=' * 50);
  
  try {
    // Health check
    console.log('\n🏥 Health Check:');
    const health = await axios.get(`${baseUrl}/health`, {
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`📊 Status: ${health.status}`);
    console.log(`📝 Response: ${JSON.stringify(health.data)}`);
    
    // Organizations
    console.log('\n🏢 Organizations:');
    const orgs = await axios.get(`${baseUrl}/api/organizations`, {
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`📊 Status: ${orgs.status}`);
    if (orgs.data.success) {
      console.log(`📊 Count: ${orgs.data.count}`);
      console.log(`📝 Data: ${JSON.stringify(orgs.data.data, null, 2)}`);
    } else {
      console.log(`❌ Error: ${orgs.data.error}`);
    }
    
    // Database info
    console.log('\n🗄️ Database Info:');
    const dbInfo = await axios.get(`${baseUrl}/api/database-info`, {
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`📊 Status: ${dbInfo.status}`);
    if (dbInfo.data.success) {
      console.log(`📊 Tables: ${dbInfo.data.total_tables_checked}`);
      console.log(`📊 Tables with data: ${dbInfo.data.tables_with_data}`);
      console.log(`📝 Details: ${JSON.stringify(dbInfo.data.table_details, null, 2)}`);
    } else {
      console.log(`❌ Error: ${dbInfo.data.error}`);
    }
    
    console.log('\n🎉 Тестування завершено!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Response:', error.response.data);
    }
  }
}

testMCPDocuMinds();
