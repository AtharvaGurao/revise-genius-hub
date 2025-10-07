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

// In production, fetch from backend:
// useEffect(() => {
//   const fetchProgress = async () => {
//     const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/progress/summary`);
//     const data = await response.json();
//     setProgressData(data);
//   };
//   fetchProgress();
// }, []);

const mockProgressData = {
  accuracyOverall: 75,
  recentAttempts: [
    { date: "Jan 10", accuracy: 65 },
    { date: "Jan 12", accuracy: 72 },
    { date: "Jan 14", accuracy: 80 },
    { date: "Jan 15", accuracy: 75 },
    { date: "Jan 17", accuracy: 78 },
  ],
  strengths: ["Kinematics", "Thermodynamics", "Wave Motion"],
  weaknesses: ["Rotational Dynamics", "Modern Physics", "Optics"],
  topicBreakdown: [
    { topic: "Mechanics", accuracy: 82 },
    { topic: "Thermodynamics", accuracy: 78 },
    { topic: "Electromagnetism", accuracy: 68 },
  ],
  totalAttempts: 42,
  averageScore: 75,
};

const ProgressMiniDashboard = () => {
  const { accuracyOverall, recentAttempts, strengths, weaknesses, totalAttempts, averageScore } = mockProgressData;

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
    </div>
  );
};

export default ProgressMiniDashboard;
