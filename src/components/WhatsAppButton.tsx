import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getSiteSettings, SiteSettings } from "@/lib/db";

const WhatsAppButton = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  if (!settings || !settings.whatsapp_number || settings.whatsapp_number.trim() === "") {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};

export default WhatsAppButton;
