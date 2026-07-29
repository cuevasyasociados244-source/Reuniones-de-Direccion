export default function Placeholder({
  titulo,
  descripcion,
  fase,
}: {
  titulo: string;
  descripcion: string;
  fase: string;
}) {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        <p className="text-sm text-gray-500">{descripcion}</p>
      </header>
      <div className="rounded-card border border-dashed border-gray-200 bg-white p-10 text-center">
        <div className="text-sm font-semibold text-gray-700">Módulo en construcción</div>
        <p className="mt-1 text-sm text-gray-500">
          Este módulo se implementa en la <span className="font-semibold">{fase}</span> del plan.
        </p>
      </div>
    </div>
  );
}
