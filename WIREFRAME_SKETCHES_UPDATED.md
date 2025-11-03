# Text-Based Wireframe Sketches - Updated to Match Current UI

*These wireframes match the actual implementation, current UI design from images, and updated wireframe table.*

---

## 1. Home Tab

```
┌─────────────────────────────────────────────────────────────┐
│ [Shield AI Logo]  Home | Bible | Chat | Churches | Insights   │
└─────────────────────────────────────────────────────────────┘

                    Welcome to Shield AI
                 Your advanced AI Christian
              Apologetics agent that combines
            the power of AI with biblical wisdom

        [Advanced AI Christian Apologetics Agent ▼]

         Ask Shield AI about:
         ┌─────────────────────────────────────────┐
         │ How can I defend the existence of God   │
         │ scientifically?                         │
         └─────────────────────────────────────────┘
         • • • (carousel indicators)

         [Start Chatting ➤]  [Explore Bible 📖]
```

---

## 2. Chat Tab

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Sidebar]                    [Main Chat Area]              │
│  ┌─────────────────┐         ┌──────────────────────────┐ │
│  │ [+ New chat]    │         │ Shield AI [▼]    [User] │ │
│  │                 │         └──────────────────────────┘ │
│  │ [🔍 Search chats]│                                     │
│  │                 │                                     │
│  │ [📚 Library]     │                                     │
│  │                 │         What can I help with?       │
│  │ Conversations:  │                                     │
│  │ ┌─────────────┐ │         ┌──────────────────────────┐ │
│  │ │ hiiiiii      │ │         │ [+] [How can we know      │ │
│  │ │ Sep 30, 2025 │ │         │    God exists?     ]    │ │
│  │ └─────────────┘ │         │ [🎤] [Send ➤]            │ │
│  │ ┌─────────────┐ │         └──────────────────────────┘ │
│  │ │ what evidence│ │                                     │
│  │ │ supports the │ │                                     │
│  │ │ res...       │ │                                     │
│  │ │ Oct 10, 2025 │ │                                     │
│  │ └─────────────┘ │                                     │
│  │ ┌─────────────┐ │                                     │
│  │ │ Who is Jesus?│ │                                     │
│  │ │ Oct 10, 2025 │ │                                     │
│  │ └─────────────┘ │                                     │
│  │                 │                                     │
│  │ ┌─────────────┐ │                                     │
│  │ │ Shield AI    │ │                                     │
│  │ │ Plus         │ │                                     │
│  │ └─────────────┘ │                                     │
│  └─────────────────┘                                     │
│                                                           │
│  [Toggle Sidebar]                                         │
│                                                           │
└───────────────────────────────────────────────────────────┘

[When conversation selected]:
┌──────────────────────────────────────────────────────────────┐
│  [Sidebar]              [Conversation Detail Panel]         │
│                            ┌──────────────────────────────┐ │
│                            │ [Toggle] Shield AI [▼] [User]│ │
│                            └──────────────────────────────┘ │
│                            ┌──────────────────────────────┐ │
│                            │ 👤 User:                     │ │
│                            │ Why is Jesus God?            │ │
│                            └──────────────────────────────┘ │
│                            ┌──────────────────────────────┐ │
│                            │ 🤖 AI:                        │ │
│                            │ John 1:1, Colossians 2:9...  │ │
│                            │ The early church affirmed...  │ │
│                            │                               │ │
│                            │ [Copy] [Share] [Bookmark]     │ │
│                            └──────────────────────────────┘ │
│                            ┌──────────────────────────────┐ │
│                            │ [+] [Type a message...]      │ │
│                            │ [🎤] [Send ➤]                │ │
│                            └──────────────────────────────┘ │
│                            Mode: [Gentle] | Scholarly | Debate│
└────────────────────────────────────────────────────────────┘
```

---

## 3. Bible Tab

```
┌─────────────────────────────────────────────────────────────┐
│ [Shield AI Logo]  Home | Bible | Chat | Churches | Insights  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Bible Study                                                  │
│ Explore scripture with AI-powered insights and study tools   │
│                                                              │
│ [🔍 Search scripture...]  [King James (Authorised) ▼]        │
│                            [Q Search]                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────────────────────────────────┐
│ Navigation   │  │ Genesis 1:1-31         [Bookmark]         │
│              │  │                                          │
│ Use Ctrl/Cmd │  │ 1In the beginning God created the heaven │
│ + Arrow keys │  │    and the earth.                        │
│ to navigate  │  │                                          │
│              │  │ 3And God said, Let there be light: and   │
│ Book:        │  │    there was light.                      │
│ [Genesis ▼]  │  │                                          │
│              │  │ 6And God said, Let there be a firmament │
│ Chapter:    │  │    in the midst of the waters...         │
│ [< 1 >]      │  │                                          │
│              │  │ 14And God said, Let there be lights in   │
│ Verse:       │  │    the firmament of the heaven...        │
│ [< 1 >]      │  │                                          │
│              │  │ [Scroll for more verses...]              │
│              │  │                                          │
│ [Go to       │  │ ┌────────────────────────────────────┐   │
│  Passage]    │  │ │ AI Bible Insights                 │   │
│              │  │ │                                   │   │
│              │  │ │ [💡 Generate Insights]            │   │
│              │  │ │ [✓ Test with Mock Data]           │   │
│              │  │ └────────────────────────────────────┘   │
│              │  │                                          │
│              │  │ [Tabs: Bible Text | AI Insights |      │
│              │  │  Study Questions | Cross-References] │
└──────────────┘  └──────────────────────────────────────────┘
```

**When AI Insights tab active:**
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Insights Tab Active]                                    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ AI Bible Insights                                     │  │
│ │                                                         │  │
│ │ Explanation:                                           │  │
│ │ The creation account in Genesis 1 establishes...      │  │
│ │                                                         │  │
│ │ Key Themes:                                            │  │
│ │ • Sovereignty of God                                   │  │
│ │ • Power of God's Word                                   │  │
│ │                                                         │  │
│ │ Cross-References:                                     │  │
│ │ • John 1:1-3                                           │  │
│ │ • Colossians 1:16-17                                   │  │
│ │                                                         │  │
│ │ Study Questions:                                       │  │
│ │ 1. What does "in the beginning" tell us...             │  │
│ │                                                         │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Bible Search Results

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search insights by passage, theme, or content...]      │
│ [Filters] [Newest First ▼] [View Toggle]                   │
└─────────────────────────────────────────────────────────────┘

Search Results:
┌────────────────────────────────────────────────────────────┐
│ Result 1: John 3:16                                       │
│ "For God so loved the world that he gave his one and      │
│  only Son, that whoever believes in him shall not perish  │
│  but have eternal life."                                   │
│                                                            │
│ Version: NIV | Date: Oct 10, 2025                        │
│ [Read] [Save Note] [Compare Versions] [Cross-Refs]        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Result 2: Romans 5:8                                     │
│ "But God demonstrates his own love for us in this:        │
│  While we were still sinners, Christ died for us."        │
│                                                            │
│ Version: NIV | Date: Oct 10, 2025                        │
│ [Read] [Save Note] [Compare Versions] [Cross-Refs]        │
└────────────────────────────────────────────────────────────┘

[Filters Panel - when opened]:
┌────────────────────────────────────────────────────────────┐
│ Filters                                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Book: [All Books ▼]                                 │   │
│ │ Testament: [All ▼] | Old | New                      │   │
│ │ Exact Match: [☑]                                     │   │
│ │ Version: [All Versions ▼]                            │   │
│ │ Tags: [test] [love] [salvation] [+ Add Tag]          │   │
│ └────────────────────────────────────────────────────┘   │
│ [Clear Filters] [Apply Filters]                           │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Insights History Tab

```
┌─────────────────────────────────────────────────────────────┐
│ [Shield AI Logo]  Home | Bible | Chat | Churches | Insights│
└─────────────────────────────────────────────────────────────┘

Insights History
View, manage, and analyze your AI-generated Bible insights

┌────────────────────────────────────────────────────────────┐
│ 🛡️ Shield AI Apologetics Insights                         │
│                                                             │
│ Explore your saved insights • Search by content •         │
│ Filter by themes • Build understanding                     │
│                                              [🔄 Refresh]   │
│                                              [📊 Analytics]│
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search insights by passage, theme, or content...]      │
│ [Filters] [Newest First ▼] [View Toggle]                  │
└─────────────────────────────────────────────────────────────┘

Showing 3 of 3 insights  [0 favorites] [0 shared] [JSON] [CSV]

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Genesis 1:1-31  │  │ John 3:16        │  │ John 3:16        │
│                 │  │                 │  │                 │
│ 1In the         │  │ For God so      │  │ For God so      │
│ beginning God   │  │ loved the world │  │ loved the world │
│ created...      │  │ that he gave... │  │ that he gave... │
│                 │  │                 │  │                 │
│ de4e12af7f28f   │  │ NIV             │  │ NIV             │
│ Oct 10, 2025    │  │ Oct 10, 2025    │  │ Oct 10, 2025    │
│                 │  │                 │  │                 │
│ [Sovereignty of │  │ [test] [love]   │  │ [test] [love]   │
│  God] [Power of │  │ [salvation]     │  │ [salvation]     │
│  God's Word]    │  │                 │  │                 │
│                 │  │                 │  │                 │
│ [▼ Expand]      │  │ [▼ Expand]      │  │ [▼ Expand]      │
└─────────────────┘  └─────────────────┘  └─────────────────┘

[When Filters opened]:
┌────────────────────────────────────────────────────────────┐
│ Filters                                                    │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Bible Version: [All Versions ▼]                     │   │
│ │ Tags: [Sovereignty of God] [Power of God's Word]   │   │
│ │       [+ Add Tag]                                   │   │
│ │ Themes: [Select themes ▼]                          │   │
│ │ Favorites Only: [☐]  Shared Only: [☐]              │   │
│ │ Date Range: [From: __/__/____] [To: __/__/____]    │   │
│ │ Passage: [e.g., Genesis 1:1]                       │   │
│ └────────────────────────────────────────────────────┘   │
│ [Clear All] [Apply Filters]                               │
└────────────────────────────────────────────────────────────┘

[When Analytics button clicked]:
┌────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                        │
│                                                             │
│ [Last 7 days ▼]                            [Export]         │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Total    │ │ Favorites │ │ Shared   │ │ Avg      │       │
│ │ Insights │ │           │ │          │ │ Rating   │       │
│ │    15    │ │    3     │ │    2     │ │   4.5    │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│ Insights Over Time: [Chart visualization]                  │
│                                                             │
│ Top Themes:                                                │
│ • Sovereignty of God (5 insights)                          │
│ • Power of God's Word (4 insights)                         │
│ • Love (3 insights)                                        │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Notes (Integrated in Bible Interface)

```
┌──────────────────────────────────────────────────────────────┐
│ [Bible Text | AI Insights | Study Questions | Cross-Refs]    │
│                                                               │
│ [Notes Tab - when selected]                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ My Notes                                  [+ New Note]    │ │
│ │                                                           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Title: Faith Over Fear                               │ │ │
│ │ │ Linked Verse: Isaiah 41:10                            │ │ │
│ │ │ Last Edited: Today 9:00 AM                            │ │ │
│ │ │ Tags: [faith] [courage] [fear]                       │ │ │
│ │ │ [Open] [Edit] [Delete]                               │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Title: Grace Study                                   │ │ │
│ │ │ Linked Verse: Ephesians 2:8                            │ │ │
│ │ │ Last Edited: Yesterday                               │ │ │
│ │ │ Tags: [grace] [salvation] [faith]                    │ │ │
│ │ │ [Open] [Edit] [Delete]                               │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ [Filter: All | Favorites | By Verse | By Tag]           │ │
│ │ [Sort: Date ▼]                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

[When Note Editor opened]:
┌──────────────────────────────────────────────────────────────┐
│ Note Editor                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Linked Verse: John 14:6                                 │ │
│ │ "I am the way and the truth and the life..."            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ Title: [_____________________________]                        │
│                                                               │
│ Category: [Personal Study ▼]                                 │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Rich text input field - multi-line]                     │ │
│ │                                                           │ │
│ │ Type your note here...                                    │ │
│ │                                                           │ │
│ │ [B] [I] [U] [•] [1] [Link] [Image]                     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ Tags: [faith] [salvation] [+ Add Tag]                       │
│                                                               │
│ Color: [🔵] [🟢] [🟡] [🟠] [🔴] [🟣]                        │
│                                                               │
│ Visibility: [Private] [Shared] [Public]                     │
│                                                               │
│ [Save Note] [Cancel]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Churches Tab

```
┌─────────────────────────────────────────────────────────────┐
│ [Shield AI Logo]  Home | Bible | Chat | Churches | Insights │
└─────────────────────────────────────────────────────────────┘

Church Finder

┌────────────────────────────────────────────────────────────┐
│ 📍 Use My Location  [Enable]                                 │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🔍 City, State or Zip                                  │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ Filters:                                                    │
│ Denomination: [All ▼]                                       │
│ Radius: [10 miles ▼]                                        │
│ Services: [All Days ▼]                                      │
│                                                             │
│ [Search]                                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Map View                                         [List View]│
│                                                             │
│ [Map with church location pins]                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Grace Bible Church                                   │   │
│ │ 2.1 miles | Baptist                                  │   │
│ │ Sunday 10AM                                         │   │
│ │ [Call] [Website] [Directions] [Save]                │   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘

[List View - when toggled]:
┌────────────────────────────────────────────────────────────┐
│ List View                                                    │
│                                                              │
│ 1. Grace Bible Church                                        │
│    2.1 miles | Baptist                                       │
│    Sunday 10AM | Call | Website                             │
│    [Save] [Directions]                                       │
│                                                              │
│ 2. Hope Community                                            │
│    3.5 miles | Non-Denom                                     │
│    Sunday 9AM & 11AM | Call | Website                       │
│    [Save] [Directions]                                      │
│                                                              │
│ 3. First Baptist Church                                      │
│    4.2 miles | Baptist                                       │
│    Sunday 10:30AM | Call | Website                           │
│    [Save] [Directions]                                       │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Settings Tab (Mobile Only)

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                       │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Account                                                  │  │
│ │   • Profile                                              │  │
│ │   • Change Password                                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Preferences                                               │  │
│ │   • Language: English ▼                                   │  │
│ │   • Default Bible Version: KJV ▼                         │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Notifications                                             │  │
│ │   Daily Verse:        [On/Off Toggle]  [Time: 8:00 AM]   │  │
│ │   Motivation:         [On/Off Toggle]                     │  │
│ │   Chat Reminders:     [On/Off Toggle]                     │  │
│ │   Church Reminder:    [On/Off Toggle]                     │  │
│ │   Usage Alerts:       [On/Off Toggle]                     │  │
│ │   DND:                [On/Off Toggle]  [Set Hours]       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Subscription                                    [Upgrade] │  │
│ │   Plan: Explorer (Free Trial)                            │  │
│ │   Usage: 3/5 conversations today                          │  │
│ │   Usage: 12/20 notes this month                           │  │
│ │   [View Plans] [Manage Subscription]                     │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Data                                                      │  │
│ │   • Export Data                                           │  │
│ │   • Delete Account                                        │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ [Sign Out]                                                     │
└───────────────────────────────────────────────────────────────┘
```

---

## 9. Subscription Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Subscription Plans                                            │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Explorer (Free Trial)                                    │ │
│ │                                                           │ │
│ │ ✓ 5 AI conversations per day (gentle mode only)         │ │
│ │ ✓ Basic Bible search (20 searches/day)                  │ │
│ │ ✓ 5 verse notes per week                                 │ │
│ │ ✓ Standard apologetics responses                         │ │
│ │                                                           │ │
│ │ Current Plan                              [Upgrade ➤]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Bible Student - $9.99/month                             │ │
│ │                                                           │ │
│ │ ✓ Unlimited AI conversations                            │ │
│ │ ✓ Gentle + Scholarly modes                              │ │
│ │ ✓ Advanced Bible search with cross-references            │ │
│ │ ✓ Unlimited verse notes with templates                  │ │
│ │ ✓ Church finder with ratings (50/month)                  │ │
│ │ ✓ Export study materials                                │ │
│ │ ✓ Email support                                         │ │
│ │                                                           │ │
│ │ [Subscribe Now]                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Bible Scholar - $19.99/month                            │ │
│ │                                                           │ │
│ │ ✓ Everything in Student +                                │ │
│ │ ✓ All modes unlimited (gentle, scholarly, debate)         │ │
│ │ ✓ Advanced apologetics knowledge base                    │ │
│ │ ✓ Mood-based verse recommendations                       │ │
│ │ ✓ Collaboration features                                 │ │
│ │ ✓ Priority support                                       │ │
│ │ ✓ Advanced analytics                                     │ │
│ │ ✓ API access (1,000 calls/month)                        │ │
│ │                                                           │ │
│ │ [Subscribe Now]                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Ministry - $49.99/month                                  │ │
│ │                                                           │ │
│ │ ✓ Everything in Scholar +                                │ │
│ │ ✓ Multi-user accounts (up to 25)                        │ │
│ │ ✓ Sermon preparation tools                              │ │
│ │ ✓ Bulk note management                                  │ │
│ │ ✓ White-label options                                   │ │
│ │ ✓ Advanced church finder                                 │ │
│ │ ✓ Dedicated support                                     │ │
│ │ ✓ API access (5,000 calls/month)                        │ │
│ │                                                           │ │
│ │ [Subscribe Now]                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Usage Dashboard:                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ This Month:                                               │ │
│ │ Conversations: ████████░░ 12/15                          │ │
│ │ Bible Searches: ████████░░ 18/20                          │ │
│ │ Notes Created: ██░░░░░░░░ 5/20                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Mood Verse (Scholar+ Feature)

```
┌─────────────────────────────────────────────────────────────┐
│ Mood Verse                                                    │
│                                                                │
│ Select your current mood:                                     │
│                                                                │
│  [😊 Happy]  [🙏 Grateful]  [😔 Sad]  [💪 Encouraged]        │
│  [😰 Anxious] [🤔 Contemplative] [❤️ Loved] [🎉 Celebrating] │
│                                                                │
│ [Get Verse]                                                   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ "Peace I leave with you; my peace I give to you.         │ │
│ │  I do not give to you as the world gives. Do not let     │ │
│ │  your hearts be troubled and do not be afraid."          │ │
│ │                                                           │ │
│ │ - John 14:27 (NIV)                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ [Save] [Share] [Read Context] [Get Another]                 │
└───────────────────────────────────────────────────────────────┘
```

---

## Design Notes

### Color Scheme (Dark Theme)
- Background: `#1A1D24` (main), `#2C303A` (panels)
- Text: `#E0E0E0` (primary), `#9CA3AF` (secondary)
- Accents: Blue `#3B82F6` / `#2563EB` (primary actions)
- Borders: `#3A404B`

### Typography
- Headers: Bold, large font sizes
- Body: Medium weight, readable
- Metadata: Smaller, gray text

### UI Patterns
- Cards with rounded corners and subtle borders
- Pill-shaped tags for categories/themes
- Toggle switches for on/off settings
- Dropdowns for selections
- Tabbed interfaces for related content
- Collapsible sidebars
- Modal overlays for editors/filters
- Gradient buttons for primary actions

### Navigation Structure
**Web**: Horizontal header navigation (Home, Bible, Chat, Churches, Insights)
**Mobile**: Bottom tab navigation (Chat, Bible, Notes, Church, Settings)

### Key Features
- **Chat**: Sidebar conversations, mode toggle (Gentle/Scholarly/Debate), streaming responses
- **Bible**: Left navigation panel, tabbed interface (Text/Insights/Questions/Cross-Refs)
- **Insights**: Card-based layout, search/filter/analytics, export options
- **Notes**: Integrated into Bible interface, rich text editor, tagging system
- **Subscription**: Tier-based feature gating with usage tracking

---

*Last updated: Based on current codebase analysis and UI images*

