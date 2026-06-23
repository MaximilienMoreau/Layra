import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VectorizerAppLoader } from "@/components/VectorizerAppLoader";

export default function Home() {
  return (
    <ErrorBoundary>
      <VectorizerAppLoader />
    </ErrorBoundary>
  );
}
