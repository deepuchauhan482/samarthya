"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="final-state"><div><span><TriangleAlert/></span><h1>Something didn’t load correctly.</h1><p>Your saved data has not been removed. Try loading this page again.</p><Button onClick={reset}><RefreshCw/>Try again</Button><a href="/">Return home</a></div></main>}
