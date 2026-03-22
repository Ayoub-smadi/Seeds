import { useGetOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";

export default function OrdersAdmin() {
  const { data, isLoading } = useGetOrders({ limit: 50 });
  const updateStatus = useUpdateOrderStatus();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and fulfillment</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
              <th className="px-6 py-4 font-medium">Order #</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
            ) : data?.orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium font-mono text-sm">{order.orderNumber}</td>
                <td className="px-6 py-4">
                  <p className="font-medium">{order.shippingAddress?.name || order.user?.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(order.createdAt || "").toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-bold text-primary">
                  {formatPrice(order.total)}
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus.mutate({ id: order.id, data: { status: e.target.value as any } })}
                    className="bg-background border border-border rounded-lg px-3 py-1 text-sm font-medium focus:ring-primary focus:border-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
