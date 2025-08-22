import React, { useState, useEffect } from 'react';

interface AnimatedPlaceholderProps {
  theme?: 'light' | 'dark';
  className?: string;
}

const AnimatedPlaceholder: React.FC<AnimatedPlaceholderProps> = ({
  theme = 'light',
  className = ''
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const biblicalQuestions = [
    "Where was Jesus born?",
    "What is the meaning of grace?",
    "How do we know God exists?",
    "What does the Bible say about love?",
    "Why did Jesus have to die?",
    "What is the Trinity?",
    "How should Christians respond to suffering?",
    "What is the purpose of prayer?",
    "How do we interpret Scripture?",
    "What does it mean to be saved?",
    "How should we handle doubt?",
    "What is the role of the Holy Spirit?",
    "How do we share our faith?",
    "What does the Bible say about forgiveness?",
    "How should Christians view science?",
    "What is the meaning of worship?",
    "How do we discern God's will?",
    "What does the Bible say about marriage?",
    "How should we handle conflict?",
    "What is the purpose of the church?"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex((prevIndex) => 
        (prevIndex + 1) % biblicalQuestions.length
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [biblicalQuestions.length]);

  const currentQuestion = biblicalQuestions[currentQuestionIndex];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Ask a question... e.g.,
      </span>
      <span className="text-shield-blue font-medium transition-all duration-500 ease-in-out">
        {currentQuestion}
      </span>
    </div>
  );
};

export default AnimatedPlaceholder;
