// Shapes for the public Answers library (/answers). Content lives in topics.ts.

export type AnswerCategory =
  | 'god'
  | 'jesus'
  | 'resurrection'
  | 'bible'
  | 'suffering'
  | 'science'
  | 'religions'
  | 'morality'
  | 'salvation'
  | 'christian-living';

/** Categories in the order the index page shows them. */
export const ANSWER_CATEGORIES: { id: AnswerCategory; label: string }[] = [
  { id: 'god', label: "God's existence" },
  { id: 'jesus', label: 'Jesus' },
  { id: 'resurrection', label: 'The resurrection' },
  { id: 'bible', label: "The Bible's reliability" },
  { id: 'suffering', label: 'Suffering and evil' },
  { id: 'science', label: 'Science and faith' },
  { id: 'religions', label: 'Other religions' },
  { id: 'morality', label: 'Morality' },
  { id: 'salvation', label: 'Salvation' },
  { id: 'christian-living', label: 'Christian living' },
];

export type Answer = {
  /** Kebab-case, used in the URL: /answers/<slug>. */
  slug: string;
  category: AnswerCategory;
  /** Phrased as a visitor would search it; ends with "?". */
  question: string;
  /** One paragraph, 60-140 words. */
  shortAnswer: string;
  keyPoints: string[];
  /** Plain references only, e.g. "Romans 8:28" or "James 1:2-4". */
  scriptures: string[];
  followUps: string[];
  /** Slugs of other answers in this module. */
  related: string[];
};
