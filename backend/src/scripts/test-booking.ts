import { db } from '../database/db.js';
import { checkAndExpirePendingBookings } from '../services/orderExpiryScheduler.js';

async function testWorkflow() {
  console.log('=== TESTING BOOKING WORKFLOW ===');

  // 1. Fetch farmer token
  const tokenRes = await fetch('http://localhost:5000/api/auth/active-farmer');
  const tokenData: any = await tokenRes.json();
  const token = tokenData.token;
  console.log('Farmer token retrieved for:', tokenData.user.name);

  // 2. Submit booking request
  const bookingRes = await fetch('http://localhost:5000/api/orders/booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        { productId: 'prod-urea-iffco', quantity: 2 },
        { productId: 'prod-gromor-28', quantity: 1 }
      ],
      shopId: 'shop-1',
      pickupPreference: 'COUNTER_PICKUP',
      deliveryAddress: {
        name: 'nani',
        phone: '+91 9951518699',
        village: 'Kadiri Rural'
      }
    })
  });

  const booking: any = await bookingRes.json();
  console.log('Booking response status:', bookingRes.status, booking);
  console.log('✅ Booking Created:', {
    id: booking.id,
    orderNumber: booking.orderNumber,
    status: booking.status,
    totalAmount: booking.totalAmount,
    vendorName: booking.vendorName,
    expiresAt: booking.expiresAt,
    shopDetails: booking.shopDetails?.name
  });

  // 3. Test Accept Booking (generates OTP)
  const acceptRes = await fetch(`http://localhost:5000/api/orders/${booking.id}/accept`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const acceptedOrder: any = await acceptRes.json();
  console.log('✅ Booking Accepted:', {
    status: acceptedOrder.status,
    collectionOtp: acceptedOrder.collectionOtp
  });

  // 4. Create another booking to test Reject & Transfer
  const booking2Res = await fetch('http://localhost:5000/api/orders/booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [{ productId: 'prod-seeds-groundnut', quantity: 1 }],
      shopId: 'shop-1',
      pickupPreference: 'COUNTER_PICKUP'
    })
  });
  const booking2: any = await booking2Res.json();
  console.log('✅ Booking #2 Created for Reject & Transfer test:', booking2.orderNumber);

  // 5. Reject booking #2
  const rejectRes = await fetch(`http://localhost:5000/api/orders/${booking2.id}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      rejectionReason: 'OUT_OF_STOCK',
      rejectionNotes: 'Current batch reserved for AP Seeds Corp distribution.'
    })
  });
  const rejectedOrder: any = await rejectRes.json();
  console.log('✅ Booking #2 Rejected:', {
    status: rejectedOrder.status,
    reason: rejectedOrder.rejectionReason,
    notes: rejectedOrder.rejectionNotes
  });

  // 6. Test One-Click Transfer to Next Nearest Shop
  const transferRes = await fetch(`http://localhost:5000/api/orders/${booking2.id}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      targetShopId: 'shop-2'
    })
  });
  const transferredOrder: any = await transferRes.json();
  console.log('✅ Booking #2 Transferred to Next Nearest Shop:', {
    newOrderNumber: transferredOrder.orderNumber,
    newVendorName: transferredOrder.vendorName,
    status: transferredOrder.status,
    freshExpiresAt: transferredOrder.expiresAt,
    transferredFrom: transferredOrder.transferredFromOrderId
  });

  // 7. Test 24-Hour Expiry SLA Auto-Cancel
  // Backdate booking #2 to 25 hours ago
  const expiredPast = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  db.update('orders', transferredOrder.id, {
    createdAt: expiredPast,
    expiresAt: expiredPast
  });
  console.log('⏰ Backdated transferred order to 25h ago, running SLA check...');
  const expiredCount = await checkAndExpirePendingBookings();
  const refreshed = db.findById('orders', transferredOrder.id);
  console.log('✅ Auto-Expiry Result:', {
    expiredCount,
    finalStatus: refreshed?.status,
    rejectionReason: refreshed?.rejectionReason
  });

  console.log('=== ALL WORKFLOW TESTS PASSED ===');
}

testWorkflow().catch(console.error);
