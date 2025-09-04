/**
 * Development Logging Configuration
 * 
 * This file controls what gets logged during local development.
 * Modify these settings to focus on specific areas for debugging.
 */

export interface DevLoggingConfig {
  // YouTube API logging
  youtube: {
    enabled: boolean;
    search: boolean;
    errors: boolean;
    fallbacks: boolean;
    apiCalls: boolean;
    retries: boolean;
  };
  
  // Chat API logging
  chat: {
    enabled: boolean;
    requests: boolean;
    streaming: boolean;
    videoSearch: boolean;
    responses: boolean;
    errors: boolean;
  };
  
  // Database operations
  database: {
    enabled: boolean;
    saves: boolean;
    loads: boolean;
    errors: boolean;
  };
  
  // General application logging
  general: {
    enabled: boolean;
    auth: boolean;
    memory: boolean;
    analytics: boolean;
  };
  
  // File logging
  fileLogging: {
    enabled: boolean;
    directory: string;
    maxFileSize: number; // in MB
    maxFiles: number;
  };
}

// Default configuration - modify these values to control logging
export const devLoggingConfig: DevLoggingConfig = {
  youtube: {
    enabled: true,
    search: true,
    errors: true,
    fallbacks: true,
    apiCalls: true,
    retries: true,
  },
  
  chat: {
    enabled: true,
    requests: true,
    streaming: true,
    videoSearch: true,
    responses: true,
    errors: true,
  },
  
  database: {
    enabled: true,
    saves: true,
    loads: true,
    errors: true,
  },
  
  general: {
    enabled: true,
    auth: true,
    memory: true,
    analytics: true,
  },
  
  fileLogging: {
    enabled: true,
    directory: 'logs/dev',
    maxFileSize: 10, // 10MB
    maxFiles: 5,
  },
};

// Environment-specific overrides
export function getLoggingConfig(): DevLoggingConfig {
  const config = { ...devLoggingConfig };
  
  // Override based on environment variables
  if (process.env.DISABLE_YOUTUBE_LOGGING === 'true') {
    config.youtube.enabled = false;
  }
  
  if (process.env.DISABLE_CHAT_LOGGING === 'true') {
    config.chat.enabled = false;
  }
  
  if (process.env.DISABLE_DB_LOGGING === 'true') {
    config.database.enabled = false;
  }
  
  if (process.env.DISABLE_FILE_LOGGING === 'true') {
    config.fileLogging.enabled = false;
  }
  
  // Enable all logging in development by default
  if (process.env.NODE_ENV === 'development') {
    // Keep all enabled by default
  }
  
  return config;
}

// Helper functions to check if specific logging is enabled
export const shouldLog = {
  youtube: (type: keyof DevLoggingConfig['youtube']) => {
    const config = getLoggingConfig();
    return config.youtube.enabled && config.youtube[type];
  },
  
  chat: (type: keyof DevLoggingConfig['chat']) => {
    const config = getLoggingConfig();
    return config.chat.enabled && config.chat[type];
  },
  
  database: (type: keyof DevLoggingConfig['database']) => {
    const config = getLoggingConfig();
    return config.database.enabled && config.database[type];
  },
  
  general: (type: keyof DevLoggingConfig['general']) => {
    const config = getLoggingConfig();
    return config.general.enabled && config.general[type];
  },
  
  file: () => {
    const config = getLoggingConfig();
    return config.fileLogging.enabled;
  },
};

// Quick enable/disable functions for debugging specific issues
export const quickLogging = {
  // Focus on YouTube API issues
  focusOnYouTube: () => {
    devLoggingConfig.youtube.enabled = true;
    devLoggingConfig.chat.enabled = false;
    devLoggingConfig.database.enabled = false;
    devLoggingConfig.general.enabled = false;
    console.log('🔍 Logging focused on YouTube API only');
  },
  
  // Focus on Chat API issues
  focusOnChat: () => {
    devLoggingConfig.youtube.enabled = false;
    devLoggingConfig.chat.enabled = true;
    devLoggingConfig.database.enabled = false;
    devLoggingConfig.general.enabled = false;
    console.log('💬 Logging focused on Chat API only');
  },
  
  // Focus on Database issues
  focusOnDatabase: () => {
    devLoggingConfig.youtube.enabled = false;
    devLoggingConfig.chat.enabled = false;
    devLoggingConfig.database.enabled = true;
    devLoggingConfig.general.enabled = false;
    console.log('💾 Logging focused on Database operations only');
  },
  
  // Enable all logging
  enableAll: () => {
    devLoggingConfig.youtube.enabled = true;
    devLoggingConfig.chat.enabled = true;
    devLoggingConfig.database.enabled = true;
    devLoggingConfig.general.enabled = true;
    console.log('🚀 All logging enabled');
  },
  
  // Disable all logging
  disableAll: () => {
    devLoggingConfig.youtube.enabled = false;
    devLoggingConfig.chat.enabled = false;
    devLoggingConfig.database.enabled = false;
    devLoggingConfig.general.enabled = false;
    console.log('🔇 All logging disabled');
  },
};

