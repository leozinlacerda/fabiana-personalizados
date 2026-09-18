import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInstitutionalBlocks, InstitutionalBlock } from "@/lib/db";

const InstitutionalBlocks = () => {
  const [blocks, setBlocks] = useState<InstitutionalBlock[]>([]);

  useEffect(() => {
    getInstitutionalBlocks().then(loaded => setBlocks(loaded.slice(0, 2)));
  }, []);

  if (blocks.length === 0) return null;

  return (
    <section className="w-full">
      <div className={`grid grid-cols-1 md:grid-cols-2 w-full gap-0`}>
        {blocks.map((block) => (
          <Link
            key={block.id}
            to={block.link_url || "#"}
            className="relative group overflow-hidden aspect-[4/3] sm:aspect-[16/9] w-full"
          >
            {block.image_url ? (
              <img
                src={block.image_url}
                alt={block.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg">{block.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-white text-xl font-bold text-center">
                {block.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default InstitutionalBlocks;