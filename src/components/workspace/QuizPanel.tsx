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
import { supabase } from "@/integrations/supabase/client";

interface QuizPanelProps {
  selectedPdfId: string | null;
}

type QuestionType = "MCQ" | "SAQ" | "LAQ";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  topic?: string;
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

const QuizPanel = ({ selectedPdfId }: QuizPanelProps) => {
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

    if (!selectedPdfId) {
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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to generate quizzes.",
          variant: "destructive",
        });
        return;
      }

      // Call Pinecone-based quiz generation edge function
      const { data, error } = await supabase.functions.invoke('generate-quiz-with-pinecone', {
        body: {
          pdfIds: selectedPdfId ? [selectedPdfId] : undefined,
          scope: selectedPdfId ? 'selected' : 'all',
          types: selectedTypes,
          count: questionCount
        }
      });

      if (error) {
        console.error('Quiz generation error:', error);
        throw new Error(error.message || 'Failed to generate quiz');
      }

      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated');
      }

      console.log('Generated questions:', data.questions);
      console.log('Source:', data.source, 'Chunks used:', data.chunksUsed);
      setQuestions(data.questions);
      
      // Show different message based on source
      const sourceMessage = data.source === 'pinecone' 
        ? `${questionCount} questions generated from PDF content (${data.chunksUsed} chunks used).`
        : `${questionCount} questions generated. ${data.message || ''}`;
      
      toast({
        title: "Quiz generated!",
        description: sourceMessage,
      });
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate quiz. Please try again.",
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

    // Save to quiz_attempts_v2 and quiz_answers tables
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        // Insert attempt record
        const { data: attemptData, error: attemptError } = await supabase
          .from("quiz_attempts_v2")
          .insert({
            user_id: session.session.user.id,
            pdf_id: selectedPdfId || null,
            quiz_type: selectedTypes.join(","),
            total_questions: totalCount,
            correct_answers: correctCount,
          })
          .select()
          .single();

        if (attemptError) throw attemptError;

        // Insert individual answer records
        const answerRecords = mockResults.map((result, index) => {
          const question = questions[index];
          return {
            attempt_id: (attemptData as any).id,
            question_id: result.questionId,
            question_type: question.type,
            question_text: question.question,
            user_answer: String(result.userAnswer || ""),
            correct_answer: question.type === "MCQ" && question.answerKey !== undefined
              ? String(question.choices?.[question.answerKey] || "")
              : "",
            is_correct: result.correct,
            topic: question.topic || null,
          };
        });

        const { error: answersError } = await supabase
          .from("quiz_answers")
          .insert(answerRecords);

        if (answersError) throw answersError;

        toast({
          title: "Quiz submitted!",
          description: `You scored ${correctCount}/${totalCount} (${Math.round((correctCount / totalCount) * 100)}%)`,
        });
      }
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      toast({
        title: "Saved locally",
        description: "Quiz completed but couldn't sync to server.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {questions.length === 0 ? (
        // Quiz Configuration
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div>
              <h2 className="font-heading font-bold text-xl sm:text-2xl mb-2">Generate Quiz</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Configure your quiz parameters and generate questions from your PDFs.
              </p>
            </div>

            <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                <Label htmlFor="count" className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">
                  Number of Questions
                </Label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    -
                  </Button>
                  <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base">{questionCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(Math.min(20, questionCount + 1))}
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Scope Info */}
              {selectedPdfId && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Generating quiz for:</strong> Selected PDF
                  </p>
                </div>
              )}

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
            <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl sm:text-2xl">Your Quiz</h2>
                  {score && (
                    <Badge
                      className="mt-2 text-xs sm:text-sm"
                      variant={score.percent >= 70 ? "default" : "destructive"}
                    >
                      Score: {score.raw}/{score.total} ({score.percent}%)
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuestions([]);
                    setResults(null);
                    setScore(null);
                    setUserAnswers({});
                  }}
                  className="w-full sm:w-auto"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
              </div>

              {/* Questions */}
              {questions.map((q, index) => {
                const result = results?.find((r) => r.questionId === q.id);
                return (
                  <Card key={q.id} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
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
