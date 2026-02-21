import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import acLogo from "@/assets/logo.jpg";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent a confirmation link to verify your account." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={acLogo} alt="AC CRM" className="h-16 w-16 rounded-lg mb-3" />
          <h1 className="text-xl font-bold tracking-wider text-sidebar-primary uppercase font-mono">
            AC CRM
          </h1>
          <p className="text-sm text-sidebar-muted mt-1">Auxilium Consults</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-4 shadow-lg">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium">Display Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="h-9 text-sm"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@company.com"
              className="h-9 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-sm"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={loading}>
            {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
          </Button>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-[11px] text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
          <p className="text-[11px] text-center text-muted-foreground">
            Internal access only. Contact IT for credentials.
          </p>
        </form>
      </div>
    </div>
  );
}
