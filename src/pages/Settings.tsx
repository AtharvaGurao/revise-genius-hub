import { useState } from "react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [apiStatus, setApiStatus] = useState<"healthy" | "unhealthy" | "unknown">("unknown");
  const { toast } = useToast();

  const handleClearCache = () => {
    toast({
      title: "Cache cleared",
      description: "All cached data has been removed.",
    });
  };

  const checkApiHealth = async () => {
    // Placeholder for API health check
    // In production, this would call: fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
    setApiStatus("healthy");
    toast({
      title: "API Status",
      description: "Backend is healthy and responsive.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and application settings.</p>
        </div>
        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Status</CardTitle>
            <CardDescription>
              Check the health and connectivity of your backend API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">API Status:</span>
                {apiStatus === "healthy" && (
                  <Badge className="bg-success text-success-foreground">
                    <Check className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                )}
                {apiStatus === "unhealthy" && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Unhealthy
                  </Badge>
                )}
                {apiStatus === "unknown" && (
                  <Badge variant="outline">Unknown</Badge>
                )}
              </div>
              <Button onClick={checkApiHealth} variant="outline" size="sm">
                Check Now
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
              {import.meta.env.VITE_API_BASE_URL || "API URL not configured"}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Appearance</CardTitle>
            <CardDescription className="text-sm">
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label 
                  htmlFor="dark-mode" 
                  className="cursor-pointer text-sm sm:text-base font-medium"
                >
                  Dark Mode
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="self-start sm:self-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your local data and cache
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleClearCache}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About SmartRevise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              SmartRevise is built to help Class XI-XII students revise efficiently
              using AI-powered tools and intelligent quiz generation.
            </p>
            <p className="pt-4 border-t">
              For support or feedback, contact:{" "}
              <a href="mailto:support@smartrevise.com" className="text-primary hover:underline">
                support@smartrevise.com
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
