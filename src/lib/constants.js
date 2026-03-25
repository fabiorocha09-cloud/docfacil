export const TIPOS_CERTIDAO = [
  { tipo: "federal", label: "Federal" },
  { tipo: "estadual", label: "Estadual" },
  { tipo: "municipal", label: "Municipal" },
  { tipo: "fgts", label: "FGTS" },
  { tipo: "trabalhista", label: "Trabalhista" },
  { tipo: "alvara_bombeiros", label: "Alvará - Bombeiros" },
  { tipo: "alvara_vigilancia_sanitaria", label: "Alvará - Vigilância Sanitária" },
  { tipo: "alvara_funcionamento", label: "Alvará - Funcionamento" },
  { tipo: "alvara_meio_ambiente", label: "Alvará - Meio Ambiente" },
];

export const TIPOS_LABEL = Object.fromEntries(TIPOS_CERTIDAO.map(t => [t.tipo, t.label]));

// Tipos consolidados da matriz (filiais herdam estes)
export const TIPOS_CONSOLIDADOS_MATRIZ = ["federal", "fgts", "trabalhista"];