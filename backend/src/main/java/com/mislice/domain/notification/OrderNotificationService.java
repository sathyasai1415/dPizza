package com.mislice.domain.notification;

import com.mislice.domain.order.Order;
import com.mislice.domain.order.dto.OrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewOrder(OrderDto order) {
        String destination = "/topic/restaurant/" + order.restaurantId() + "/orders";

        Map<String, Object> notification = new HashMap<>();
        notification.put("event", "NEW_ORDER");
        notification.put("orderNumber", order.orderNumber());
        notification.put("orderId", order.id());
        notification.put("customerName", order.userName());
        notification.put("items", order.items());
        notification.put("total", order.total());
        notification.put("placedAt", order.placedAt());
        notification.put("estimatedEtaMin", order.estimatedEtaMin());
        notification.put("estimatedEtaMax", order.estimatedEtaMax());
        notification.put("status", order.status());

        try {
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Sent new order notification for order {} to restaurant {}",
                order.orderNumber(), order.restaurantId());
        } catch (Exception e) {
            log.error("Failed to send order notification for order {}", order.orderNumber(), e);
        }
    }

    public void notifyOrderStatusChange(OrderDto order, String previousStatus) {
        String destination = "/topic/restaurant/" + order.restaurantId() + "/orders";

        Map<String, Object> notification = new HashMap<>();
        notification.put("event", "ORDER_STATUS_CHANGED");
        notification.put("orderNumber", order.orderNumber());
        notification.put("orderId", order.id());
        notification.put("previousStatus", previousStatus);
        notification.put("newStatus", order.status());
        notification.put("changedAt", System.currentTimeMillis());

        try {
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Sent status change notification for order {} to restaurant {}",
                order.orderNumber(), order.restaurantId());
        } catch (Exception e) {
            log.error("Failed to send status change notification for order {}", order.orderNumber(), e);
        }
    }
}
