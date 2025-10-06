import { useState } from "react";
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
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

// Mock data - will be replaced with API calls
const mockAttempts = [
  {
    id: "1",
    date: new Date("2025-01-15"),
    topic: "Newton's Laws of Motion",
    score: { raw: 8, total: 10, percent: 80 },
    accuracy: 80,
    questionTypes: ["MCQ", "SAQ"],
  },
  {
    id: "2",
    date: new Date("2025-01-14"),
    topic: "Thermodynamics",
    score: { raw: 7, total: 10, percent: 70 },
    accuracy: 70,
    questionTypes: ["MCQ", "LAQ"],
  },
  {
    id: "3",
    date: new Date("2025-01-13"),
    topic: "Kinematics",
    score: { raw: 9, total: 10, percent: 90 },
    accuracy: 90,
    questionTypes: ["MCQ"],
  },
];

const History = () => {
  const [attempts] = useState(mockAttempts);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "success";
    if (accuracy >= 60) return "accent";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/app">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-bold text-2xl">Quiz History</h1>
          </div>
          <Button asChild>
            <Link to="/app">New Quiz</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No quiz attempts yet. Start your first quiz!
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {format(attempt.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{attempt.topic}</TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {attempt.score.raw}/{attempt.score.total}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({attempt.score.percent}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getAccuracyColor(attempt.accuracy) as any}
                        >
                          {attempt.accuracy}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {attempt.questionTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
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
              <Link to="/app">Take Your First Quiz</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
