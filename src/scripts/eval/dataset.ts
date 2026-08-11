/**
 * Apologetics eval dataset (Phase 4, Workstream A).
 *
 * A curated set of objection questions spanning the 8 classifyObjection types ×
 * stances. `isTheological` marks the types that must honor the Scripture floor
 * (≥1 real verse cited). `expectedObjectionType` lets us later check router
 * accuracy. Uploaded to a LangSmith dataset by `run-eval.ts`; extend freely.
 */

export type Mode = 'gentle' | 'scholarly' | 'debate';

export interface EvalCase {
  id: string;
  question: string;
  mode: Mode;
  expectedObjectionType: string; // one of classifyObjection's primaryType values
  stance: 'seeker' | 'skeptic' | 'challenger' | 'struggler' | 'believer';
  isTheological: boolean;        // ⇒ Scripture floor applies
}

export const EVAL_CASES: EvalCase[] = [
  // ── logical ──
  { id: 'evil-gratuitous', question: 'If God is all-good and all-powerful, why does he allow gratuitous suffering?', mode: 'debate', expectedObjectionType: 'logical', stance: 'challenger', isTheological: true },
  { id: 'omni-paradox', question: 'Can God create a stone so heavy he cannot lift it? Doesn\'t omnipotence collapse into contradiction?', mode: 'scholarly', expectedObjectionType: 'logical', stance: 'skeptic', isTheological: true },
  { id: 'hidden-god', question: 'If God wants everyone to believe, why does he stay hidden instead of making himself obvious?', mode: 'scholarly', expectedObjectionType: 'logical', stance: 'seeker', isTheological: true },

  // ── moral ──
  { id: 'ot-violence', question: 'How can a loving God command the killing of entire peoples in the Old Testament?', mode: 'debate', expectedObjectionType: 'moral', stance: 'challenger', isTheological: true },
  { id: 'moral-without-god', question: 'Atheists can be good people, so why do we need God for morality?', mode: 'scholarly', expectedObjectionType: 'moral', stance: 'skeptic', isTheological: true },
  { id: 'hell-justice', question: 'How is eternal conscious torment in hell compatible with a loving and just God?', mode: 'debate', expectedObjectionType: 'moral', stance: 'challenger', isTheological: true },

  // ── scientific ──
  { id: 'genesis-cosmology', question: 'Does the Genesis creation account conflict with modern cosmology and evolution?', mode: 'scholarly', expectedObjectionType: 'scientific', stance: 'seeker', isTheological: true },
  { id: 'miracles-science', question: 'Miracles violate the laws of physics, so how can a scientifically literate person believe in them?', mode: 'scholarly', expectedObjectionType: 'scientific', stance: 'skeptic', isTheological: true },
  { id: 'fine-tuning', question: 'Isn\'t the fine-tuning of the universe better explained by a multiverse than by God?', mode: 'debate', expectedObjectionType: 'scientific', stance: 'challenger', isTheological: true },

  // ── historical ──
  { id: 'resurrection-evidence', question: 'What historical evidence supports the bodily resurrection of Jesus?', mode: 'scholarly', expectedObjectionType: 'historical', stance: 'seeker', isTheological: true },
  { id: 'gospel-contradictions', question: 'The Gospels contradict each other about the resurrection accounts. How is the Bible reliable?', mode: 'debate', expectedObjectionType: 'historical', stance: 'skeptic', isTheological: true },
  { id: 'canon-formation', question: 'Who decided which books belong in the Bible, and why should we trust that process?', mode: 'scholarly', expectedObjectionType: 'historical', stance: 'seeker', isTheological: true },

  // ── philosophical ──
  { id: 'meaning-without-god', question: 'Can life have real meaning and purpose without God?', mode: 'scholarly', expectedObjectionType: 'philosophical', stance: 'seeker', isTheological: true },
  { id: 'faith-vs-reason', question: 'Isn\'t faith just believing without evidence, the opposite of reason?', mode: 'debate', expectedObjectionType: 'philosophical', stance: 'skeptic', isTheological: true },
  { id: 'free-will-sovereignty', question: 'If God is sovereign over everything, in what sense are we actually free?', mode: 'scholarly', expectedObjectionType: 'philosophical', stance: 'believer', isTheological: true },

  // ── emotional (non-theological: pastoral) ──
  { id: 'lost-child', question: 'I lost my child and I can\'t feel God at all anymore. Is he even there?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', isTheological: false },
  { id: 'prayer-unanswered', question: 'I\'ve prayed for years and nothing changes. Why does God stay silent?', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', isTheological: false },
  { id: 'unworthy', question: 'I\'ve done things I\'m ashamed of. I don\'t think God could ever forgive me.', mode: 'gentle', expectedObjectionType: 'emotional', stance: 'struggler', isTheological: false },

  // ── cultural ──
  { id: 'christianity-outdated', question: 'Isn\'t Christianity an outdated system of rules that modern society has moved past?', mode: 'scholarly', expectedObjectionType: 'cultural', stance: 'skeptic', isTheological: false },
  { id: 'exclusivity', question: 'Isn\'t it arrogant for Christians to claim theirs is the only true religion?', mode: 'debate', expectedObjectionType: 'cultural', stance: 'challenger', isTheological: false },
  { id: 'science-replaced-religion', question: 'Now that we have science, hasn\'t religion become culturally unnecessary?', mode: 'scholarly', expectedObjectionType: 'cultural', stance: 'skeptic', isTheological: false },

  // ── personal ──
  { id: 'how-to-start', question: 'I\'m curious about faith but have no church background. Where would I even begin?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'seeker', isTheological: false },
  { id: 'doubt-as-christian', question: 'I\'m a Christian but I keep having serious doubts. Does that mean my faith isn\'t real?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'struggler', isTheological: false },
  { id: 'share-with-family', question: 'How do I talk about my faith with skeptical family without pushing them away?', mode: 'gentle', expectedObjectionType: 'personal', stance: 'believer', isTheological: false },
];
