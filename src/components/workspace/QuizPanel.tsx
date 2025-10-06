import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, XCircle, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizPanelProps {
  scope: "all" | "selected";
  selectedPdfId: string | null;
}

type QuestionType = "MCQ" | "SAQ" | "LAQ";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: string[];
  answerKey?: number;
  explanation?: string;
}

interface QuizResult {
  questionId: string;
  correct: boolean;
  explanation: string;
  userAnswer?: string | number;
}

const QuizPanel = ({ scope, selectedPdfId }: QuizPanelProps) => {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["MCQ"]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<{ raw: number; total: number; percent: number } | null>(null);
  const { toast } = useToast();

  const handleTypeToggle = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerateQuiz = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "Select question types",
        description: "Please select at least one question type.",
        variant: "destructive",
      });
      return;
    }

    if (scope === "selected" && !selectedPdfId) {
      toast({
        title: "No PDF selected",
        description: "Please select a PDF from the library.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResults(null);
    setUserAnswers({});

    try {
      // In production, call backend:
      // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quiz/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     pdfIds: scope === 'selected' ? [selectedPdfId] : undefined,
      //     scope,
      //     types: selectedTypes,
      //     count: questionCount
      //   })
      // });
      // const data = await response.json();

      // Mock generation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockQuestions: Question[] = Array.from({ length: questionCount }, (_, i) => {
        const type = selectedTypes[i % selectedTypes.length];
        if (type === "MCQ") {
          return {
            id: `q-${i}`,
            type: "MCQ",
            question: `What is Newton's ${i + 1}st law of motion?`,
            choices: [
              "An object at rest stays at rest",
              "F = ma",
              "For every action, there is an equal and opposite reaction",
              "Energy cannot be created or destroyed",
            ],
            answerKey: 0,
            explanation: "This is the correct answer because of inertia principles.",
          };
        } else if (type === "SAQ") {
          return {
            id: `q-${i}`,
            type: "SAQ",
            question: `Define velocity and explain its relationship to acceleration.`,
            explanation: "Velocity is the rate of change of displacement. Acceleration is the rate of change of velocity.",
          };
        } else {
          return {
            id: `q-${i}`,
            type: "LAQ",
            question: `Derive the equations of motion for a uniformly accelerated body and discuss their applications.`,
            explanation: "The three equations of motion can be derived using calculus and graphical methods...",
          };
        }
      });

      setQuestions(mockQuestions);
      toast({
        title: "Quiz generated!",
        description: `${questionCount} questions are ready.`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast({
        title: "Incomplete answers",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    // In production:
    // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quiz/submit`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     quizId: 'current-quiz-id',
    //     answers: Object.entries(userAnswers).map(([qId, answer]) => ({
    //       questionId: qId,
    //       choiceIndex: typeof answer === 'number' ? answer : undefined,
    //       text: typeof answer === 'string' ? answer : undefined
    //     }))
    //   })
    // });
    // const data = await response.json();

    // Mock grading
    const mockResults: QuizResult[] = questions.map((q) => ({
      questionId: q.id,
      correct: Math.random() > 0.3,
      explanation: q.explanation || "This is the correct answer.",
      userAnswer: userAnswers[q.id],
    }));

    const correctCount = mockResults.filter((r) => r.correct).length;
    const totalCount = mockResults.length;

    setResults(mockResults);
    setScore({
      raw: correctCount,
      total: totalCount,
      percent: Math.round((correctCount / totalCount) * 100),
    });

    toast({
      title: "Quiz submitted!",
      description: `You scored ${correctCount}/${totalCount} (${Math.round((correctCount / totalCount) * 100)}%)`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {questions.length === 0 ? (
        // Quiz Configuration
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="font-heading font-bold text-2xl mb-2">Generate Quiz</h2>
              <p className="text-muted-foreground">
                Configure your quiz parameters and generate questions from your PDFs.
              </p>
            </div>

            <Card className="p-6 space-y-6">
              {/* Question Types */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Question Types
                </Label>
                <div className="space-y-2">
                  {(["MCQ", "SAQ", "LAQ"] as QuestionType[]).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => handleTypeToggle(type)}
                      />
                      <Label
                        htmlFor={`type-${type}`}
                        className="cursor-pointer font-normal"
                      >
                        {type === "MCQ" && "Multiple Choice Questions"}
                        {type === "SAQ" && "Short Answer Questions"}
                        {type === "LAQ" && "Long Answer Questions"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <Label htmlFor="count" className="text-base font-semibold mb-3 block">
                  Number of Questions
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold">{questionCount}</span>
                  <Button
                    variant="outline"
                    onClick={() => setQuestionCount(Math.min(20, questionCount + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Scope Info */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Scope:</strong> {scope === "all" ? "All PDFs" : "Selected PDF only"}
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateQuiz}
                className="w-full"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Questions"
                )}
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        // Quiz Attempt / Results
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-2xl">Your Quiz</h2>
                  {score && (
                    <Badge
                      className="mt-2"
                      variant={score.percent >= 70 ? "default" : "destructive"}
                    >
                      Score: {score.raw}/{score.total} ({score.percent}%)
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuestions([]);
                    setResults(null);
                    setScore(null);
                    setUserAnswers({});
                  }}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
              </div>

              {/* Questions */}
              {questions.map((q, index) => {
                const result = results?.find((r) => r.questionId === q.id);
                return (
                  <Card key={q.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{q.type}</Badge>
                          {result && (
                            result.correct ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )
                          )}
                        </div>
                        <p className="font-medium">
                          {index + 1}. {q.question}
                        </p>
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.type === "MCQ" && q.choices && (
                      <RadioGroup
                        value={userAnswers[q.id]?.toString()}
                        onValueChange={(v) =>
                          setUserAnswers({ ...userAnswers, [q.id]: parseInt(v, 10) })
                        }
                        disabled={!!results}
                      >
                        {q.choices.map((choice, i) => (
                          <div
                            key={i}
                            className={`flex items-center space-x-2 p-3 rounded-lg border ${
                              result &&
                              result.userAnswer === i &&
                              !result.correct
                                ? "border-destructive bg-destructive/5"
                                : result && q.answerKey === i
                                ? "border-success bg-success/5"
                                : ""
                            }`}
                          >
                            <RadioGroupItem value={i.toString()} id={`${q.id}-${i}`} />
                            <Label
                              htmlFor={`${q.id}-${i}`}
                              className="cursor-pointer flex-1"
                            >
                              {choice}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* SAQ/LAQ Text Area */}
                    {(q.type === "SAQ" || q.type === "LAQ") && (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={(userAnswers[q.id] as string) || ""}
                        onChange={(e) =>
                          setUserAnswers({ ...userAnswers, [q.id]: e.target.value })
                        }
                        disabled={!!results}
                        rows={q.type === "LAQ" ? 8 : 4}
                      />
                    )}

                    {/* Explanation (shown after submission) */}
                    {result && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="font-semibold mb-2">Explanation:</p>
                        <p className="text-sm">{result.explanation}</p>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Submit Button */}
              {!results && (
                <Button onClick={handleSubmitQuiz} size="lg" className="w-full">
                  Submit Quiz
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default QuizPanel;
