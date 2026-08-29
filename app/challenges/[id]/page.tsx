import ChallengeWorkspace from "./ChallengeWorkspace";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  return <ChallengeWorkspace challengeId={(await params).id} />;
}
