import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface QuizAttemptDetail {
  id: string;
  date: Date;
  topic: string;
  score: { raw: number; total: number; percent: number };
  accuracy: number;
  questionTypes: string[];
}

const ProgressMiniDashboard = () => {
  const [progressData, setProgressData] = useState({
    accuracyOverall: 0,
    recentAttempts: [] as { date: string; accuracy: number }[],
    strengths: [] as string[],
    weaknesses: [] as string[],
    totalAttempts: 0,
    averageScore: 0,
  });
  const [detailedAttempts, setDetailedAttempts] = useState<QuizAttemptDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();

    // Set up realtime subscription for quiz attempts
    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const channel = supabase
        .channel('quiz-progress-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'quiz_attempts_v2',
          },
          () => {
            // Refresh progress when new attempt is added
            fetchProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setLoading(false);
        return;
      }

      // Fetch all attempts directly from the table
      const { data: allAttemptsData, error: allAttemptsError } = await supabase
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
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (allAttemptsError) throw allAttemptsError;

      // If no attempts, show empty state
      if (!allAttemptsData || allAttemptsData.length === 0) {
        setProgressData({
          accuracyOverall: 0,
          recentAttempts: [],
          strengths: [],
          weaknesses: [],
          totalAttempts: 0,
          averageScore: 0,
        });
        setDetailedAttempts([]);
        setLoading(false);
        return;
      }

      // Calculate overall stats
      const totalAttempts = allAttemptsData.length;
      const totalCorrect = allAttemptsData.reduce((sum, a) => sum + a.correct_answers, 0);
      const totalQuestions = allAttemptsData.reduce((sum, a) => sum + a.total_questions, 0);
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const averageScore = allAttemptsData.reduce((sum, a) => sum + (a.score_percentage || 0), 0) / totalAttempts;

      // Get recent attempts for chart (last 5)
      const recentData = allAttemptsData.slice(0, 5);
      const recentAttempts = recentData.map((attempt: any) => ({
        date: new Date(attempt.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        accuracy: Math.round(attempt.score_percentage),
      })).reverse();

      // Fetch question types and topics for strengths/weaknesses
      const answersPromises = allAttemptsData.map(attempt => 
        supabase
          .from("quiz_answers")
          .select("question_type, topic, is_correct")
          .eq("attempt_id", attempt.id)
      );

      const answersResults = await Promise.all(answersPromises);
      
      // Calculate strengths and weaknesses by topic
      const topicStats: { [key: string]: { correct: number; total: number } } = {};
      
      answersResults.forEach(result => {
        if (result.data) {
          result.data.forEach((answer: any) => {
            const topic = answer.topic || "General";
            if (!topicStats[topic]) {
              topicStats[topic] = { correct: 0, total: 0 };
            }
            topicStats[topic].total++;
            if (answer.is_correct) {
              topicStats[topic].correct++;
            }
          });
        }
      });

      // Calculate accuracy by topic and sort
      const topicAccuracies = Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      })).sort((a, b) => b.accuracy - a.accuracy);

      const strengths = topicAccuracies.slice(0, 3).filter(t => t.accuracy >= 70).map(t => t.topic);
      const weaknesses = topicAccuracies.slice(-3).filter(t => t.accuracy < 70).map(t => t.topic);

      // Fetch question types for detailed attempts (first 10)
      const detailedAttemptsData = await Promise.all(
        allAttemptsData.slice(0, 10).map(async (attempt) => {
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

      setDetailedAttempts(detailedAttemptsData);

      setProgressData({
        accuracyOverall: overallAccuracy,
        recentAttempts,
        strengths,
        weaknesses,
        totalAttempts,
        averageScore: Math.round(averageScore),
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const { accuracyOverall, recentAttempts, strengths, weaknesses, totalAttempts, averageScore } = progressData;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "success";
    if (accuracy >= 60) return "default";
    return "destructive";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (totalAttempts === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No quiz attempts yet. Start practicing to see your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalAttempts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg. Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{averageScore}%</div>
          </CardContent>
        </Card>
      </div>
      {/* Overall Accuracy */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            Overall Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{accuracyOverall}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on your last 10 attempts
          </p>
        </CardContent>
      </Card>

      {/* Recent Progress Chart */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold">Recent Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={recentAttempts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            Top Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {strengths.slice(0, 3).map((strength) => (
              <Badge key={strength} className="bg-success text-success-foreground text-xs">
                {strength}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {weaknesses.slice(0, 3).map((weakness) => (
              <Badge
                key={weakness}
                variant="destructive"
                className="text-xs"
              >
                {weakness}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Quiz Attempts Table */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold">Recent Quiz Attempts</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Topic</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Score</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Accuracy</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden md:table-cell">Types</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedAttempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      No attempts recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  detailedAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="hidden sm:block">{format(attempt.date, "MMM dd, yyyy")}</div>
                        <div className="sm:hidden">{format(attempt.date, "MMM dd")}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{attempt.topic}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold">
                          {attempt.score.raw}/{attempt.score.total}
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressMiniDashboard;
