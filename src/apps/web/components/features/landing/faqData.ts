// Single source of truth for the homepage FAQ. Used both to render the visible
// FAQ section (Home.tsx) and to emit FAQPage JSON-LD (index.tsx). Keeping them
// in one place guarantees the structured data matches the visible content,
// which Google requires for FAQ rich results.
export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is there historical evidence for the resurrection of Jesus?',
    answer:
      'Yes. Most historians across the spectrum grant a core of facts: Jesus was crucified, his tomb was found empty, and his followers sincerely believed they encountered him alive. Paul preserves an early creed (1 Corinthians 15:3–8) naming over five hundred eyewitnesses, most still living when he wrote — evidence that traces back to within a few years of the events.',
  },
  {
    question: 'How can a good God allow evil and suffering?',
    answer:
      'Christianity does not minimize suffering — it confronts it. Much evil follows from the freedom that makes genuine love possible, and Scripture affirms both that suffering is real and that it is not the final word. At the cross, God entered human suffering himself rather than standing at a distance (Romans 8:18).',
  },
  {
    question: 'Is the Bible historically reliable?',
    answer:
      'The New Testament is the best-attested text from the ancient world, with thousands of early manuscripts and quotations from writers within living memory of the events. Archaeology has repeatedly confirmed its places, rulers, and customs, and its Gospel accounts read as historical reporting rather than later legend (Luke 1:1–4).',
  },
  {
    question: 'How do I explain the Trinity to someone?',
    answer:
      'The Trinity means God is one Being in three co-equal, co-eternal Persons — Father, Son, and Holy Spirit — not three gods and not one Person in three modes. It is not a contradiction: God is one in what he is (essence) and three in who he is (persons). Analogies help but always fall short, so it is best grounded directly in Scripture.',
  },
  {
    question: 'What are the strongest arguments for the existence of God?',
    answer:
      'Several converging arguments carry real force: the cosmological argument (the universe began and needs a cause), the fine-tuning of physical constants for life, the existence of objective moral values, and the reality of human consciousness. None depend on the others, and together they make belief in God reasonable rather than blind.',
  },
  {
    question: 'How should I share my faith with a skeptic?',
    answer:
      'Lead with genuine questions and listening rather than winning a debate. Understand the actual objection, respond with clarity and charity, and be honest about what you do and do not know (1 Peter 3:15). Relationship and patience usually open more doors than argument alone.',
  },
]
