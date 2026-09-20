import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The flashcard or page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button className="rounded-xl">Go back to Home</Button>
      </Link>
    </div>
  );
}
