import { NavLink } from "@/components/NavLink";
import { getSiteSettings, SiteSettings } from "@/lib/db";
import { useState, useEffect } from "react";

const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <footer className="bg-white border-t border-gray-100 font-['Outfit']">
      {/* Main footer content */}
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* Logo and description */}
          <div>
            <h2 className="text-xl font-bold text-black mb-3">Fabiana</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed font-light">
              Véus, bíblias e acessórios personalizados para momentos especiais.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[12px] font-semibold text-black mb-3 uppercase tracking-wider">Links</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className="text-[12px] text-gray-500 hover:text-black transition-colors">
                  Início
                </NavLink>
              </li>
              <li>
                <NavLink to="/produtos" className="text-[12px] text-gray-500 hover:text-black transition-colors">
                  Produtos
                </NavLink>
              </li>
              <li>
                <NavLink to="/contato" className="text-[12px] text-gray-500 hover:text-black transition-colors">
                  Contato
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-[12px] font-semibold text-black mb-3 uppercase tracking-wider">Contato</h3>
            <div className="space-y-2">
              {settings?.whatsapp_number && (
                <a 
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-green-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              <p className="text-[12px] text-gray-500">
                Atendimento via WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400">
              © {new Date().getFullYear()} Fabiana Personalizados. Todos os direitos reservados.
            </p>
            
            {/* Payment methods */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Pagamento:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-[7px] font-bold">PIX</span>
                </div>
                <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-[7px] font-bold">VISA</span>
                </div>
                <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-[7px] font-bold">MC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;