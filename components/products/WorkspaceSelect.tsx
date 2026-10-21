type Option = { id: string; name: string };

/** Espacio de un lead: vacío = FoxCode (servicios a medida). */
export function WorkspaceSelect({ products, defaultValue, className, labelClassName }: { products: Option[]; defaultValue?: string | null; className?: string; labelClassName?: string }) {
  return (
    <label className={labelClassName}>
      Espacio
      <select name="productId" defaultValue={defaultValue ?? ''} className={className}>
        <option value="">FoxCode (servicios)</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
    </label>
  );
}
