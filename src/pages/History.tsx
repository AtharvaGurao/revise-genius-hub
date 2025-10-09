import { useState } from "react";
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
import { Eye } from "lucide-react";
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
                {attempts.length === 0 ? (
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
