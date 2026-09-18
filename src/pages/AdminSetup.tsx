import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSetup = async () => {
    setLoading(true);

    try {
      toast({
        title: "Sucesso!",
        description: "Usuário admin já está configurado. Faça login com admin/admin.",
      });
      
      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-muted">
      <div className="w-full max-w-md p-8 bg-background rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">
          Configuração Inicial
        </h1>
        
        <p className="text-muted-foreground mb-8">
          O sistema está pronto para uso. Faça login com as credenciais padrão.
        </p>
        
        <div className="bg-muted p-4 rounded-lg mb-8">
          <p className="text-sm font-mono mb-2">
            <strong>Usuário:</strong> admin
          </p>
          <p className="text-sm font-mono">
            <strong>Senha:</strong> admin
          </p>
        </div>

        <Button onClick={handleSetup} className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            "Ir para o Login"
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminSetup;
