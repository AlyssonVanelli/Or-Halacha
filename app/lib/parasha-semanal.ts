'use client'

import { useEffect, useState } from 'react'

export default function ParashaViewer() {
  const [parasha, setParasha] = useState<{
    nome: string
    haftarah: string
    leituraEspecial: string
  } | null>(null);

  useEffect(() => {
    const getParasha = async () => {
      const res = await fetch('/api/parasha');
      const data = await res.json();
      setParasha(data);
    };

    getParasha();
  }, []);

  if (!parasha) return <p>Carregando parashá...</p>;

  return (
    <div>
      <h2>{parasha.nome}</h2>
      <p><strong>Haftarah:</strong> {parasha.haftarah}</p>
      <p><strong>Leituras Especiais:</strong> {parasha.leituraEspecial}</p>
    </div>
  );
}
