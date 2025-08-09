// Comprehensive Apologetics Knowledge Base for Shield AI
// Categorized content for vector search and retrieval

export interface ApologeticsContent {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  tags: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  scriptures: string[];
  sources: string[];
}

export const apologeticsKnowledgeBase: ApologeticsContent[] = [
  // Problem of Evil
  {
    id: 'problem-of-evil-1',
    title: 'The Problem of Evil: A Christian Response',
    content: `The problem of evil is one of the most challenging objections to Christianity. How can a good, all-powerful God allow suffering and evil? This question deserves serious consideration.

The Christian response involves several key components:

1. **Free Will Defense**: God created humans with genuine free will, which means we can choose to do evil. A world with free will is better than a world without it, even if it allows for evil.

2. **Soul-Making Theodicy**: Suffering can develop character, compassion, and spiritual growth. Through trials, we can become more like Christ.

3. **Biblical Perspective**: Scripture acknowledges the reality of suffering while pointing to God's ultimate purposes and redemption.

4. **Mystery and Trust**: While we can provide rational responses, there remains an element of mystery that calls for faith and trust in God's character.

Key Scriptures: Romans 8:28, James 1:2-4, 2 Corinthians 4:17-18`,
    category: 'theological',
    subcategory: 'problem-of-evil',
    tags: ['evil', 'suffering', 'theodicy', 'free will', 'pain'],
    difficulty: 'intermediate',
    scriptures: ['Romans 8:28', 'James 1:2-4', '2 Corinthians 4:17-18'],
    sources: ['C.S. Lewis - The Problem of Pain', 'Alvin Plantinga - God, Freedom, and Evil', 'John Hick - Evil and the God of Love']
  },

  // Moral Objections
  {
    id: 'moral-argument-1',
    title: 'The Moral Argument for God',
    content: `The moral argument for God's existence is one of the most compelling apologetic arguments. It states that objective moral values and duties exist, and if they exist, then God exists.

The argument can be formulated as follows:

1. If God does not exist, then objective moral values and duties do not exist.
2. Objective moral values and duties do exist.
3. Therefore, God exists.

This argument is powerful because most people intuitively recognize that some things are objectively right or wrong. The question then becomes: what best explains the existence of objective moral values?

Only God provides a sufficient foundation for objective moral values. Without God, we're left with subjective preferences or social conventions, not objective moral truths.

Key Scriptures: Romans 2:14-15, Micah 6:8, Matthew 22:37-40`,
    category: 'philosophical',
    subcategory: 'moral-argument',
    tags: ['morality', 'ethics', 'moral argument', 'objective values', 'good and evil'],
    difficulty: 'intermediate',
    scriptures: ['Romans 2:14-15', 'Micah 6:8', 'Matthew 22:37-40'],
    sources: ['C.S. Lewis - Mere Christianity', 'William Lane Craig - Reasonable Faith', 'Alvin Plantinga - Warranted Christian Belief']
  },

  // Scientific Objections
  {
    id: 'science-faith-1',
    title: 'Science and Faith: Complementary, Not Contradictory',
    content: `Many people believe that science and faith are in conflict, but this is a misunderstanding. Science and faith address different questions and can coexist harmoniously.

Science answers "how" questions - how the universe works, how life functions, how natural processes operate. Faith addresses "why" questions - why we exist, what gives life meaning, what is our purpose.

The Bible is not a science textbook, and it shouldn't be read as one. Genesis 1-2 uses poetic language to communicate theological truths about God's creation, not scientific details.

Many great scientists throughout history have been Christians, including Isaac Newton, Johannes Kepler, and Francis Collins. Science and faith can enrich each other.

Key Scriptures: Genesis 1-2, Psalm 19:1-4, Romans 1:20`,
    category: 'scientific',
    subcategory: 'science-faith',
    tags: ['science', 'evolution', 'creation', 'genesis', 'big bang'],
    difficulty: 'basic',
    scriptures: ['Genesis 1-2', 'Psalm 19:1-4', 'Romans 1:20'],
    sources: ['Francis Collins - The Language of God', 'John Polkinghorne - Science and Religion', 'BioLogos Foundation']
  },

  // Historical Objections
  {
    id: 'resurrection-evidence-1',
    title: 'The Historical Evidence for Jesus\' Resurrection',
    content: `The resurrection of Jesus Christ is the central claim of Christianity. If it didn't happen, Christianity is false. If it did happen, it's the most important event in human history.

The historical evidence for the resurrection is compelling:

1. **Eyewitness Testimony**: Multiple independent sources report Jesus' resurrection appearances to various individuals and groups.

2. **Empty Tomb**: All four Gospels report the empty tomb, and even critics acknowledge this as historical fact.

3. **Transformation of Disciples**: The disciples went from fearful cowards to bold proclaimers willing to die for their faith.

4. **Early Christian Movement**: The rapid spread of Christianity in the first century requires a powerful explanation.

5. **Extra-Biblical Sources**: Non-Christian sources like Josephus and Tacitus confirm basic facts about Jesus.

The resurrection is the best explanation for all this evidence.`,
    category: 'historical',
    subcategory: 'resurrection',
    tags: ['resurrection', 'jesus', 'historical evidence', 'empty tomb', 'eyewitnesses'],
    difficulty: 'intermediate',
    scriptures: ['1 Corinthians 15:3-8', 'Luke 24:1-12', 'John 20:1-18'],
    sources: ['N.T. Wright - The Resurrection of the Son of God', 'Gary Habermas - The Case for the Resurrection', 'William Lane Craig - Reasonable Faith']
  },

  // Personal Struggles
  {
    id: 'spiritual-struggles-1',
    title: 'Finding Hope in Spiritual Struggles',
    content: `Spiritual struggles are a normal part of the Christian journey. Even great saints like David, Job, and Paul experienced periods of doubt, pain, and questioning.

It's important to remember that God understands our struggles. Jesus himself experienced suffering and can empathize with our pain (Hebrews 4:15).

Practical steps for spiritual struggles:

1. **Honest Prayer**: Pour out your heart to God, even your doubts and anger.
2. **Scripture Study**: Immerse yourself in God's Word for comfort and guidance.
3. **Christian Community**: Connect with other believers for support and encouragement.
4. **Professional Help**: Don't hesitate to seek counseling if needed.
5. **Patience**: Spiritual growth takes time, and struggles can be part of that growth.

Remember: God loves you unconditionally, and your struggles don't change that.`,
    category: 'personal',
    subcategory: 'spiritual-struggles',
    tags: ['struggles', 'doubt', 'pain', 'hope', 'prayer', 'community'],
    difficulty: 'basic',
    scriptures: ['Psalm 42:11', '2 Corinthians 12:9-10', 'Hebrews 4:15-16'],
    sources: ['C.S. Lewis - A Grief Observed', 'Timothy Keller - Walking with God Through Pain and Suffering']
  },

  // Cultural Engagement
  {
    id: 'cultural-engagement-1',
    title: 'Engaging Culture with Grace and Truth',
    content: `Christians are called to engage culture with both grace and truth (John 1:14). This means being winsome and loving while standing firm on biblical truth.

Key principles for cultural engagement:

1. **Listen First**: Understand the cultural context and concerns before responding.
2. **Show Respect**: Treat all people with dignity, regardless of their beliefs.
3. **Speak Truth in Love**: Be bold about biblical truth but always with love.
4. **Build Relationships**: Focus on people, not just winning arguments.
5. **Live Authentically**: Let your life demonstrate the truth of the gospel.

Cultural engagement isn't about winning arguments but about winning hearts. It's about showing how the gospel speaks to real human needs and longings.

Key Scriptures: John 1:14, 1 Peter 3:15, Colossians 4:5-6`,
    category: 'cultural',
    subcategory: 'engagement',
    tags: ['culture', 'engagement', 'grace', 'truth', 'witness', 'relationships'],
    difficulty: 'basic',
    scriptures: ['John 1:14', '1 Peter 3:15', 'Colossians 4:5-6'],
    sources: ['Timothy Keller - Center Church', 'Andy Crouch - Culture Making', 'James Davison Hunter - To Change the World']
  }
];

// Search and retrieval functions
export function searchApologeticsContent(query: string, category?: string): ApologeticsContent[] {
  const lowerQuery = query.toLowerCase();
  
  return apologeticsKnowledgeBase.filter(content => {
    // Filter by category if specified
    if (category && content.category !== category) {
      return false;
    }
    
    // Search in title, content, and tags
    return content.title.toLowerCase().includes(lowerQuery) ||
           content.content.toLowerCase().includes(lowerQuery) ||
           content.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
  });
}

export function getContentByCategory(category: string): ApologeticsContent[] {
  return apologeticsKnowledgeBase.filter(content => content.category === category);
}

export function getContentByDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): ApologeticsContent[] {
  return apologeticsKnowledgeBase.filter(content => content.difficulty === difficulty);
}

// Content enhancement for responses
export function enhanceResponseWithContent(response: string, objectionType: string): string {
  const relevantContent = searchApologeticsContent(objectionType);
  
  if (relevantContent.length > 0) {
    const content = relevantContent[0];
    return `${response}

**Additional Resources:**
${content.title}

${content.content.substring(0, 200)}...

**Key Scriptures:** ${content.scriptures.join(', ')}
**Further Reading:** ${content.sources.join(', ')}`;
  }
  
  return response;
} 