/**
 * Content for the Help Center page at /help (behind the `help-center` flag).
 * Pure data so the page and its tests share one source. The common questions
 * reuse the homepage FAQ rather than copying it.
 */
import { FAQ_ITEMS } from "../components/features/landing/faqData";

export type HelpSection = {
  id: string;
  title: string;
  items: { question: string; answer: string }[];
};

export function getHelpSections(): HelpSection[] {
  return [
    {
      id: "asking",
      title: "Asking a question in chat",
      items: [
        {
          question: "How do I start a chat?",
          answer:
            "Go to /chat and type your question in the message box at the bottom of the page. Press Enter or the send button and Shield AI will reply in the same conversation.",
        },
        {
          question: "How should I phrase my question?",
          answer:
            "Ask it the way you would ask a friend. Include the objection or passage you have in mind and any context that matters, such as who raised it or what you already believe. You can ask follow-up questions in the same conversation to go deeper.",
        },
        {
          question: "Where do the answers come from?",
          answer:
            "Answers are grounded in Scripture and cite the Bible passages they draw on, so you can open each reference and read it in context for yourself.",
        },
      ],
    },
    {
      id: "modes",
      title: "Chat modes",
      items: [
        {
          question: "What is gentle mode?",
          answer:
            "Gentle mode gives warm, plain-language answers. Use it for personal questions, doubts, or when you are new to a topic.",
        },
        {
          question: "What is scholarly mode?",
          answer:
            "Scholarly mode goes deeper, with historical background, original-language notes, and references to theologians and scholars. Use it for study and research.",
        },
        {
          question: "What is debate mode?",
          answer:
            "Debate mode helps you prepare for a conversation with a skeptic. It lays out the strongest form of an objection and a clear, charitable response to it.",
        },
      ],
    },
    {
      id: "bible",
      title: "Reading the Bible",
      items: [
        {
          question: "How do I open the Bible reader?",
          answer: "Go to /bible to open the reader.",
        },
        {
          question: "How do I choose a book and chapter?",
          answer:
            "Use the book and chapter pickers at the top of the reader. Pick a book, then a chapter, and the passage opens in place.",
        },
        {
          question: "What are cross-references?",
          answer:
            "Cross-references link a verse to related passages elsewhere in Scripture. Select a verse to see them and follow a theme across the Bible.",
        },
      ],
    },
    {
      id: "notes",
      title: "Saving notes",
      items: [
        {
          question: "Can I save notes while I read?",
          answer:
            "Yes. Select a verse in the Bible reader to add a note or save an insight about it.",
        },
        {
          question: "Where do I find my notes later?",
          answer:
            "Your saved notes and insights are collected in your journal at /journal, where you can read them again and pick up where you left off.",
        },
      ],
    },
    {
      id: "faq",
      title: "Common questions",
      items: FAQ_ITEMS,
    },
  ];
}
