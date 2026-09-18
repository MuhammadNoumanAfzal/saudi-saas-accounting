import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f4f1e8] px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#173b38] text-[#f3c746]">
          <Compass size={30} />
        </div>
        <div className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-[#aa7a0d]">NEXUS / 404</div>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.06em] text-[#173b38]">This page took a wrong turn.</h1>
        <p className="mt-4 text-sm leading-7 text-[#718078]">The workspace is still here. This particular address is not part of the map yet.</p>
        <Link href="/" className="btn-primary mt-7" data-testid="link-404-home"><ArrowLeft size={16} /> Back to Nexus</Link>
      </div>
    </div>
  );
}
