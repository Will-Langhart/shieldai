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
    related: ['does-god-exist', 'who-is-jesus', 'moral-argument', 'why-does-god-allow-natural-disasters'],
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
    related: ['does-god-exist', 'is-the-bible-reliable', 'evolution-and-genesis'],
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
    related: ['who-is-jesus', 'is-the-bible-reliable', 'how-is-a-person-saved', 'could-the-disciples-have-hallucinated'],
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
    related: ['resurrection-evidence', 'how-is-a-person-saved', 'does-god-exist', 'what-is-the-trinity'],
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
    related: ['resurrection-evidence', 'who-is-jesus', 'science-and-faith', 'who-chose-the-books-of-the-bible'],
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
    related: ['who-is-jesus', 'resurrection-evidence', 'moral-argument', 'is-jesus-the-only-way'],
  },
  {
    slug: 'what-is-the-trinity',
    category: 'god',
    question: 'What is the Trinity, and is it biblical?',
    shortAnswer:
      'The Trinity is the Christian teaching that there is one God who eternally exists as three persons: the Father, the Son and the Holy Spirit. It does not mean three gods, nor one God wearing three masks. The word itself is not in the Bible, but the truths it summarizes are. Scripture insists there is only one God, yet it calls the Father God, speaks of the Son as God made flesh, and treats the Spirit as a divine person who can be grieved. The early church, reading these texts carefully, confessed the Trinity in its creeds. It is a mystery beyond full comprehension, but it describes a God who is love within himself.',
    keyPoints: [
      'There is one God, not three, as Scripture repeatedly affirms.',
      'The Father, the Son and the Spirit are each called God and are distinct persons.',
      'The word "Trinity" is not in the Bible, but the teaching it names is.',
      'The early creeds summarized what the apostles taught rather than inventing it.',
      'A triune God means love and relationship are eternal, not created.',
    ],
    scriptures: ['Deuteronomy 6:4', 'Matthew 28:19', 'John 1:1-14', '2 Corinthians 13:14'],
    followUps: [
      'Isn’t the Trinity a contradiction?',
      'Why did the early church write creeds?',
      'Who is the Holy Spirit?',
    ],
    related: ['who-is-jesus', 'does-god-exist', 'is-jesus-the-only-way'],
  },
  {
    slug: 'did-jesus-really-exist',
    category: 'jesus',
    question: 'Did Jesus really exist as a historical person?',
    shortAnswer:
      'Yes. The existence of Jesus is accepted by nearly all historians who study the ancient world, whatever their personal beliefs. Besides the Gospels and Paul’s letters, which were written within decades of his life, Jesus is mentioned by the Jewish historian Josephus and the Roman historian Tacitus, who notes that he was executed under Pontius Pilate. For a Jewish teacher from a small province, that is strong attestation by ancient standards. Scholars still debate what Jesus said and did, and Christians make claims about him that go beyond history alone. But the idea that he never lived at all is a fringe view, not a serious historical position.',
    keyPoints: [
      'Nearly all historians, Christian or not, agree Jesus existed.',
      'Paul’s letters were written within about twenty to thirty years of Jesus’ death.',
      'Non-Christian writers such as Josephus and Tacitus mention him.',
      'The real debate is about who Jesus was, not whether he lived.',
    ],
    scriptures: ['Luke 1:1-4', '1 Corinthians 15:3-8', '2 Peter 1:16'],
    followUps: [
      'What do Roman sources say about Jesus?',
      'When were the Gospels written?',
      'Was Jesus just a good moral teacher?',
    ],
    related: ['who-is-jesus', 'is-the-bible-reliable', 'resurrection-evidence'],
  },
  {
    slug: 'could-the-disciples-have-hallucinated',
    category: 'resurrection',
    question: 'Could the disciples have hallucinated the risen Jesus?',
    shortAnswer:
      'Grief can lead people to sense a loved one’s presence, so the question deserves a careful answer. Yet the reports of the risen Jesus do not fit hallucinations well. Hallucinations are private experiences, but the early creed in 1 Corinthians names groups who saw Jesus together, including more than five hundred people at once. The appearances happened in different places and to different kinds of people, including skeptics like James and an opponent like Paul. Hallucinations also would not explain the empty tomb, which the authorities could have answered by producing a body. And first-century Jews had no category for one man rising before the end of history, so visions alone would hardly have produced this belief.',
    keyPoints: [
      'Hallucinations are private, but Jesus appeared to groups at once.',
      'Skeptics and opponents, such as James and Paul, were among the witnesses.',
      'A hallucination cannot explain the empty tomb.',
      'Jewish hope expected a resurrection of all at the end, not of one man before it.',
    ],
    scriptures: ['1 Corinthians 15:3-8', 'Luke 24:36-43', 'John 20:24-29', 'Acts 9:1-6'],
    followUps: [
      'What if the body was stolen?',
      'Why did James become a believer?',
      'Did the disciples really die for their faith?',
    ],
    related: ['resurrection-evidence', 'did-jesus-really-exist', 'who-is-jesus'],
  },
  {
    slug: 'who-chose-the-books-of-the-bible',
    category: 'bible',
    question: 'Who decided which books belong in the Bible?',
    shortAnswer:
      'No single council or emperor invented the Bible. The Old Testament books Jesus and the apostles used were already recognized as Scripture by the Jewish people. The New Testament grew as churches read the apostles’ writings in worship and copied them for one another. Most of its books, including the four Gospels and Paul’s letters, were widely accepted by the second century. Later church gatherings did not create the list; they recognized what congregations had long received, asking whether a book came from an apostle or his circle, agreed with apostolic teaching, and was used across the churches. Christians in different traditions also differ on some Old Testament books, which is worth knowing and discussing charitably.',
    keyPoints: [
      'The church recognized the books of Scripture rather than inventing them.',
      'The Gospels and Paul’s letters were widely accepted by the second century.',
      'Key tests were apostolic origin, faithful teaching and wide church use.',
      'Later gospels, like the Gospel of Thomas, were written much later and were not widely received.',
      'Catholic, Orthodox and Protestant Bibles differ on some Old Testament books.',
    ],
    scriptures: ['Luke 24:44', '2 Peter 3:15-16', '2 Timothy 3:16-17'],
    followUps: [
      'What are the Apocrypha?',
      'Why aren’t the Gnostic gospels in the Bible?',
      'Did the Council of Nicaea choose the books of the Bible?',
    ],
    related: ['is-the-bible-reliable', 'did-jesus-really-exist'],
  },
  {
    slug: 'why-does-god-allow-natural-disasters',
    category: 'suffering',
    question: 'Why does God allow earthquakes, floods and other natural disasters?',
    shortAnswer:
      'Natural disasters are painful precisely because no human choice seems to cause them. Christians offer several careful answers without claiming to see the whole picture. A world with stable natural laws lets us act, plan and live, yet the same processes that build mountains and water the earth can also cause great harm. Scripture also describes all creation as groaning and waiting for renewal, broken in ways tied to the human story. Jesus warned against assuming that victims of disaster are worse sinners than anyone else. Most of all, Christians are called to weep with those who weep, to help generously, and to hope in the new creation God has promised.',
    keyPoints: [
      'Reliable natural laws make life possible but can also cause harm.',
      'Scripture describes creation as groaning and awaiting renewal.',
      'Jesus rejected the idea that disaster victims are worse sinners.',
      'Christians respond with compassion and practical help, not easy answers.',
    ],
    scriptures: ['Romans 8:19-22', 'Luke 13:1-5', 'Revelation 21:1-5'],
    followUps: [
      'Are natural disasters a punishment from God?',
      'How can I help people after a disaster?',
      'What will the new creation be like?',
    ],
    related: ['problem-of-evil', 'does-god-exist', 'how-to-handle-doubt'],
  },
  {
    slug: 'evolution-and-genesis',
    category: 'science',
    question: 'How do Christians understand evolution and the creation account in Genesis?',
    shortAnswer:
      'Faithful Christians who believe the Bible is God’s word hold several views here. Young-earth creationists read Genesis as describing six ordinary days a few thousand years ago and question much of evolutionary theory. Old-earth creationists accept that the universe is billions of years old but see God creating in stages, often including a special creation of humans. Evolutionary creationists believe God used evolution to bring about life, while affirming that he made humans in his image. Each view tries to honor both Scripture and the evidence of creation. What all orthodox Christians share matters most: God created everything, humans bear his image, sin is real, and Jesus is the answer to it.',
    keyPoints: [
      'Young-earth creationism reads the days of Genesis as ordinary days.',
      'Old-earth creationism accepts an ancient universe with God creating in stages.',
      'Evolutionary creationism sees evolution as the means God used.',
      'All three affirm God as Creator and humans as made in his image.',
    ],
    scriptures: ['Genesis 1:1', 'Genesis 1:27', 'Psalm 104:24', 'Hebrews 11:3'],
    followUps: [
      'Was Adam a historical person?',
      'How long were the days in Genesis 1?',
      'Can a Christian be a scientist?',
    ],
    related: ['science-and-faith', 'does-god-exist', 'is-the-bible-reliable'],
  },
  {
    slug: 'is-jesus-the-only-way',
    category: 'religions',
    question: 'Is Jesus really the only way to God?',
    shortAnswer:
      'This can sound narrow, so it helps to begin with respect: people of other faiths often live with deep devotion and real goodness, and Christians should learn from them and treat them with honor. But the major religions make different claims about God, humanity and salvation, so they cannot all be true in the same way. Jesus himself said he is the way, the truth and the life. Christians believe this not because they are better than others, but because Jesus did what no one else could: he died for sin and rose again. The invitation is open to everyone, and the question of those who never hear is left to a just and merciful God.',
    keyPoints: [
      'People of other faiths deserve honesty, respect and genuine friendship.',
      'Religions make conflicting claims, so they cannot all be equally true.',
      'Jesus himself claimed to be the only way to the Father.',
      'Salvation through Jesus is a gift open to all, not a reward for the deserving.',
    ],
    scriptures: ['John 14:6', 'Acts 4:12', '1 Timothy 2:3-6', 'Acts 17:22-31'],
    followUps: [
      'What about people who never hear about Jesus?',
      'Don’t all religions teach basically the same thing?',
      'How should I talk about faith with a friend from another religion?',
    ],
    related: ['how-is-a-person-saved', 'who-is-jesus', 'what-is-the-trinity'],
  },
  {
    slug: 'how-to-handle-doubt',
    category: 'christian-living',
    question: 'Is it wrong for a Christian to have doubts?',
    shortAnswer:
      'Doubt is not the opposite of faith, and many faithful people in Scripture wrestled with it. The psalmists asked God hard questions, John the Baptist sent word asking whether Jesus was really the one, and a father told Jesus, I believe; help my unbelief. Jesus met these people with patience, not rejection. Doubt can be a sign that faith is being taken seriously. It helps to name the specific question, look for good answers, talk honestly with trusted believers, and keep praying and gathering with the church even when feelings lag. Faith rests not on the strength of our certainty but on the faithfulness of the God we trust.',
    keyPoints: [
      'Many faithful people in Scripture wrestled with doubt.',
      'Jesus responded to honest doubters with patience and evidence.',
      'Naming the specific question makes doubt easier to work through.',
      'Staying connected to prayer and the church helps in seasons of doubt.',
      'Faith depends on God’s faithfulness, not the strength of our feelings.',
    ],
    scriptures: ['Mark 9:24', 'Matthew 11:2-6', 'Jude 1:22', 'Psalm 13:1-6'],
    followUps: [
      'What if I feel like God is silent?',
      'How do I know my faith is real?',
      'Where can I find good answers to my questions?',
    ],
    related: ['does-god-exist', 'resurrection-evidence', 'problem-of-evil'],
  },
];
