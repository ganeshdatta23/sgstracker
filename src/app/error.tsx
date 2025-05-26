'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{error.message || "An unexpected error occurred."}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 