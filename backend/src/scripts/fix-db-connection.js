import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
const envPath = path.join(__dirname, '../../.env');

function fixConnectionString() {
  console.log('\n🔧 Fixing Database Connection String\n');
  console.log('='.repeat(70));
  
  if (!MONGO_URI) {
    console.log('\n❌ MONGO_URI not found in environment variables');
    console.log('\n💡 Please set MONGO_URI in backend/.env file');
    console.log('   Format: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/iss_yemen_club\n');
    process.exit(1);
  }

  console.log(`\n📡 Current Connection String: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
  
  // Check if database name is included
  const hasDatabaseName = MONGO_URI.match(/\/[^\/\?]+(\?|$)/);
  const isAtlas = MONGO_URI.includes('mongodb+srv://');
  
  if (!hasDatabaseName && isAtlas) {
    console.log('\n⚠️  Database name not found in connection string!');
    console.log('   Adding database name: iss_yemen_club\n');
    
    // Add database name to connection string
    let fixedUri = MONGO_URI;
    if (fixedUri.endsWith('/')) {
      fixedUri = fixedUri + 'iss_yemen_club';
    } else if (!fixedUri.includes('/') || fixedUri.endsWith('mongodb.net')) {
      fixedUri = fixedUri + '/iss_yemen_club';
    } else {
      // Check if there's a query string
      const urlParts = fixedUri.split('?');
      if (urlParts[0].endsWith('mongodb.net')) {
        fixedUri = urlParts[0] + '/iss_yemen_club' + (urlParts[1] ? '?' + urlParts[1] : '');
      }
    }
    
    console.log(`📝 Fixed Connection String: ${fixedUri.replace(/:[^:@]+@/, ':****@')}`);
    
    // Update .env file
    try {
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Replace or add MONGO_URI
      if (envContent.includes('MONGO_URI=')) {
        envContent = envContent.replace(/MONGO_URI=.*/g, `MONGO_URI=${fixedUri}`);
      } else {
        envContent += `\nMONGO_URI=${fixedUri}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Updated backend/.env file');
      console.log('   Please restart your backend server for changes to take effect\n');
    } catch (error) {
      console.log('\n⚠️  Could not update .env file automatically');
      console.log('   Please manually update backend/.env:');
      console.log(`   MONGO_URI=${fixedUri}\n`);
    }
  } else if (hasDatabaseName) {
    const dbName = MONGO_URI.match(/\/([^\/\?]+)(\?|$)/)?.[1];
    console.log(`\n✅ Database name found: ${dbName}`);
    
    if (dbName !== 'iss_yemen_club') {
      console.log(`\n⚠️  Database name is "${dbName}" but expected "iss_yemen_club"`);
      console.log('   If this is intentional, you can ignore this warning');
      console.log('   Otherwise, update MONGO_URI in backend/.env\n');
    } else {
      console.log('✅ Database name is correct!\n');
    }
  }
  
  // Verify connection string format
  console.log('📋 Connection String Verification:');
  console.log('='.repeat(70));
  
  if (isAtlas) {
    console.log('✅ Using MongoDB Atlas (Cloud)');
  } else if (MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1')) {
    console.log('⚠️  Using Local MongoDB');
    console.log('   To use cloud, change to: mongodb+srv://...');
  } else {
    console.log('ℹ️  Using Remote MongoDB');
  }
  
  const hasCredentials = MONGO_URI.includes('@');
  console.log(`${hasCredentials ? '✅' : '❌'} Credentials included`);
  
  const hasCluster = MONGO_URI.includes('.mongodb.net');
  console.log(`${hasCluster ? '✅' : '❌'} Cluster URL included`);
  
  console.log('');
}

fixConnectionString();
