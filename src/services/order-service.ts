import { supabase } from "../lib/supabase";

interface Order {
    profile_id: string;
    cart_id: string;
    address_id: string;
    profile_payment_method_id: string;
    total_amount: number;
    status: string;
    payment_method: string;
    delivery_method: string;
    delivery_date: string;
    delivery_time_start: string;
    delivery_time_end: string;
    delivery_notes?: string;
}

const orderService = {

    createOrder: async (orderData: Order) => {
        try {
            const { data, error } = await supabase
                .from('order')
                .insert([orderData])
                .select()
                .single();
            if (error) {
                throw new Error(`Error creating order: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error creating order:", error);
            throw new Error("Failed to create order");
        }
    },

    getOrderById: async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('order')
                .select()
                .eq('order_id', orderId)
                .single();
            if (error) {
                throw new Error(`Error fetching order: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error fetching order:", error);
            throw new Error("Failed to fetch order");
        }
    },

    getOrdersByUser: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('order')
                .select()
                .eq('user_id', userId);
            if (error) {
                throw new Error(`Error fetching orders: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw new Error("Failed to fetch orders");
        }
    },

    updateOrder: async (orderId: string, updatedData: Partial<Order>) => {
        try {
            const { data, error } = await supabase
                .from('order')
                .update(updatedData)
                .eq('order_id', orderId)
                .select()
                .single();
            if (error) {
                throw new Error(`Error updating order: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error updating order:", error);
            throw new Error("Failed to update order");
        }
    },

    deleteOrder: async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('order')
                .delete()
                .eq('order_id', orderId);
            if (error) {
                throw new Error(`Error deleting order: ${error.message}`);
            }
            return data;
        } catch (error) {
            console.error("Error deleting order:", error);
            throw new Error("Failed to delete order");
        }
    }



};

export default orderService;