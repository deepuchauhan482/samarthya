import { ArrowLeft, HandHeart, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound(){return <main className="final-state"><div><span><SearchX/></span><h1>We couldn’t find that page.</h1><p>The challenge may be awaiting approval, unavailable, or the link may be incorrect.</p><Button asChild><a href="/"><ArrowLeft/>Return to Samarthya</a></Button><small><HandHeart/>Verified challenges remain available from the homepage.</small></div></main>}
