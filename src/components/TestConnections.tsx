import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadToImageKit } from "@/lib/imagekit";
import { CheckCircle, XCircle, Loader2, Database, Image as ImageIcon } from "lucide-react";

type TestResult = { status: 'idle' | 'loading' | 'success' | 'error'; message: string; details?: string };

export const TestConnections = () => {
  const [supabaseTest, setSupabaseTest] = useState<TestResult>({ status: 'idle', message: 'Clique para testar conexão com Supabase' });
  const [imageKitTest, setImageKitTest] = useState<TestResult>({ status: 'idle', message: 'Clique para testar upload no ImageKit' });

  const testSupabase = async () => {
    setSupabaseTest({ status: 'loading', message: 'Testando Supabase...' });
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !anon) throw new Error("VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não configurado no .env");

      // Testa 3 tabelas principais
      const checks: string[] = [];
      const { data: cat, error: catErr } = await supabase.from('categories').select('id').limit(1);
      if (catErr) throw new Error(`categories: ${catErr.message}`);
      checks.push(`categories OK (${cat?.length ?? 0} linhas)`);

      const { data: prod, error: prodErr } = await supabase.from('products').select('id').limit(1);
      if (prodErr) throw new Error(`products: ${prodErr.message}`);
      checks.push(`products OK`);

      const { data: settings, error: setErr } = await supabase.from('site_settings').select('id').limit(1);
      if (setErr) throw new Error(`site_settings: ${setErr.message}`);
      checks.push(`site_settings OK`);

      const { data: carousel, error: carErr } = await supabase.from('carousel_images').select('id').limit(1);
      if (carErr) throw new Error(`carousel_images: ${carErr.message}`);
      checks.push(`carousel OK`);

      setSupabaseTest({
        status: 'success',
        message: 'Supabase conectado com sucesso!',
        details: `URL: ${url}\n${checks.join(' | ')}`
      });
    } catch (e: any) {
      setSupabaseTest({ status: 'error', message: 'Falha ao conectar Supabase', details: e.message });
    }
  };

  const testImageKit = async () => {
    setImageKitTest({ status: 'loading', message: 'Testando ImageKit...' });
    try {
      const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
      const pubKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
      if (!endpoint || !pubKey) throw new Error("VITE_IMAGEKIT_URL_ENDPOINT ou VITE_IMAGEKIT_PUBLIC_KEY não configurado");

      // Testa endpoint acessível
      try {
        await fetch(endpoint, { method: 'HEAD' });
      } catch { /* ignora, nem sempre permite HEAD */ }

      // Cria imagem 1x1 png para upload teste
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#C4A77D'; ctx.fillRect(0, 0, 1, 1);
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
      const file = new File([blob], `teste-${Date.now()}.png`, { type: 'image/png' });

      const url = await uploadToImageKit(file, '/fabiana/teste');
      
      setImageKitTest({
        status: 'success',
        message: 'ImageKit upload OK!',
        details: `Endpoint: ${endpoint}\nURL: ${url}\nPublicKey: ${pubKey.slice(0,12)}...`
      });
    } catch (e: any) {
      setImageKitTest({ status: 'error', message: 'Falha ImageKit', details: e.message + "\nVerifique se Edge Function upload-imagekit foi deployada ou IMAGEKIT_PRIVATE_KEY no fallback DEV." });
    }
  };

  const ResultCard = ({ result, icon: Icon, title }: { result: TestResult; icon: any; title: string }) => (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold">{title}</h3>
        {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
        {result.status === 'error' && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
        {result.status === 'loading' && <Loader2 className="w-5 h-5 animate-spin ml-auto" />}
      </div>
      <p className={`text-sm ${result.status === 'success' ? 'text-green-700' : result.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {result.message}
      </p>
      {result.details && (
        <pre className="text-xs bg-muted p-3 rounded overflow-auto whitespace-pre-wrap break-words">{result.details}</pre>
      )}
    </div>
  );

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg">
      <h2 className="text-xl font-serif font-semibold">Teste de Conexões</h2>
      <p className="text-sm text-muted-foreground">Verifique se Supabase (banco) e ImageKit (imagens) estão configurados. Use após rodar o SQL no Supabase.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <ResultCard result={supabaseTest} icon={Database} title="Supabase" />
          <Button onClick={testSupabase} disabled={supabaseTest.status === 'loading'} className="w-full">
            {supabaseTest.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Testar Supabase
          </Button>
        </div>
        <div className="space-y-3">
          <ResultCard result={imageKitTest} icon={ImageIcon} title="ImageKit" />
          <Button onClick={testImageKit} disabled={imageKitTest.status === 'loading'} variant="outline" className="w-full">
            {imageKitTest.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            Testar ImageKit
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
        <p><strong>Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL || 'não configurado'}</p>
        <p><strong>ImageKit:</strong> {import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'não configurado'}</p>
        <p>Dica: se ImageKit falhar, faça deploy da Edge Function: <code>supabase functions deploy upload-imagekit</code></p>
      </div>
    </div>
  );
};
