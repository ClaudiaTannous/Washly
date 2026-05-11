const prisma = require("../prisma");

// Checks orders that were requested more than 1 hour ago
// and the worker still did not accept them
async function checkUnacceptedOrders() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        status: "REQUESTED",
        created_at: {
          lte: oneHourAgo,
        },
        not_accepted_notification_sent: false,
      },
      select: {
        id: true,
        customer_user_id: true,
      },
    });

    for (const order of orders) {
      await prisma.notification.create({
        data: {
          user_id: order.customer_user_id,
          order_id: order.id,
          type: "ORDER_NOT_ACCEPTED",
          title: "Order not accepted yet",
          message:
            "The worker has not accepted your laundry order after one hour.",
        },
      });

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          not_accepted_notification_sent: true,
        },
      });
    }

    if (orders.length > 0) {
      console.log(`Created ${orders.length} unaccepted order notifications`);
    }
  } catch (error) {
    console.error("Check Unaccepted Orders Error:", error);
  }
}

module.exports = checkUnacceptedOrders;
