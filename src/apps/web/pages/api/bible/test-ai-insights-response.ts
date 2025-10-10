import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Simulate a proper AI insights response
    const mockInsights = {
      explanation: "Genesis 1:1-31 describes the six days of creation, where God brings the universe and all life into existence by His word. Each day, God speaks a different aspect of the world into being, starting with light and ending with the creation of humankind in His own image. The passage emphasizes the power of God's word, the orderliness of His creation, and the goodness of everything He made.",
      keyThemes: [
        "God's sovereignty in creation",
        "The power of God's word", 
        "The goodness of God's creation",
        "Humanity's unique role in creation",
        "The orderliness of God's creative work"
      ],
      crossReferences: [
        {
          reference: "John 1:1-3",
          text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
          relevance: "This passage links the creative power of God's word in Genesis with Jesus."
        },
        {
          reference: "Colossians 1:16",
          text: "For by him all things were created, in heaven and on earth, visible and invisible.",
          relevance: "This verse further cements the role of Christ in creation."
        }
      ],
      studyQuestions: [
        {
          question: "How does the creation account demonstrate God's power and authority?",
          type: "theological"
        },
        {
          question: "What does it mean to be made in God's image?",
          type: "reflection"
        },
        {
          question: "How can we apply the principle of orderliness in our own lives?",
          type: "application"
        }
      ],
      historicalContext: "The creation account in Genesis was likely written during the Babylonian exile, providing hope and reassurance to the Israelites about God's power and sovereignty over all creation.",
      theologicalMeaning: "This passage establishes the foundation of Christian belief about God as Creator and humanity's special relationship with Him. It emphasizes that creation is intentional, good, and purposeful.",
      practicalApplication: "This passage calls us to recognize God's authority in our lives, to care for His creation responsibly, and to live in a way that reflects His image and character.",
      prayerPoints: [
        "Thank God for His creative power and the beauty of His creation",
        "Ask for wisdom to be good stewards of the earth",
        "Pray for strength to live in a way that reflects God's image"
      ]
    }

    res.status(200).json({
      insights: mockInsights,
      metadata: {
        passage: "Genesis 1:24-26",
        version: "KJV",
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate test insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
