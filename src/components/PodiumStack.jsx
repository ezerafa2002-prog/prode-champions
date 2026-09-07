import PodiumCard from "./PodiumCard";

export default function PodiumStack({ first, second, third, onSelect }) {
  return (
    <div className="relative flex justify-center items-center h-[300px] sm:h-[340px] mb-6">
      {/* 3º — capa de atrás, desplazado a la derecha */}
      <div className="absolute z-10 translate-x-[72px] sm:translate-x-[120px] translate-y-3 rotate-2">
        <PodiumCard position={3} {...third} layer="back" onClick={() => onSelect(third)} />
      </div>

      {/* 2º — capa de atrás, desplazado a la izquierda */}
      <div className="absolute z-20 -translate-x-[72px] sm:-translate-x-[120px] translate-y-3 -rotate-2">
        <PodiumCard position={2} {...second} layer="back" onClick={() => onSelect(second)} />
      </div>

      {/* 1º — al frente, centrado */}
      <div className="relative z-30">
        <PodiumCard position={1} {...first} layer="front" onClick={() => onSelect(first)} />
      </div>
    </div>
  );
}
