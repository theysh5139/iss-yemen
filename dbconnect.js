const { MongoClient } = require('mongodb');

// Define your connection details
const uri = "mongodb+srv://moqbelali_db_user:vdntP1HoAQrpSYUt@cluster.mongodb.net/iss_yemen_club?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function connectAndQuery() {
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    const database = client.db('iss_yemen_club');
    const collection = database.collection('users');
    
    // Example query
    const user = await collection.findOne({ id: 1 });
    console.log('Query result:', user);

    await client.close();
  } catch (err) {
    console.error('Connection or Query Error:', err);
  }
}

connectAndQuery();