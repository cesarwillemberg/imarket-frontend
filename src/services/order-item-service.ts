import { supabase } from "../lib/supabase";


interface OrderItem {
    order_id: string;
    store_id: string;
    produto_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}


const orderItemService = {

    getOrderItemsByOrderId: async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .select()
                .eq('order_id', orderId);
            if (error) {
                throw new Error(`Error fetching order items: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error fetching order items:", error);
            throw new Error("Failed to fetch order items");
        }
    },

    getOrderItemsById: async (orderItemId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .select()
                .eq('order_item_id', orderItemId)
                .single();
            if (error) {
                throw new Error(`Error fetching order item: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error fetching order item:", error);
            throw new Error("Failed to fetch order item");
        }
    },

    getOrderItemsByStoreId: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .select()
                .eq('store_id', storeId);
            if (error) {
                throw new Error(`Error fetching order items: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error fetching order items:", error);
            throw new Error("Failed to fetch order items");
        }
    },

    createOrderItems: async (orderItems: OrderItem[]) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .insert(orderItems);
            if (error) {
                throw new Error(`Error creating order items: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error creating order items:", error);
            throw new Error("Failed to create order items");
        }
    },

    deleteOrderItemById: async (orderItemId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .delete()
                .eq('order_item_id', orderItemId);
            if (error) {
                throw new Error(`Error deleting order item: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error deleting order item:", error);
            throw new Error("Failed to delete order item");
        }
    },

    deleteOrderItemsByOrderId: async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('order_item')
                .delete()
                .eq('order_id', orderId);
            if (error) {
                throw new Error(`Error deleting order items: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error deleting order items:", error);
            throw new Error("Failed to delete order items");
        }
    },





}

export default orderItemService;