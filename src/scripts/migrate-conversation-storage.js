#!/usr/bin/env node

/**
 * Migration script to convert existing conversation-storage.json to enhanced format
 * This script preserves all existing data while adding new enhanced features
 */

const fs = require('fs');
const path = require('path');

// Paths
const currentStoragePath = path.join(__dirname, '../apps/web/.conversation-storage.json');
const enhancedStoragePath = path.join(__dirname, '../apps/web/.enhanced-conversation-storage.json');
const backupPath = path.join(__dirname, '../apps/web/.conversation-storage.backup.json');

// Helper functions for content analysis
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'thank', 'love', 'blessed'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'wrong', 'confused', 'disappointed'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractTopics(text) {
  const topics = [];
  const bibleTopics = ['jesus', 'god', 'christ', 'bible', 'faith', 'prayer', 'salvation', 'sin', 'heaven', 'hell'];
  const apologeticsTopics = ['apologetics', 'evidence', 'proof', 'resurrection', 'creation', 'evolution', 'atheism'];
  
  const words = text.toLowerCase().split(/\s+/);
  
  bibleTopics.forEach(topic => {
    if (words.some(word => word.includes(topic))) {
      topics.push(topic);
    }
  });
  
  apologeticsTopics.forEach(topic => {
    if (words.some(word => word.includes(topic))) {
      topics.push(topic);
    }
  });
  
  return [...new Set(topics)];
}

function extractBibleReferences(text) {
  const bibleRefPattern = /\b(?:genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms|proverbs|ecclesiastes|song|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi;
  
  return text.match(bibleRefPattern) || [];
}

function countQuestions(text) {
  return (text.match(/\?/g) || []).length;
}

function countScriptureQuotes(text) {
  const quotePattern = /"[^"]*"/g;
  const quotes = text.match(quotePattern) || [];
  return quotes.length;
}

function countApologeticsArguments(text) {
  const argumentIndicators = ['evidence', 'proof', 'argument', 'reason', 'logical', 'rational', 'demonstrate', 'prove'];
  const words = text.toLowerCase().split(/\s+/);
  return argumentIndicators.filter(indicator => words.includes(indicator)).length;
}

function migrateConversation(conversation) {
  const messages = conversation.messages || [];
  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  // Calculate conversation duration
  const startTime = new Date(conversation.created_at).getTime();
  const endTime = new Date(conversation.updated_at).getTime();
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  
  // Calculate average response time
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const userTime = new Date(messages[i].created_at).getTime();
      const assistantTime = new Date(messages[i + 1].created_at).getTime();
      totalResponseTime += (assistantTime - userTime);
      responseCount++;
    }
  }
  
  const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
  
  // Extract topics from all messages
  const allTopics = messages.flatMap(msg => extractTopics(msg.content));
  const uniqueTopics = [...new Set(allTopics)];
  
  // Calculate sentiment score
  const sentiments = messages.map(msg => analyzeSentiment(msg.content));
  const positiveCount = sentiments.filter(s => s === 'positive').length;
  const negativeCount = sentiments.filter(s => s === 'negative').length;
  const sentimentScore = sentiments.length > 0 ? (positiveCount - negativeCount) / sentiments.length : 0;
  
  // Count Bible references and questions
  const bibleVersesReferenced = messages.reduce((sum, msg) => 
    sum + extractBibleReferences(msg.content).length, 0);
  const questionsAsked = messages.reduce((sum, msg) => 
    sum + countQuestions(msg.content), 0);
  
  return {
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    user_id: conversation.user_id,
    
    metadata: {
      total_messages: messages.length,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      conversation_duration_seconds: durationSeconds,
      average_response_time_ms: averageResponseTime,
      topics: uniqueTopics,
      sentiment_score: sentimentScore,
      engagement_level: 'medium', // Default for migrated data
      conversation_quality_score: 75, // Default score
      tags: [],
      difficulty_level: 'intermediate', // Default
      bible_verses_referenced: bibleVersesReferenced,
      questions_asked: questionsAsked,
      follow_up_questions: Math.max(0, questionsAsked - 1)
    },
    
    engagement: {
      time_spent_reading_ms: durationSeconds * 1000, // Estimate
      scroll_depth_percentage: 80, // Default
      messages_clicked: [],
      copy_actions: 0,
      share_actions: 0,
      bookmark_actions: 0,
      last_activity_at: conversation.updated_at,
      return_visits: 0
    },
    
    analytics: {
      session_id: `migrated-session-${conversation.id}`,
      device_type: 'desktop', // Default
      browser: 'unknown',
      ip_address: undefined
    }
  };
}

function migrateMessage(message) {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    user_id: message.user_id,
    content: message.content,
    role: message.role,
    created_at: message.created_at,
    
    metadata: {
      mode: message.metadata?.mode || 'gentle',
      timestamp: message.created_at,
      processing_time_ms: 0, // Not available in old data
      token_count: estimateTokenCount(message.content),
      word_count: message.content.split(' ').length,
      character_count: message.content.length,
      
      user_interactions: {
        was_copied: false,
        was_shared: false,
        was_bookmarked: false,
        was_rated: false
      },
      
      content_analysis: {
        sentiment: analyzeSentiment(message.content),
        topics: extractTopics(message.content),
        entities: [], // Would need more sophisticated extraction
        bible_references: extractBibleReferences(message.content),
        questions_asked: countQuestions(message.content),
        answers_provided: message.role === 'assistant' ? 1 : 0,
        scripture_quotes: countScriptureQuotes(message.content),
        apologetics_arguments: countApologeticsArguments(message.content)
      },
      
      ai_metrics: {
        relevance_score: 0.8, // Default
        accuracy_score: 0.8,
        helpfulness_score: 0.8,
        clarity_score: 0.8,
        biblical_accuracy: 0.9,
        response_completeness: 0.8
      }
    }
  };
}

function migrateData() {
  console.log('🔄 Starting conversation storage migration...');
  
  // Check if current storage exists
  if (!fs.existsSync(currentStoragePath)) {
    console.log('❌ No existing conversation storage found. Nothing to migrate.');
    return;
  }
  
  // Create backup
  console.log('📦 Creating backup of current storage...');
  fs.copyFileSync(currentStoragePath, backupPath);
  console.log('✅ Backup created at:', backupPath);
  
  // Load current data
  console.log('📖 Loading current conversation data...');
  const currentData = JSON.parse(fs.readFileSync(currentStoragePath, 'utf8'));
  
  // Migrate conversations
  console.log('🔄 Migrating conversations...');
  const enhancedConversations = {};
  const enhancedMessages = {};
  
  for (const [conversationId, conversation] of Object.entries(currentData.conversations)) {
    console.log(`  Migrating conversation: ${conversationId}`);
    
    // Migrate conversation
    enhancedConversations[conversationId] = migrateConversation(conversation);
    
    // Migrate messages
    const messages = currentData.messages[conversationId] || [];
    enhancedMessages[conversationId] = messages.map(migrateMessage);
  }
  
  // Create enhanced data structure
  const enhancedData = {
    conversations: enhancedConversations,
    messages: enhancedMessages,
    user_conversations: currentData.userConversations || {},
    user_profiles: {}, // Will be populated as users interact
    analytics: {
      total_conversations: Object.keys(enhancedConversations).length,
      total_messages: Object.values(enhancedMessages).reduce((sum, msgs) => sum + msgs.length, 0),
      active_users: new Set(Object.values(enhancedConversations).map(conv => conv.user_id)).size,
      average_conversation_length: 0, // Will be calculated
      most_popular_topics: [],
      user_satisfaction_average: 0,
      last_updated: new Date().toISOString()
    }
  };
  
  // Calculate analytics
  const allTopics = Object.values(enhancedConversations).flatMap(conv => conv.metadata.topics);
  const topicCounts = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  enhancedData.analytics.most_popular_topics = Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([topic]) => topic);
  
  const conversationLengths = Object.values(enhancedConversations).map(conv => conv.metadata.total_messages);
  enhancedData.analytics.average_conversation_length = conversationLengths.length > 0 
    ? conversationLengths.reduce((sum, len) => sum + len, 0) / conversationLengths.length 
    : 0;
  
  // Save enhanced data
  console.log('💾 Saving enhanced conversation data...');
  fs.writeFileSync(enhancedStoragePath, JSON.stringify(enhancedData, null, 2));
  
  console.log('✅ Migration completed successfully!');
  console.log(`📊 Migrated ${Object.keys(enhancedConversations).length} conversations`);
  console.log(`📊 Migrated ${enhancedData.analytics.total_messages} messages`);
  console.log(`📊 Found ${enhancedData.analytics.active_users} unique users`);
  console.log(`📊 Most popular topics: ${enhancedData.analytics.most_popular_topics.slice(0, 5).join(', ')}`);
  console.log('');
  console.log('📁 Files:');
  console.log(`  Original: ${currentStoragePath}`);
  console.log(`  Backup: ${backupPath}`);
  console.log(`  Enhanced: ${enhancedStoragePath}`);
  console.log('');
  console.log('🔄 Next steps:');
  console.log('  1. Update your code to use the enhanced conversation storage');
  console.log('  2. Test the new features');
  console.log('  3. Remove the backup file once you\'re satisfied');
}

// Run migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
