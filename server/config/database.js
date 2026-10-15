import mongoose from 'mongoose';
import dns from 'dns';

// Configure public DNS resolvers to handle SRV lookups reliably across cloud environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in restricted environments
}

let isConnecting = false;
let listenersAttached = false;

const attachEventListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to database');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from database');
  });

  // Graceful shutdown handling
  const gracefulExit = async (signal) => {
    try {
      await mongoose.connection.close();
      console.log(`🛑 MongoDB connection closed through ${signal}`);
      process.exit(0);
    } catch (err) {
      console.error(`Error during MongoDB disconnection on ${signal}:`, err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulExit('SIGINT'));
  process.on('SIGTERM', () => gracefulExit('SIGTERM'));
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return null;
  }

  isConnecting = true;
  attachEventListeners();

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not defined!');
      isConnecting = false;
      return null;
    }

    // MongoDB connection options for optimal performance and cloud compatibility
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 20000, // 20s timeout to allow for cloud cold-starts
      socketTimeoutMS: 45000,
    };

    const connection = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`📍 Host: ${connection.connection.host}`);
    console.log(`📂 Database: ${connection.connection.name}`);

    isConnecting = false;
    return connection;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB Connection Failed:', error.message);

    if (error.message && error.message.includes('querySrv ENOTFOUND')) {
      console.error('💡 Atlas DNS lookup failed for the cluster hostname in MONGODB_URI.');
      console.error('   Common causes:');
      console.error('   1. Free tier (M0) cluster is paused due to inactivity in MongoDB Atlas (Atlas deletes SRV DNS records when paused).');
      console.error('   2. The cluster was deleted or re-created with a new name, but Render still has the old MONGODB_URI.');
      console.error('   3. Typo in MONGODB_URI configured in Render dashboard.');
    }

    // Do not crash the process; retry in background so HTTP server remains operational
    console.log('🔄 Will retry MongoDB connection in 10 seconds...');
    setTimeout(() => {
      connectDatabase().catch((retryErr) => {
        console.error('❌ Reconnection attempt failed:', retryErr.message);
      });
    }, 10000);

    return null;
  }
};

// Function to check database health
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return {
      status: states[state] || 'unknown',
      isHealthy: state === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  } catch (error) {
    return {
      status: 'error',
      isHealthy: false,
      error: error.message,
    };
  }
};

// Function to close database connection (useful for testing)
export const closeDatabaseConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

export default connectDatabase;