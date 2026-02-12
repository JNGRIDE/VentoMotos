import { ContractForm } from "./contract-form";

export default function EditablesPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col items-center justify-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Contratos Editables</h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Complete el formulario a continuación para generar el contrato PROFECO con los datos del cliente y la venta.
          Una vez generado, se descargará automáticamente un archivo Word (.docx) listo para firmar.
        </p>
        <ContractForm />
      </div>
    </div>
  );
}
