// Advanced Objection Classifier for Shield AI
// Categorizes user questions and routes to appropriate response strategies

export interface ObjectionAnalysis {
  primaryType: 'logical' | 'moral' | 'scientific' | 'historical' | 'emotional' | 'philosophical' | 'cultural' | 'personal';
  secondaryType?: 'logical' | 'moral' | 'scientific' | 'historical' | 'emotional' | 'philosophical' | 'cultural' | 'personal';
  intensity: 'mild' | 'moderate' | 'strong';
  userStance: 'seeker' | 'skeptic' | 'challenger' | 'believer' | 'struggler';
  keyThemes: string[];
  responseStrategy: 'defensive' | 'educational' | 'pastoral' | 'evidential' | 'philosophical';
  recommendedApproach: string[];
}

export function classifyObjection(message: string): ObjectionAnalysis {
  const lowerMessage = message.toLowerCase();
  const analysis: ObjectionAnalysis = {
    primaryType: 'philosophical',
    intensity: 'moderate',
    userStance: 'seeker',
    keyThemes: [],
    responseStrategy: 'educational',
    recommendedApproach: []
  };

  // Primary Type Classification
  if (lowerMessage.includes('evil') || lowerMessage.includes('suffering') || 
      lowerMessage.includes('pain') || lowerMessage.includes('why bad things')) {
    analysis.primaryType = 'logical';
    analysis.keyThemes.push('problem of evil', 'theodicy');
  } else if (lowerMessage.includes('moral') || lowerMessage.includes('right') || 
             lowerMessage.includes('wrong') || lowerMessage.includes('good') || 
             lowerMessage.includes('justice') || lowerMessage.includes('fair')) {
    analysis.primaryType = 'moral';
    analysis.keyThemes.push('moral reasoning', 'ethics');
  } else if (lowerMessage.includes('evolution') || lowerMessage.includes('science') || 
             lowerMessage.includes('creation') || lowerMessage.includes('genesis') || 
             lowerMessage.includes('big bang') || lowerMessage.includes('fossil')) {
    analysis.primaryType = 'scientific';
    analysis.keyThemes.push('science and faith', 'creation');
  } else if (lowerMessage.includes('jesus') || lowerMessage.includes('resurrection') || 
             lowerMessage.includes('bible') || lowerMessage.includes('historical') || 
             lowerMessage.includes('evidence') || lowerMessage.includes('proof')) {
    analysis.primaryType = 'historical';
    analysis.keyThemes.push('historical evidence', 'biblical reliability');
  } else if (lowerMessage.includes('feel') || lowerMessage.includes('hurt') || 
             lowerMessage.includes('prayer') || lowerMessage.includes('struggling') || 
             lowerMessage.includes('abandoned') || lowerMessage.includes('alone')) {
    analysis.primaryType = 'emotional';
    analysis.keyThemes.push('personal struggle', 'emotional support');
  } else if (lowerMessage.includes('culture') || lowerMessage.includes('modern') || 
             lowerMessage.includes('society') || lowerMessage.includes('today') || 
             lowerMessage.includes('current') || lowerMessage.includes('contemporary')) {
    analysis.primaryType = 'cultural';
    analysis.keyThemes.push('cultural engagement', 'modern relevance');
  } else if (lowerMessage.includes('i') || lowerMessage.includes('me') || 
             lowerMessage.includes('my') || lowerMessage.includes('personal') || 
             lowerMessage.includes('struggling') || lowerMessage.includes('help')) {
    analysis.primaryType = 'personal';
    analysis.keyThemes.push('personal experience', 'individual guidance');
  }

  // Intensity Analysis
  if (lowerMessage.includes('prove') || lowerMessage.includes('wrong') || 
      lowerMessage.includes('false') || lowerMessage.includes('ridiculous') || 
      lowerMessage.includes('stupid') || lowerMessage.includes('nonsense')) {
    analysis.intensity = 'strong';
  } else if (lowerMessage.includes('doubt') || lowerMessage.includes('question') || 
             lowerMessage.includes('confused') || lowerMessage.includes('unsure')) {
    analysis.intensity = 'moderate';
  } else {
    analysis.intensity = 'mild';
  }

  // User Stance Analysis
  if (lowerMessage.includes('atheist') || lowerMessage.includes('don\'t believe') || 
      lowerMessage.includes('no god') || lowerMessage.includes('ridiculous')) {
    analysis.userStance = 'challenger';
  } else if (lowerMessage.includes('doubt') || lowerMessage.includes('skeptical') || 
             lowerMessage.includes('not sure') || lowerMessage.includes('questioning')) {
    analysis.userStance = 'skeptic';
  } else if (lowerMessage.includes('struggling') || lowerMessage.includes('hurt') || 
             lowerMessage.includes('abandoned') || lowerMessage.includes('alone')) {
    analysis.userStance = 'struggler';
  } else if (lowerMessage.includes('believe') || lowerMessage.includes('faith') || 
             lowerMessage.includes('christian') || lowerMessage.includes('church')) {
    analysis.userStance = 'believer';
  } else {
    analysis.userStance = 'seeker';
  }

  // Response Strategy Selection
  if (analysis.userStance === 'challenger' && analysis.intensity === 'strong') {
    analysis.responseStrategy = 'defensive';
    analysis.recommendedApproach = [
      'Acknowledge the challenge respectfully',
      'Provide logical counter-arguments',
      'Present evidence-based responses',
      'Maintain calm, professional tone'
    ];
  } else if (analysis.userStance === 'skeptic') {
    analysis.responseStrategy = 'evidential';
    analysis.recommendedApproach = [
      'Present historical and scientific evidence',
      'Address specific doubts with facts',
      'Provide logical reasoning',
      'Encourage further investigation'
    ];
  } else if (analysis.userStance === 'struggler') {
    analysis.responseStrategy = 'pastoral';
    analysis.recommendedApproach = [
      'Show deep empathy and understanding',
      'Provide biblical comfort and hope',
      'Suggest practical spiritual steps',
      'Encourage community connection'
    ];
  } else if (analysis.userStance === 'believer') {
    analysis.responseStrategy = 'educational';
    analysis.recommendedApproach = [
      'Deepen theological understanding',
      'Provide biblical context and teaching',
      'Connect to Christian tradition',
      'Encourage spiritual growth'
    ];
  } else {
    analysis.responseStrategy = 'educational';
    analysis.recommendedApproach = [
      'Provide clear, accessible explanations',
      'Share the gospel message appropriately',
      'Address questions with patience',
      'Encourage continued exploration'
    ];
  }

  return analysis;
}

export function generateSpecializedResponse(analysis: ObjectionAnalysis, question: string): string {
  const baseResponse = `Thank you for your question about ${analysis.keyThemes.join(', ')}. This is an important topic that deserves thoughtful consideration.`;

  switch (analysis.responseStrategy) {
    case 'defensive':
      return `${baseResponse}

I understand you have strong concerns about this issue. Let me address your question with respect and intellectual honesty.

[Provide logical counter-arguments and evidence]

While I may not have all the answers, I believe there are compelling reasons to consider the Christian perspective on this matter.

What specific aspects of this issue would you like to explore further?`;

    case 'evidential':
      return `${baseResponse}

Your skepticism is understandable, and I appreciate your desire for evidence. Let me share some historical and logical considerations.

[Present relevant evidence and reasoning]

I encourage you to investigate these claims further and consider the evidence for yourself.

What additional evidence or reasoning would be most helpful to you?`;

    case 'pastoral':
      return `${baseResponse}

I hear the pain and struggle in your question, and I want you to know that your feelings are valid and important.

[Provide empathetic support and biblical comfort]

Remember that you're not alone in these struggles, and there is hope even in difficult times.

How can I best support you in this journey?`;

    case 'educational':
      return `${baseResponse}

This is a great question that touches on important aspects of Christian faith and understanding.

[Provide educational content and biblical teaching]

I hope this helps deepen your understanding of this topic.

What other aspects of this would you like to explore?`;

    default:
      return `${baseResponse}

Let me share some thoughts on this important question.

[Provide thoughtful response]

I'd be happy to continue this conversation and explore this topic further with you.`;
  }
}

// Specific objection handlers
export const objectionHandlers = {
  problemOfEvil: (intensity: string) => ({
    approach: intensity === 'strong' ? 'defensive' : 'educational',
    keyPoints: [
      'Free will defense',
      'Soul-making theodicy',
      'Biblical examples of suffering and redemption',
      "God's character and purposes"
    ],
    scriptures: ['Romans 8:28', 'James 1:2-4', '2 Corinthians 4:17-18'],
    philosophers: ['Alvin Plantinga', 'John Hick', 'C.S. Lewis']
  }),

  moralObjections: (intensity: string) => ({
    approach: intensity === 'strong' ? 'defensive' : 'educational',
    keyPoints: [
      'Objective moral values and duties',
      'Moral argument for God',
      'Biblical moral framework',
      'Christian ethics in practice'
    ],
    scriptures: ['Romans 2:14-15', 'Micah 6:8', 'Matthew 22:37-40'],
    philosophers: ['C.S. Lewis', 'William Lane Craig', 'Alvin Plantinga']
  }),

  scientificObjections: (intensity: string) => ({
    approach: 'evidential',
    keyPoints: [
      'Science and faith compatibility',
      'Biblical interpretation principles',
      'Historical and scientific evidence',
      'Creation and evolution perspectives'
    ],
    scriptures: ['Genesis 1-2', 'Psalm 19:1-4', 'Romans 1:20'],
    resources: ['Reasons to Believe', 'BioLogos', 'Answers in Genesis']
  }),

  historicalObjections: (intensity: string) => ({
    approach: 'evidential',
    keyPoints: [
      'Historical reliability of Scripture',
      'Archaeological evidence',
      'Eyewitness testimony',
      'Manuscript evidence'
    ],
    scriptures: ['Luke 1:1-4', '1 Corinthians 15:3-8', '2 Peter 1:16'],
    scholars: ['N.T. Wright', 'Gary Habermas', 'William Lane Craig']
  })
}; 