import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";

type AuthMode = "login" | "forgot-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const user = await loginUser(email, password);
      
      if (user) {
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });
        navigate("/");
      } else {
        toast({
          title: "Erro",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Funcionalidade indisponível",
      description: "Recuperação de senha não disponível no modo local",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            {mode === "login" && (
              <>
                <h1 className="text-2xl font-semibold text-center mb-6 text-foreground">Entrar</h1>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="admin@fabiana.com" 
                        className="pl-10" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-foreground">Senha</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="pl-10" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                  
                  <Button type="submit" disabled={loading} className="w-full bg-[#9f9f9f]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                  </Button>
                </form>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <strong>Credenciais padrão:</strong><br />
                    Email: admin@fabiana.com<br />
                    Senha: admin
                  </p>
                </div>
              </>
            )}
            
            {mode === "forgot-password" && (
              <>
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => setMode("login")} 
                    className="mr-3"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <h1 className="text-2xl font-semibold text-foreground">Recuperar senha</h1>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Funcionalidade não disponível no modo local.
                </p>
                
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={() => setMode("login")}
                >
                  Voltar ao login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
