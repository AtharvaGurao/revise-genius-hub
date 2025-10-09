import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizAttempt {
  id: string;
  date: Date;
  topic: string;
  score: { raw: number; total: number; percent: number };
  accuracy: number;
  questionTypes: string[];
}

const History = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: attemptsData, error } = await supabase
        .from("quiz_attempts_v2")
        .select(`
          id,
          created_at,
          quiz_type,
          total_questions,
          correct_answers,
          score_percentage,
          pdf_id,
          pdfs (
            title
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch question types for each attempt from quiz_answers
      const attemptsWithTypes = await Promise.all(
        (attemptsData || []).map(async (attempt) => {
          const { data: answers } = await supabase
            .from("quiz_answers")
            .select("question_type")
            .eq("attempt_id", attempt.id);

          const uniqueTypes = [...new Set(answers?.map(a => a.question_type) || [])];

          return {
            id: attempt.id,
            date: new Date(attempt.created_at),
            topic: (attempt.pdfs as any)?.title || "General Quiz",
            score: {
              raw: attempt.correct_answers,
              total: attempt.total_questions,
              percent: Math.round(attempt.score_percentage || 0),
            },
            accuracy: Math.round(attempt.score_percentage || 0),
            questionTypes: uniqueTypes,
          };
        })
      );

      setAttempts(attemptsWithTypes);
    } catch (error: any) {
      console.error("Error fetching attempts:", error);
      toast({
        title: "Error loading quiz history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "success";
    if (accuracy >= 60) return "accent";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">Quiz History</h1>
          <p className="text-muted-foreground">Review your past quiz attempts and track your progress.</p>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Topic</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Score</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Accuracy</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Types</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Loading your quiz history...</p>
                    </TableCell>
                  </TableRow>
                ) : attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No quiz attempts yet. Start your first quiz!
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        <div className="hidden sm:block">{format(attempt.date, "MMM dd, yyyy")}</div>
                        <div className="sm:hidden">{format(attempt.date, "MMM dd")}</div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm max-w-[150px] truncate">{attempt.topic}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className="font-semibold">
                          {attempt.score.raw}/{attempt.score.total}
                        </span>{" "}
                        <span className="text-muted-foreground hidden lg:inline">
                          ({attempt.score.percent}%)
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={getAccuracyColor(attempt.accuracy) as any}
                          className="text-xs"
                        >
                          {attempt.accuracy}%
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {attempt.questionTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {attempts.length === 0 && (
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover">
              <Link to="/revise-pro">Take Your First Quiz</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
