import type { Answer } from './types';

// The first four entries are rewritten from apologeticsKnowledgeBase in
// lib/apologetics-knowledge.ts (problem of evil, moral argument, science and
// faith, resurrection). That file isn't imported here, so the two can change
// independently.

export const ANSWERS: Answer[] = [
  {
    slug: 'problem-of-evil',
    category: 'suffering',
    question: 'If God is good and all-powerful, why is there so much suffering?',
    shortAnswer:
      'This is one of the oldest and most honest questions people ask, and Scripture never pretends it is easy. Christians have long answered that God made people with real freedom, and a world with real love requires the real possibility of choosing evil. Much suffering flows from that misuse of freedom. God can also use hardship to grow compassion, endurance and trust, though that never makes evil itself good. Above all, the Christian story does not watch suffering from a distance: in Jesus, God entered our pain, bore it on the cross, and promises a day when every wrong is put right. There is still mystery here, but it is mystery held by a God who has shown he can be trusted.',
    keyPoints: [
      'Genuine freedom makes real love possible, and also makes real evil possible.',
      'God can bring good out of suffering without calling the suffering itself good.',
      'In Jesus, God shares our suffering rather than standing apart from it.',
      'Scripture promises a final restoration where evil and pain are undone.',
      'Honest lament is part of faith; the Psalms and Job model it.',
    ],
    scriptures: ['Romans 8:28', 'James 1:2-4', '2 Corinthians 4:17-18', 'Revelation 21:4'],
    followUps: [
      'Why doesn’t God stop natural disasters?',
      'How do I keep trusting God while I am suffering?',
      'Does the Bible say all suffering is a punishment?',
    ],
    related: ['does-god-exist', 'who-is-jesus', 'moral-argument'],
  },
  {
    slug: 'moral-argument',
    category: 'morality',
    question: 'Can we be good without God?',
    shortAnswer:
      'Yes, people who do not believe in God can be kind, honest and brave, and Christians should gladly say so. Scripture itself teaches that God’s moral law is written on every human heart. The deeper question is not whether atheists can be good, but what makes anything truly good at all. Most of us are convinced that some things, like cruelty to a child, are wrong no matter what any person or culture says. If that is right, moral truth seems to point beyond human preference to a source that is itself good. Christians believe that source is God, whose character is the standard of goodness and who made us able to recognize it.',
    keyPoints: [
      'Non-believers can and often do live morally admirable lives.',
      'Scripture says God’s moral law is written on every human heart.',
      'Objective moral values need a foundation deeper than opinion or culture.',
      'God’s own good character is the best explanation for that foundation.',
    ],
    scriptures: ['Romans 2:14-15', 'Micah 6:8', 'Matthew 22:37-40'],
    followUps: [
      'Isn’t morality just the product of evolution?',
      'Why does God allow people to do evil?',
      'What does the Bible say goodness actually is?',
    ],
    related: ['does-god-exist', 'problem-of-evil', 'how-is-a-person-saved'],
  },
  {
    slug: 'science-and-faith',
    category: 'science',
    question: 'Do science and Christianity contradict each other?',
    shortAnswer:
      'Many people assume science and faith are at war, but the history and the ideas tell a different story. Science explores how the natural world works; faith speaks to why there is a world at all, and what our lives are for. These are different questions, and both matter. Many founders of modern science, such as Kepler and Newton, studied nature because they believed a rational God made an orderly world worth exploring. The Bible was written to reveal God and his purposes, not to serve as a science textbook, and Christians hold a range of views on how Genesis relates to modern findings. Careful study of God’s world and God’s word can enrich one another.',
    keyPoints: [
      'Science asks how the world works; faith asks why it exists and what it means.',
      'Belief in an orderly Creator helped motivate early modern science.',
      'Many respected scientists, past and present, are committed Christians.',
      'The Bible reveals God’s purposes and is not meant to be a science textbook.',
    ],
    scriptures: ['Genesis 1:1', 'Psalm 19:1-4', 'Romans 1:20'],
    followUps: [
      'Can a Christian accept evolution?',
      'How should I read the creation account in Genesis?',
      'Does the Big Bang point to a beginning?',
    ],
    related: ['does-god-exist', 'is-the-bible-reliable'],
  },
  {
    slug: 'resurrection-evidence',
    category: 'resurrection',
    question: 'Is there real evidence that Jesus rose from the dead?',
    shortAnswer:
      'The resurrection is the center of the Christian faith; the apostle Paul said that without it our faith is empty. Historians, including many who are not Christians, broadly agree on several facts: Jesus was crucified, his followers sincerely believed they saw him alive afterward, and the movement spread rapidly in the very city where he was executed. The earliest creed, recorded by Paul within a few years of the events, lists named eyewitnesses. The Gospels report the tomb was found empty, and the disciples changed from frightened men into bold witnesses willing to suffer. Christians argue that the resurrection is the explanation that best accounts for all of this together.',
    keyPoints: [
      'An early creed in 1 Corinthians 15 names eyewitnesses of the risen Jesus.',
      'All four Gospels report that the tomb was found empty.',
      'The disciples were transformed from fearful to bold, even facing death.',
      'The church grew quickly in Jerusalem, where the claim was easiest to disprove.',
      'Alternative theories struggle to explain all the facts at once.',
    ],
    scriptures: ['1 Corinthians 15:3-8', 'Luke 24:1-12', 'John 20:1-18'],
    followUps: [
      'Couldn’t the disciples have hallucinated?',
      'What if the body was stolen?',
      'Why does the resurrection matter for my life today?',
    ],
    related: ['who-is-jesus', 'is-the-bible-reliable', 'how-is-a-person-saved'],
  },
  {
    slug: 'does-god-exist',
    category: 'god',
    question: 'Are there good reasons to believe God exists?',
    shortAnswer:
      'Christians do not claim to prove God the way one proves a math theorem, but they do believe there are good reasons that point clearly in his direction. The universe had a beginning, which raises the question of what brought it into being. Its laws are finely balanced in ways that allow life, and it is intelligible to minds like ours. We share a deep sense that some things are truly right and wrong, and a longing for meaning that nothing in this world fully satisfies. Taken together, these clues fit naturally with a personal, wise and good Creator. Christians believe that Creator has made himself most fully known in Jesus.',
    keyPoints: [
      'The universe’s beginning invites the question of what caused it.',
      'The order and fine-tuning of nature fit well with a wise designer.',
      'Objective moral values point to a moral source beyond us.',
      'Christians see God revealed most clearly in the life of Jesus.',
    ],
    scriptures: ['Psalm 19:1', 'Romans 1:20', 'Acts 17:24-28', 'Hebrews 11:6'],
    followUps: [
      'Who created God?',
      'Why doesn’t God make his existence more obvious?',
      'Isn’t belief in God just wishful thinking?',
    ],
    related: ['moral-argument', 'science-and-faith', 'who-is-jesus'],
  },
  {
    slug: 'who-is-jesus',
    category: 'jesus',
    question: 'Who was Jesus, and did he really claim to be God?',
    shortAnswer:
      'Almost all historians agree that Jesus of Nazareth was a real Jewish teacher who lived in first-century Galilee and was crucified under Pontius Pilate. Christians believe he was far more than a wise teacher. He forgave sins, accepted worship, called himself the Son of Man who shares God’s authority, and spoke of being one with the Father. His opponents understood these claims as claims to divinity. The church has confessed from its earliest days that Jesus is fully God and fully human, the eternal Son who became flesh. Many people respect Jesus as a moral example, but his own words invite a bigger decision about who he truly is.',
    keyPoints: [
      'Jesus is a well-attested historical figure, not a legend.',
      'He forgave sins and accepted worship, acts reserved for God.',
      'His listeners understood his words as claims to be divine.',
      'Christians confess him as fully God and fully human.',
    ],
    scriptures: ['John 1:1-14', 'Mark 2:5-12', 'John 10:30', 'Colossians 1:15-20'],
    followUps: [
      'Was Jesus just a good moral teacher?',
      'What is the Trinity?',
      'What do other religions say about Jesus?',
    ],
    related: ['resurrection-evidence', 'how-is-a-person-saved', 'does-god-exist'],
  },
  {
    slug: 'is-the-bible-reliable',
    category: 'bible',
    question: 'Can we trust the Bible, or was it changed over time?',
    shortAnswer:
      'It is a fair question, since the Bible was written long ago and copied by hand for centuries. Yet the New Testament is preserved in far more ancient manuscripts than any other work of the ancient world, some dating within a few generations of the originals. Comparing them lets scholars recover the original text with remarkable confidence, and the differences that remain do not change any core Christian teaching. The Dead Sea Scrolls showed how carefully the Old Testament was copied. Archaeology has repeatedly confirmed people and places the Bible describes. Christians trust Scripture not only for these reasons, but because Jesus himself treated it as the word of God.',
    keyPoints: [
      'Thousands of ancient manuscripts allow the original text to be reconstructed.',
      'Remaining textual differences do not affect any central doctrine.',
      'The Dead Sea Scrolls show the Old Testament was copied with great care.',
      'Archaeology has confirmed many people and places the Bible names.',
      'Jesus treated the Scriptures as God’s trustworthy word.',
    ],
    scriptures: ['2 Timothy 3:16-17', '2 Peter 1:20-21', 'Luke 1:1-4'],
    followUps: [
      'Who decided which books are in the Bible?',
      'Doesn’t the Bible contradict itself?',
      'How should I read the Old Testament?',
    ],
    related: ['resurrection-evidence', 'who-is-jesus', 'science-and-faith'],
  },
  {
    slug: 'how-is-a-person-saved',
    category: 'salvation',
    question: 'How is a person saved according to the Bible?',
    shortAnswer:
      'The Bible teaches that every person has turned away from God and cannot repair that broken relationship by trying harder or being good enough. The good news is that God himself has acted. Jesus lived the life we could not live, died on the cross bearing the penalty for sin, and rose again to give new life. Salvation is a gift received by grace through faith: turning from sin and trusting Jesus as Savior and Lord. Good works do not earn salvation, but they naturally grow from it as the Holy Spirit changes a person from the inside. Christians across traditions agree that salvation is God’s gracious work, offered freely to all.',
    keyPoints: [
      'All people have sinned and cannot earn their way back to God.',
      'Jesus’ death and resurrection make forgiveness and new life possible.',
      'Salvation is received by grace through faith, not earned by works.',
      'A changed life is the fruit of salvation, not its price.',
    ],
    scriptures: ['Ephesians 2:8-10', 'Romans 3:23-24', 'Romans 10:9-10', 'John 3:16'],
    followUps: [
      'Can I lose my salvation?',
      'What about people who never hear about Jesus?',
      'What does it mean to repent?',
    ],
    related: ['who-is-jesus', 'resurrection-evidence', 'moral-argument'],
  },
];
