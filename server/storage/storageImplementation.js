const LocalStorageProvider = require('./LocalStorageProvider');

// Default storage implementation singleton (can be configured via environment variables)
const storageInstance = new LocalStorageProvider();

module.exports = storageInstance;
