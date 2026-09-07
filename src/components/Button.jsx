import { Link } from "react-router-dom";

// Única definición de "botón sólido" de toda la app — si algo necesita
// un botón, usa este, no un rounded-lg/bg-color improvisado ad hoc.
// Si se pasa `to`, renderiza un Link real (nunca un <button> anidado
// dentro de un <a>, que es HTML inválido).
export default function Button({ children, onClick, to, type = "button", variant = "solid", disabled }) {
  const base = "inline-flex items-center justify-center font-sans font-bold text-sm tracking-[0.15em] uppercase px-6 py-3 transition disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    solid: "bg-electric text-ink hover:brightness-110",
    ghost: "border border-panelLight text-bone hover:border-electric/60",
    danger: "bg-rust text-bone hover:brightness-110",
  };

  const className = `${base} ${variants[variant]}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}
