/**
 * Apologetics eval dataset (Phase 4, Workstream A — v2, expanded + harder).
 *
 * ~56 curated objection questions spanning the 8 classifyObjection types ×
 * stances × difficulty. `isTheological` marks types that must honor the
 * Scripture floor. `secondary` marks multi-angle questions (an objection that
 * genuinely spans two types) — these are where a multi-agent answer *should*
 * out-reason a single pass, so they're deliberately over-represented.
 *
 * Grow this freely: more cases = more statistical power for the graph-vs-chat-rag
 * decision. Aim for hard, discriminating questions, not filler.
 */

export type Mode = 'gentle' | 'scholarly' | 'debate';
export type Stance = 'seeker' | 'skeptic' | 'challenger' | 'struggler' | 'believer';

export interface EvalCase {
  id: string;
  question: string;
  mode: Mode;
  expectedObjectionType: string;   // classifyObjection primaryType
  secondary?: string;              // second angle (multi-agent should shine here)
  stance: Stance;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isTheological: boolean;          // ⇒ Scripture floor applies
}

export const EVAL_CASES: EvalCase[] = [
  // ── logical ──
  { id: 'evil-gratuitous', question: 'If God is all-good and all-powerful, why does he allow gratuitous suffering that produces no discernible good?', mode: 'debate', expectedObjectionType: 'logical', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'omni-paradox', question: 'Can God create a stone so heavy he cannot lift it? Doesn\'t omnipotence collapse into contradiction?', mode: 'scholarly', expectedObjectionType: 'logical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'hidden-god', question: 'If God wants everyone to believe, why does he stay hidden instead of making himself unmistakably obvious?', mode: 'scholarly', expectedObjectionType: 'logical', stance: 'seeker', difficulty: 'intermediate', isTheological: true },
  { id: 'divine-foreknowledge', question: 'If God infallibly foreknows my choices, they\'re fixed in advance — so how is any choice genuinely mine?', mode: 'scholarly', expectedObjectionType: 'logical', secondary: 'philosophical', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'trinity-math', question: 'The Trinity says one God is three persons. Isn\'t that just incoherent arithmetic dressed up as mystery?', mode: 'debate', expectedObjectionType: 'logical', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'unfalsifiable', question: 'Every bad outcome gets explained as "God\'s plan." If nothing could ever count against God, isn\'t the claim empty?', mode: 'scholarly', expectedObjectionType: 'logical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'best-world', question: 'If God is perfectly good, why didn\'t he create a world with free creatures who always freely choose good?', mode: 'debate', expectedObjectionType: 'logical', secondary: 'philosophical', stance: 'challenger', difficulty: 'advanced', isTheological: true },

  // ── moral ──
  { id: 'ot-violence', question: 'How can a loving God command the killing of entire Canaanite peoples, including children?', mode: 'debate', expectedObjectionType: 'moral', secondary: 'historical', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'moral-without-god', question: 'Atheists live morally decent lives, so why do we need God to ground morality at all?', mode: 'scholarly', expectedObjectionType: 'moral', secondary: 'philosophical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'hell-justice', question: 'How is eternal conscious torment a just punishment for finite sins committed in one short life?', mode: 'debate', expectedObjectionType: 'moral', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'slavery-bible', question: 'The Bible regulates slavery instead of condemning it. Doesn\'t that expose its morality as merely ancient and human?', mode: 'debate', expectedObjectionType: 'moral', secondary: 'historical', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'divine-command', question: 'If something is good only because God commands it, couldn\'t he have commanded cruelty to be good?', mode: 'scholarly', expectedObjectionType: 'moral', secondary: 'philosophical', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'unevangelized', question: 'What about someone who never once heard of Jesus — is it just for God to condemn them?', mode: 'scholarly', expectedObjectionType: 'moral', stance: 'seeker', difficulty: 'intermediate', isTheological: true },
  { id: 'animal-suffering', question: 'Hundreds of millions of years of animal suffering happened before humans existed. What moral purpose could that serve?', mode: 'debate', expectedObjectionType: 'moral', secondary: 'scientific', stance: 'challenger', difficulty: 'advanced', isTheological: true },

  // ── scientific ──
  { id: 'genesis-cosmology', question: 'Does the Genesis creation account conflict with an old universe and biological evolution?', mode: 'scholarly', expectedObjectionType: 'scientific', stance: 'seeker', difficulty: 'intermediate', isTheological: true },
  { id: 'miracles-science', question: 'Miracles violate the laws of physics, so how can a scientifically literate person accept them?', mode: 'scholarly', expectedObjectionType: 'scientific', secondary: 'philosophical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'fine-tuning', question: 'Isn\'t the apparent fine-tuning of physical constants better explained by a multiverse than by God?', mode: 'debate', expectedObjectionType: 'scientific', stance: 'challenger', difficulty: 'advanced', isTheological: true },
  { id: 'god-of-gaps', question: 'Every gap religion once filled — lightning, disease, origins — science later closed. Isn\'t God just a shrinking gap?', mode: 'debate', expectedObjectionType: 'scientific', secondary: 'cultural', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'origin-of-life', question: 'Abiogenesis shows life can arise from chemistry. Doesn\'t that remove any need for a creator?', mode: 'scholarly', expectedObjectionType: 'scientific', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'neuroscience-soul', question: 'If the mind is just brain activity, as neuroscience suggests, what room is left for a soul?', mode: 'scholarly', expectedObjectionType: 'scientific', secondary: 'philosophical', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'flood-geology', question: 'A literal global flood is geologically impossible. Doesn\'t that falsify the Genesis account outright?', mode: 'debate', expectedObjectionType: 'scientific', secondary: 'historical', stance: 'challenger', difficulty: 'intermediate', isTheological: true },

  // ── historical ──
  { id: 'resurrection-evidence', question: 'What historical evidence actually supports the bodily resurrection of Jesus over legend or hallucination?', mode: 'scholarly', expectedObjectionType: 'historical', stance: 'seeker', difficulty: 'advanced', isTheological: true },
  { id: 'gospel-contradictions', question: 'The resurrection accounts differ across the Gospels. How can the Bible be reliable if the details don\'t line up?', mode: 'debate', expectedObjectionType: 'historical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'canon-formation', question: 'Who decided which books belong in the New Testament, and why trust a process finalized centuries later?', mode: 'scholarly', expectedObjectionType: 'historical', stance: 'seeker', difficulty: 'intermediate', isTheological: true },
  { id: 'jesus-mythicism', question: 'Some argue Jesus never existed and is a myth stitched from earlier dying-and-rising gods. How do you respond?', mode: 'debate', expectedObjectionType: 'historical', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'copying-errors', question: 'With thousands of manuscript variants, how can we claim to know what the New Testament originally said?', mode: 'scholarly', expectedObjectionType: 'historical', stance: 'skeptic', difficulty: 'advanced', isTheological: true },
  { id: 'pagan-parallels', question: 'Christmas and other Christian practices borrow from pagan festivals. Doesn\'t that show Christianity is derivative?', mode: 'scholarly', expectedObjectionType: 'historical', secondary: 'cultural', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'prophecy-vague', question: 'Aren\'t the "fulfilled prophecies" about Jesus just vague texts read backwards after the fact?', mode: 'debate', expectedObjectionType: 'historical', stance: 'challenger', difficulty: 'advanced', isTheological: true },

  // ── philosophical ──
  { id: 'meaning-without-god', question: 'Can life have real, objective meaning and purpose without God?', mode: 'scholarly', expectedObjectionType: 'philosophical', stance: 'seeker', difficulty: 'intermediate', isTheological: true },
  { id: 'faith-vs-reason', question: 'Isn\'t faith by definition believing without evidence — the very opposite of reason?', mode: 'debate', expectedObjectionType: 'philosophical', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'free-will-sovereignty', question: 'If God is sovereign over all events, in what meaningful sense are our choices actually free?', mode: 'scholarly', expectedObjectionType: 'philosophical', secondary: 'logical', stance: 'believer', difficulty: 'advanced', isTheological: true },
  { id: 'why-anything', question: 'Why is there something rather than nothing? And why think "God" answers that better than "just because"?', mode: 'scholarly', expectedObjectionType: 'philosophical', stance: 'seeker', difficulty: 'advanced', isTheological: true },
  { id: 'consciousness', question: 'Does the existence of conscious experience point to God, or is it just an unexplained brute fact of nature?', mode: 'scholarly', expectedObjectionType: 'philosophical', secondary: 'scientific', stance: 'seeker', difficulty: 'advanced', isTheological: true },
  { id: 'many-religions', question: 'Smart, sincere people hold contradictory religions. Isn\'t claiming to know the true one epistemically arrogant?', mode: 'debate', expectedObjectionType: 'philosophical', secondary: 'cultural', stance: 'skeptic', difficulty: 'intermediate', isTheological: true },
  { id: 'pascal-cynical', question: 'Isn\'t believing in God just a bet to avoid hell? A God who rewards that kind of hedging seems unworthy of worship.', mode: 'debate', expectedObjectionType: 'philosophical', stance: 'challenger', difficulty: 'advanced', isTheological: true },

  // ── emotional (pastoral; non-theological) ──
  { id: 'lost-child', question: 'I lost my child and I can\'t feel God at all anymore. Is he even there?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'basic', isTheological: false },
  { id: 'prayer-unanswered', question: 'I\'ve prayed for years for one thing and nothing changes. Why does God stay silent?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'basic', isTheological: false },
  { id: 'unworthy', question: 'I\'ve done things I\'m deeply ashamed of. I don\'t believe God could ever actually forgive me.', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'basic', isTheological: false },
  { id: 'burned-by-church', question: 'People at my old church hurt me badly in God\'s name. I want nothing to do with any of it now.', mode: 'gentle', expectedObjectionType: 'emotional', secondary: 'personal', stance: 'struggler', difficulty: 'intermediate', isTheological: false },
  { id: 'anxious-faith', question: 'My faith gives me more anxiety than peace — constant fear I\'m not doing enough for God. Is that normal?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'intermediate', isTheological: false },
  { id: 'grief-anger', question: 'I\'m honestly angry at God after everything that\'s happened. Is it wrong to feel that way?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'basic', isTheological: false },
  { id: 'feeling-far', question: 'I used to feel close to God and now there\'s just nothing. Did I do something to lose it?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', difficulty: 'intermediate', isTheological: false },

  // ── cultural ──
  { id: 'christianity-outdated', question: 'Isn\'t Christianity an outdated moral system that modern society has rightly moved beyond?', mode: 'scholarly', expectedObjectionType: 'cultural', stance: 'skeptic', difficulty: 'intermediate', isTheological: false },
  { id: 'exclusivity', question: 'Isn\'t it arrogant and even harmful for Christians to claim theirs is the one true religion?', mode: 'debate', expectedObjectionType: 'cultural', secondary: 'philosophical', stance: 'challenger', difficulty: 'intermediate', isTheological: false },
  { id: 'science-replaced-religion', question: 'Now that we have science, hasn\'t religion simply become culturally unnecessary?', mode: 'scholarly', expectedObjectionType: 'cultural', secondary: 'scientific', stance: 'skeptic', difficulty: 'intermediate', isTheological: false },
  { id: 'sexuality-bigotry', question: 'Traditional Christian views on sexuality look like bigotry to most of my generation. Why should anyone accept them?', mode: 'debate', expectedObjectionType: 'cultural', secondary: 'moral', stance: 'challenger', difficulty: 'advanced', isTheological: false },
  { id: 'hypocrites', question: 'So many loud Christians are hypocrites and grifters. Why would I take the faith seriously?', mode: 'scholarly', expectedObjectionType: 'cultural', stance: 'skeptic', difficulty: 'basic', isTheological: false },
  { id: 'religion-violence', question: 'Religion has caused endless wars and oppression. Hasn\'t it done more harm than good?', mode: 'debate', expectedObjectionType: 'cultural', secondary: 'historical', stance: 'challenger', difficulty: 'intermediate', isTheological: false },
  { id: 'privatize-faith', question: 'Why can\'t Christians just keep their beliefs private instead of bringing them into public life?', mode: 'scholarly', expectedObjectionType: 'cultural', stance: 'skeptic', difficulty: 'basic', isTheological: false },

  // ── personal ──
  { id: 'how-to-start', question: 'I\'m curious about faith but have zero church background. Where would I even begin?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'seeker', difficulty: 'basic', isTheological: false },
  { id: 'doubt-as-christian', question: 'I\'m a Christian but keep having serious doubts. Does that mean my faith isn\'t real?', mode: 'gentle', expectedObjectionType: 'personal', secondary: 'emotional', stance: 'struggler', difficulty: 'intermediate', isTheological: false },
  { id: 'share-with-family', question: 'How do I talk about my faith with skeptical family without pushing them away?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'believer', difficulty: 'basic', isTheological: false },
  { id: 'which-church', question: 'There are so many denominations that disagree. As a new believer, how do I even choose where to go?', mode: 'gentle', expectedObjectionType: 'personal', secondary: 'cultural', stance: 'seeker', difficulty: 'intermediate', isTheological: false },
  { id: 'read-bible-how', question: 'I want to read the Bible but it feels huge and confusing. How should I actually start?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'seeker', difficulty: 'basic', isTheological: false },
  { id: 'backslid', question: 'I walked away from faith years ago and I\'m not sure I\'m even welcome back. Is it too late for me?', mode: 'gentle', expectedObjectionType: 'personal', secondary: 'emotional', stance: 'struggler', difficulty: 'intermediate', isTheological: false },
  { id: 'stay-motivated', question: 'How do I keep a real spiritual life going when I\'m busy and honestly kind of tired of trying?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'believer', difficulty: 'basic', isTheological: false },
];
