/**
 * DemoQuestions
 *
 * Affiche les 3 questions suggerees du mode demo.
 * Cliquer sur une question l'envoie directement.
 */

interface DemoQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function DemoQuestions({
  questions,
  onSelect,
  disabled = false,
}: DemoQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="demo-questions">
      <p className="demo-questions__label">
        Pose une question sur la Bible
      </p>
      <div className="demo-questions__list">
        {questions.map((q, index) => (
          <button
            key={index}
            className="demo-questions__item"
            onClick={() => onSelect(q)}
            disabled={disabled}
          >
            <span>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
