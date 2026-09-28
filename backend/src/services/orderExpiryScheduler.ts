import { db } from '../database/db.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { AppNotification, Order } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Checks all active booking requests and auto-cancels any that have passed the 24-hour store confirmation window.
 */
export async function checkAndExpirePendingBookings(): Promise<number> {
  const orders = db.getTable('orders');
  const now = new Date();
  let expiredCount = 0;

  for (const order of orders) {
    if (order.status === 'PENDING_OWNER_CONFIRMATION') {
      const expiresAt = order.expiresAt ? new Date(order.expiresAt) : new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000);
      
      if (now > expiresAt) {
        console.log(`⏱️ [24H SLA EXPIRED] Order #${order.orderNumber} (ID: ${order.id}) at '${order.vendorName}' passed 24-hour confirmation SLA.`);

        const trackingUpdates = [
          ...(order.trackingUpdates || []),
          {
            status: 'EXPIRED_AUTO_CANCELLED',
            message: `Booking reservation auto-cancelled after passing the 24-hour merchant confirmation SLA. One-click transfer unlocked for alternative retailers.`,
            timestamp: now.toISOString()
          }
        ];

        // Update local database
        db.update('orders', order.id, {
          status: 'EXPIRED_AUTO_CANCELLED',
          rejectionReason: 'EXPIRED_24H_SLA',
          rejectionNotes: 'Store owner did not respond within the 24-hour confirmation window.',
          trackingUpdates,
          updatedAt: now.toISOString()
        });

        // Mirror to Supabase if connected
        try {
          await SupabaseDataService.updateOrderStatus(order.id, 'EXPIRED_AUTO_CANCELLED', trackingUpdates);
        } catch (err: any) {
          // non-fatal mirror log
        }

        // Notify Farmer
        const farmerNotification: AppNotification = {
          id: `notif-${uuidv4().substring(0, 8)}`,
          userId: order.farmerId,
          title: `Booking Expired: Order #${order.orderNumber}`,
          body: `Your booking with ${order.vendorName} expired after 24 hours. Tap to re-route your items to the next nearest dealer instantly.`,
          category: 'ORDER',
          linkUrl: '/orders',
          isRead: false,
          createdAt: now.toISOString()
        };
        db.insert('notifications', farmerNotification);

        // Notify Vendor / Store Owner
        const vendorNotification: AppNotification = {
          id: `notif-${uuidv4().substring(0, 8)}`,
          userId: order.vendorId,
          title: `Booking SLA Missed: Order #${order.orderNumber}`,
          body: `Booking request #${order.orderNumber} for ₹${order.totalAmount} was auto-cancelled due to exceeding the 24-hour acceptance SLA.`,
          category: 'ORDER',
          linkUrl: '/vendor-portal',
          isRead: false,
          createdAt: now.toISOString()
        };
        db.insert('notifications', vendorNotification);

        expiredCount++;
      }
    }
  }

  return expiredCount;
}

/**
 * Starts the periodic background cron scheduler (running every 30 seconds).
 */
export function startOrderExpiryScheduler(intervalMs = 30000): void {
  if (schedulerInterval) return;

  console.log(`⏰ [BACKGROUND CRON] 24-Hour Order Expiry SLA Scheduler active (polling every ${intervalMs / 1000}s)...`);

  // Run initial check immediately
  checkAndExpirePendingBookings().catch(err => console.error('[SCHEDULER ERROR]:', err));

  schedulerInterval = setInterval(async () => {
    try {
      await checkAndExpirePendingBookings();
    } catch (err) {
      console.error('[SCHEDULER RUN ERROR]:', err);
    }
  }, intervalMs);
}

export function stopOrderExpiryScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('⏰ [BACKGROUND CRON] Order Expiry Scheduler stopped.');
  }
}
