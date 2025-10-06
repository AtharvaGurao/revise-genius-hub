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

// Mock data - in production from backend GET /progress/summary
const mockProgressData = {
  accuracyOverall: 75,
  recentAttempts: [
    { date: "Jan 10", accuracy: 65 },
    { date: "Jan 12", accuracy: 72 },
    { date: "Jan 14", accuracy: 80 },
    { date: "Jan 15", accuracy: 75 },
  ],
  strengths: ["Kinematics", "Thermodynamics", "Wave Motion"],
  weaknesses: ["Rotational Dynamics", "Modern Physics", "Optics"],
  topicBreakdown: [
    { topic: "Mechanics", accuracy: 82 },
    { topic: "Thermodynamics", accuracy: 78 },
    { topic: "Electromagnetism", accuracy: 68 },
  ],
};

const ProgressMiniDashboard = () => {
  const { accuracyOverall, recentAttempts, strengths, weaknesses } = mockProgressData;

  return (
    <div className="space-y-4">
      {/* Overall Accuracy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Overall Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{accuracyOverall}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on your last 10 attempts
          </p>
        </CardContent>
      </Card>

      {/* Recent Progress Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={recentAttempts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Top Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {strengths.slice(0, 3).map((strength) => (
              <Badge key={strength} className="bg-success text-success-foreground">
                {strength}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weaknesses.slice(0, 3).map((weakness) => (
              <Badge
                key={weakness}
                variant="destructive"
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
