import Link from "next/link";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";

export default function NotFoundPage() {
  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] gap-8 px-4 text-center">
      <div className="font-mono text-[6rem] font-bold text-border2 leading-none select-none">
        404
      </div>
      <div>
        <h1 className="text-3xl font-display font-bold mb-3">
          This journey doesn&apos;t exist.
        </h1>
        <p className="text-text2 max-w-md">
          The page you&apos;re looking for either moved or was never built in public.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/"><Button variant="ghost">Go Home</Button></Link>
        <Link href="/explore"><Button>Explore Journeys</Button></Link>
      </div>
    </PageTransition>
  );
}
