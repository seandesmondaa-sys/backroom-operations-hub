import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import acLogo from "@/assets/logo.jpg";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
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
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@company.com"
              className="h-9 text-sm"
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
            />
          </div>
          <Button type="submit" className="w-full h-9 text-sm font-medium">
            Sign In
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Internal access only. Contact IT for credentials.
          </p>
        </form>
      </div>
    </div>
  );
}
