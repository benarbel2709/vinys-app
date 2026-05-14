import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { AlertTriangle } from "lucide-react";

export default function Stop() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-destructive/8 flex items-center justify-center">
          <AlertTriangle size={36} className="text-destructive" />
        </div>

        <h1 className="text-foreground">Please Stop</h1>

        <div className="card-premium p-6 border border-destructive/20 text-[15px] leading-relaxed space-y-3">
          <p className="font-medium">This is not the right time to practice.</p>
          <p className="text-muted-foreground">
            If you're experiencing sharp new pain, increasing numbness or weakness, unusual dizziness, shortness of breath, fever, or acute illness — please stop and consult a medical professional.
          </p>
        </div>

        <Button variant="hero" size="lg" onClick={() => navigate("/")} className="w-full max-w-xs">
          Return home
        </Button>
      </div>
    </Layout>
  );
}
