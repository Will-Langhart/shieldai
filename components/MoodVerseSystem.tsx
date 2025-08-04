import React, { useState } from 'react';
import { Heart, BookOpen, Prayer, Smile, Frown, Meh, Zap, Sparkles } from 'lucide-react';

interface MoodVerse {
  mood: string;
  verses: string[];
  prayers: string[];
  encouragements: string[];
  color: string;
  icon: React.ReactNode;
}

interface MoodVerseSystemProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onVerseSelect?: (verse: string) => void;
}

const MoodVerseSystem: React.FC<MoodVerseSystemProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  onVerseSelect 
}) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verses' | 'prayers' | 'encouragement'>('verses');

  const moodData: Record<string, MoodVerse> = {
    sad: {
      mood: 'Sad',
      verses: [
        "Psalm 34:18 - The LORD is close to the brokenhearted and saves those who are crushed in spirit.",
        "Matthew 11:28 - Come to me, all you who are weary and burdened, and I will give you rest.",
        "Psalm 147:3 - He heals the brokenhearted and binds up their wounds.",
        "Isaiah 41:10 - So do not fear, for I am with you; do not be dismayed, for I am your God.",
        "2 Corinthians 1:3-4 - Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort."
      ],
      prayers: [
        "Dear Lord, in my sadness, I turn to You. You are my refuge and strength. Help me to find comfort in Your presence and hope in Your promises. Amen.",
        "Father, when my heart is heavy, remind me that You are near. Give me the strength to trust in Your plan and find peace in Your love. Amen.",
        "Lord Jesus, You know what it's like to suffer. Be with me in my pain and help me to see Your light even in the darkness. Amen."
      ],
      encouragements: [
        "Your feelings are valid, but they don't define your worth. God sees you and loves you deeply.",
        "It's okay to not be okay. God is with you in every moment, even the difficult ones.",
        "Remember that this too shall pass. God is working all things for your good."
      ],
      color: 'from-blue-500 to-purple-600',
      icon: <Frown className="w-6 h-6" />
    },
    anxious: {
      mood: 'Anxious',
      verses: [
        "Philippians 4:6-7 - Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        "1 Peter 5:7 - Cast all your anxiety on him because he cares for you.",
        "Matthew 6:34 - Therefore do not worry about tomorrow, for tomorrow will worry about itself.",
        "Isaiah 26:3 - You will keep in perfect peace those whose minds are steadfast, because they trust in you.",
        "Psalm 55:22 - Cast your cares on the LORD and he will sustain you."
      ],
      prayers: [
        "Lord, my mind is racing with worries. Help me to cast all my anxieties on You, knowing that You care for me. Give me Your perfect peace. Amen.",
        "Father, when fear grips my heart, remind me that You are in control. Help me to trust in Your goodness and rest in Your promises. Amen.",
        "Jesus, You calmed the storm. Calm the storm in my heart and mind. Help me to focus on You instead of my worries. Amen."
      ],
      encouragements: [
        "Take a deep breath. God is in control, even when you feel out of control.",
        "Your anxiety doesn't define you. God's peace is greater than any worry.",
        "One step at a time. God is with you in this moment and every moment to come."
      ],
      color: 'from-yellow-500 to-orange-500',
      icon: <Zap className="w-6 h-6" />
    },
    grateful: {
      mood: 'Grateful',
      verses: [
        "1 Thessalonians 5:18 - Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
        "Psalm 136:1 - Give thanks to the LORD, for he is good. His love endures forever.",
        "Colossians 3:15 - Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.",
        "Psalm 100:4 - Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.",
        "James 1:17 - Every good and perfect gift is from above, coming down from the Father of the heavenly lights."
      ],
      prayers: [
        "Thank You, Lord, for Your countless blessings. Help me to always have a grateful heart and to share Your love with others. Amen.",
        "Father, I am overwhelmed by Your goodness. Thank You for Your grace, mercy, and love. Help me to be a blessing to others. Amen.",
        "Lord, my heart is full of gratitude. Thank You for Your faithfulness and for always being with me. Amen."
      ],
      encouragements: [
        "Your gratitude is a beautiful reflection of God's love in your life.",
        "Keep counting your blessings - they are evidence of God's goodness.",
        "Your thankful heart is a light to others. Share that joy!"
      ],
      color: 'from-green-500 to-emerald-600',
      icon: <Smile className="w-6 h-6" />
    },
    confused: {
      mood: 'Confused',
      verses: [
        "James 1:5 - If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
        "Proverbs 3:5-6 - Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        "Isaiah 55:8-9 - For my thoughts are not your thoughts, neither are your ways my ways, declares the LORD.",
        "Psalm 119:105 - Your word is a lamp for my feet, a light on my path.",
        "Jeremiah 29:11 - For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future."
      ],
      prayers: [
        "Lord, I feel lost and confused. Give me wisdom and clarity. Help me to trust in Your plan even when I don't understand. Amen.",
        "Father, when my mind is clouded, shine Your light on my path. Help me to see Your will clearly. Amen.",
        "Jesus, You are the way, the truth, and the life. Guide me through this confusion and show me the right path. Amen."
      ],
      encouragements: [
        "It's okay to not have all the answers. God does, and He's guiding you.",
        "Confusion is often a sign that God is working something new in your life.",
        "Trust the process. God is working even when you can't see it clearly."
      ],
      color: 'from-purple-500 to-indigo-600',
      icon: <Meh className="w-6 h-6" />
    },
    lonely: {
      mood: 'Lonely',
      verses: [
        "Isaiah 41:10 - So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.",
        "John 14:18 - I will not leave you as orphans; I will come to you.",
        "Psalm 68:6 - God sets the lonely in families, he leads out the prisoners with singing.",
        "Hebrews 13:5 - Never will I leave you; never will I forsake you.",
        "Psalm 25:16 - Turn to me and be gracious to me, for I am lonely and afflicted."
      ],
      prayers: [
        "Lord, I feel so alone. Remind me that You are always with me and that You will never leave me. Fill my heart with Your presence. Amen.",
        "Father, in my loneliness, help me to feel Your love and to know that I am never truly alone. Amen.",
        "Jesus, You understand loneliness. Be with me now and help me to find comfort in Your presence. Amen."
      ],
      encouragements: [
        "You are never truly alone. God is always with you, even in your loneliest moments.",
        "This season of loneliness can be a time to draw closer to God.",
        "God sees you and loves you. You are precious in His sight."
      ],
      color: 'from-gray-500 to-slate-600',
      icon: <Heart className="w-6 h-6" />
    }
  };

  const moods = [
    { id: 'sad', name: 'Sad', icon: <Frown className="w-5 h-5" /> },
    { id: 'anxious', name: 'Anxious', icon: <Zap className="w-5 h-5" /> },
    { id: 'grateful', name: 'Grateful', icon: <Smile className="w-5 h-5" /> },
    { id: 'confused', name: 'Confused', icon: <Meh className="w-5 h-5" /> },
    { id: 'lonely', name: 'Lonely', icon: <Heart className="w-5 h-5" /> }
  ];

  const handleVerseSelect = (verse: string) => {
    onVerseSelect?.(verse);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>How are you feeling today?</h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Let Shield AI provide comfort and guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mood Selection */}
        {!selectedMood && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      {mood.icon}
                    </div>
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {mood.name}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content for Selected Mood */}
        {selectedMood && moodData[selectedMood] && (
          <div>
            {/* Mood Header */}
            <div className={`p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 bg-gradient-to-r ${moodData[selectedMood].color} rounded-lg`}>
                  {moodData[selectedMood].icon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {moodData[selectedMood].mood}
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Here's some comfort and guidance for you
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {[
                { id: 'verses', name: 'Bible Verses', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'prayers', name: 'Prayers', icon: <Prayer className="w-4 h-4" /> },
                { id: 'encouragement', name: 'Encouragement', icon: <Sparkles className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'text-pink-400 border-b-2 border-pink-400'
                        : 'text-pink-600 border-b-2 border-pink-600'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'verses' && (
                <div className="space-y-4">
                  {moodData[selectedMood].verses.map((verse, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-105 ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleVerseSelect(verse)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className={`leading-relaxed ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {verse}
                          </p>
                          <p className={`text-sm mt-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Click to use this verse in chat
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'prayers' && (
                <div className="space-y-4">
                  {moodData[selectedMood].prayers.map((prayer, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-800'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Prayer className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className={`leading-relaxed italic ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {prayer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'encouragement' && (
                <div className="space-y-4">
                  {moodData[selectedMood].encouragements.map((encouragement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-800'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className={`leading-relaxed ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {encouragement}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedMood(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ← Choose a different mood
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodVerseSystem; 