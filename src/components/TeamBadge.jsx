import { useState } from "react";
import { crestPath } from "../config/teams";

// Los .webp ya tienen transparencia real — el escudo va directo sobre
// la superficie oscura, sin chip ni fondo propio. Un rim-light muy
// sutil (filter, no un contenedor) asegura legibilidad tanto para
// escudos claros como oscuros, sin agregar ningún elemento visual.

const SIZES = {
  xs: "w-7 h-7",
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export default function TeamBadge({ teamId, name, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const cls = SIZES[size];

  if (teamId && !failed) {
    return (
      <img
        src={crestPath(teamId)}
        alt={name}
        title={name}
        onError={() => setFailed(true)}
        className={`${cls} crest-glow object-contain shrink-0`}
      />
    );
  }

  // Sin escudo cargado todavía: un aro tenue, sin relleno — nunca un
  // bloque de color ni una inicial.
  return (
    <span
      title={name}
      aria-hidden={!name}
      className={`${cls} rounded-full border border-white/[0.08] shrink-0 inline-block`}
    />
  );
}
