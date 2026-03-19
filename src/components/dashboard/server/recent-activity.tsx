import { getCachedRecentOrders } from '@/lib/cache';
import { LiveActivityFeedClient } from '@/components/dashboard/client/chart-loaders';

export async function RecentActivitySection() {
  const orders = await getCachedRecentOrders();
  
  // Transform to live activities
  const liveActivities = orders.slice(0, 10).map(order => {
     return {
        id: order.id,
        type: (order.status === 'DELIVERED' ? 'delivery' : 'sale') as 'sale' | 'delivery' | 'system',
        message: `${order.status === 'DELIVERED' ? 'Order delivered' : 'New order'} ${order.customer?.name ? `from ${order.customer.name.split(' ')[0]}` : ''}`,
        time: 'Just now', 
        amount: Number(order.total ?? 0),
        user: order.customer?.name?.substring(0, 2).toUpperCase() ?? 'CU'
     };
  });

  return <LiveActivityFeedClient activities={liveActivities} />;
}
