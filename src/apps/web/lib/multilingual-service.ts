export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  bibleAvailable: boolean;
  audioAvailable: boolean;
}

export interface Translation {
  languageCode: string;
  bibleVersion: string;
  apiProvider: string;
  fallbackProvider?: string;
}

class MultilingualService {
  private supportedLanguages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'zh',
      name: 'Chinese (Simplified)',
      nativeName: '中文 (简体)',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      direction: 'rtl',
      bibleAvailable: true,
      audioAvailable: true
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      direction: 'ltr',
      bibleAvailable: true,
      audioAvailable: true
    }
  ];

  private bibleTranslations: Translation[] = [
    { languageCode: 'en', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'es', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'fr', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'de', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'pt', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'it', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'ru', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'zh', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'ja', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'ko', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'ar', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' },
    { languageCode: 'hi', bibleVersion: 'de4e12af7f28f599-02', apiProvider: 'api.bible' }
  ];

  private uiTranslations: Record<string, Record<string, string>> = {
    en: {
      'welcome': 'Welcome to Shield AI',
      'chat_placeholder': 'Ask me anything about theology, philosophy, or defending the Christian worldview...',
      'bible_search': 'Bible Search',
      'church_finder': 'Church Finder',
      'mood_verses': 'Mood Verses',
      'apologetics': 'Apologetics',
      'settings': 'Settings',
      'sign_in': 'Sign In',
      'sign_up': 'Sign Up',
      'sign_out': 'Sign Out',
      'new_conversation': 'New Conversation',
      'send_message': 'Send Message',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'cancel': 'Cancel',
      'save': 'Save',
      'delete': 'Delete',
      'edit': 'Edit',
      'close': 'Close',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'refresh': 'Refresh',
      'copy': 'Copy',
      'share': 'Share',
      'like': 'Like',
      'dislike': 'Dislike',
      'report': 'Report',
      'help': 'Help',
      'about': 'About',
      'privacy': 'Privacy',
      'terms': 'Terms',
      'contact': 'Contact',
      'feedback': 'Feedback',
      'support': 'Support',
      'upgrade': 'Upgrade',
      'premium': 'Premium',
      'free': 'Free',
      'trial': 'Trial',
      'subscription': 'Subscription',
      'payment': 'Payment',
      'billing': 'Billing',
      'account': 'Account',
      'profile': 'Profile',
      'preferences': 'Preferences',
      'notifications': 'Notifications',
      'security': 'Security',
      'language': 'Language',
      'theme': 'Theme',
      'dark_mode': 'Dark Mode',
      'light_mode': 'Light Mode',
      'auto': 'Auto',
      'on': 'On',
      'off': 'Off',
      'enabled': 'Enabled',
      'disabled': 'Disabled',
      'active': 'Active',
      'inactive': 'Inactive',
      'online': 'Online',
      'offline': 'Offline',
      'connected': 'Connected',
      'disconnected': 'Disconnected',
      'syncing': 'Syncing',
      'synced': 'Synced',
      'sync_failed': 'Sync Failed',
      'upload': 'Upload',
      'download': 'Download',
      'export': 'Export',
      'import': 'Import',
      'backup': 'Backup',
      'restore': 'Restore',
      'reset': 'Reset',
      'clear': 'Clear',
      'remove': 'Remove',
      'add': 'Add',
      'create': 'Create',
      'update': 'Update',
      'modify': 'Modify',
      'change': 'Change',
      'switch': 'Switch',
      'toggle': 'Toggle',
      'enable': 'Enable',
      'disable': 'Disable',
      'activate': 'Activate',
      'deactivate': 'Deactivate',
      'start': 'Start',
      'stop': 'Stop',
      'pause': 'Pause',
      'resume': 'Resume',
      'continue': 'Continue',
      'finish': 'Finish',
      'complete': 'Complete',
      'done': 'Done',
      'ready': 'Ready',
      'busy': 'Busy',
      'processing': 'Processing',
      'waiting': 'Waiting',
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'accepted': 'Accepted',
      'declined': 'Declined',
      'confirmed': 'Confirmed',
      'cancelled': 'Cancelled',
      'expired': 'Expired',
      'valid': 'Valid',
      'invalid': 'Invalid',
      'required': 'Required',
      'optional': 'Optional',
      'available': 'Available',
      'unavailable': 'Unavailable',
      'visible': 'Visible',
      'hidden': 'Hidden',
      'public': 'Public',
      'private': 'Private',
      'personal': 'Personal',
      'shared': 'Shared',
      'collaborative': 'Collaborative',
      'individual': 'Individual',
      'group': 'Group',
      'team': 'Team',
      'organization': 'Organization',
      'community': 'Community',
      'network': 'Network',
      'system': 'System',
      'service': 'Service',
      'application': 'Application',
      'platform': 'Platform',
      'tool': 'Tool',
      'resource': 'Resource',
      'content': 'Content',
      'data': 'Data',
      'information': 'Information',
      'knowledge': 'Knowledge',
      'wisdom': 'Wisdom',
      'insight': 'Insight',
      'understanding': 'Understanding',
      'comprehension': 'Comprehension',
      'awareness': 'Awareness',
      'consciousness': 'Consciousness',
      'perception': 'Perception',
      'recognition': 'Recognition',
      'identification': 'Identification',
      'classification': 'Classification',
      'categorization': 'Categorization',
      'structure': 'Structure',
      'framework': 'Framework',
      'architecture': 'Architecture',
      'design': 'Design',
      'layout': 'Layout',
      'format': 'Format',
      'style': 'Style',
      'appearance': 'Appearance',
      'presentation': 'Presentation',
      'display': 'Display',
      'show': 'Show',
      'hide': 'Hide',
      'reveal': 'Reveal',
      'expose': 'Expose',
      'uncover': 'Uncover',
      'discover': 'Discover',
      'explore': 'Explore',
      'investigate': 'Investigate',
      'examine': 'Examine',
      'analyze': 'Analyze',
      'study': 'Study',
      'research': 'Research',
      'investigation': 'Investigation',
      'inquiry': 'Inquiry',
      'question': 'Question',
      'query': 'Query',
      'request': 'Request',
      'demand': 'Demand',
      'require': 'Require',
      'need': 'Need',
      'want': 'Want',
      'desire': 'Desire',
      'wish': 'Wish',
      'hope': 'Hope',
      'expect': 'Expect',
      'anticipate': 'Anticipate',
      'predict': 'Predict',
      'forecast': 'Forecast',
      'project': 'Project',
      'plan': 'Plan',
      'prepare': 'Prepare',
      'arrange': 'Arrange',
      'organize': 'Organize',
      'coordinate': 'Coordinate',
      'manage': 'Manage',
      'administer': 'Administer',
      'supervise': 'Supervise',
      'oversee': 'Oversee',
      'direct': 'Direct',
      'guide': 'Guide',
      'lead': 'Lead',
      'conduct': 'Conduct',
      'execute': 'Execute',
      'perform': 'Perform',
      'carry_out': 'Carry Out',
      'implement': 'Implement',
      'apply': 'Apply',
      'use': 'Use',
      'utilize': 'Utilize',
      'employ': 'Employ',
      'operate': 'Operate',
      'function': 'Function',
      'work': 'Work',
      'run': 'Run',
    }
  };

  getSupportedLanguages(): Language[] {
    return this.supportedLanguages;
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.supportedLanguages.find(lang => lang.code === code);
  }

  getBibleTranslation(languageCode: string): Translation | undefined {
    return this.bibleTranslations.find(trans => trans.languageCode === languageCode);
  }

  translate(key: string, languageCode: string = 'en'): string {
    const translations = this.uiTranslations[languageCode];
    if (!translations) {
      return this.uiTranslations.en?.[key] || key;
    }
    return translations[key] || this.uiTranslations.en?.[key] || key;
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character sets
    // In production, you'd use a proper language detection library
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';
    if (/[а-яё]/i.test(text)) return 'ru';
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text)) return 'es';
    if (/[àâäéèêëïîôöùûüÿç]/.test(text)) return 'fr';
    if (/[äöüß]/.test(text)) return 'de';
    if (/[àáâãçéêíóôõú]/.test(text)) return 'pt';
    if (/[àèéìíîòóù]/.test(text)) return 'it';
    return 'en';
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    // In production, you'd integrate with a translation service like Google Translate
    // For now, we'll return the original text
    return text;
  }

  async getBibleVerseInLanguage(reference: string, languageCode: string): Promise<any> {
    const translation = this.getBibleTranslation(languageCode);
    if (!translation) {
      throw new Error(`No Bible translation available for language: ${languageCode}`);
    }

    // Use the fallback service to get the verse
    const { bibleFallbackService } = await import('./bible-fallback-service');
    return await bibleFallbackService.getVerse(reference);
  }

  async getAudioBibleUrl(reference: string, languageCode: string): Promise<string | null> {
    // In production, you'd integrate with Bible Brain API or similar
    // For now, return null
    return null;
  }

  getDirection(languageCode: string): 'ltr' | 'rtl' {
    const language = this.getLanguageByCode(languageCode);
    return language?.direction || 'ltr';
  }

  isRTL(languageCode: string): boolean {
    return this.getDirection(languageCode) === 'rtl';
  }

  formatDate(date: Date, languageCode: string): string {
    // In production, you'd use proper internationalization
    return date.toLocaleDateString(languageCode);
  }

  formatNumber(number: number, languageCode: string): string {
    // In production, you'd use proper internationalization
    return number.toLocaleString(languageCode);
  }

  formatCurrency(amount: number, currency: string, languageCode: string): string {
    // In production, you'd use proper internationalization
    return new Intl.NumberFormat(languageCode, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

export const multilingualService = new MultilingualService(); 