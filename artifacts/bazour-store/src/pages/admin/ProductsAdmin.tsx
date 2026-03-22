import { useState } from "react";
import { useGetProducts, useDeleteProduct, useCreateProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ProductsAdmin() {
  const { data, isLoading } = useGetProducts({ limit: 100 });
  const deleteMut = useDeleteProduct();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your store inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl">Bulk Import</Button>
          <Button className="rounded-xl gap-2"><Plus className="w-4 h-4"/> Add Product</Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Stock</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
            ) : data?.products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{product.nameAr}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.quantity > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {product.quantity} in stock
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.onSale ? <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-bold">On Sale</span> : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10" onClick={() => {
                      if(confirm("Delete this product?")) deleteMut.mutate({ id: product.id });
                    }}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
