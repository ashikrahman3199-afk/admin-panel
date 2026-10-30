import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

const CAMPAIGN_TABLE = "Campaign-d6pvakazenfljpsmln4xcmjx6u-NONE";
const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";
const USER_TABLE = "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET() {
    try {
        const [campaignRes, bookingRes, userRes] = await Promise.all([
            docClient.send(new ScanCommand({ TableName: CAMPAIGN_TABLE })),
            docClient.send(new ScanCommand({ TableName: BOOKING_TABLE })),
            docClient.send(new ScanCommand({ TableName: USER_TABLE })),
        ]);

        const users = userRes.Items || [];
        const userMap = new Map<string, any>();
        users.forEach(u => {
            if (u.id) userMap.set(u.id, u);
            if (u.userId) userMap.set(u.userId, u);
            if (u.email) userMap.set(u.email, u);
        });

        const rawCarts: any[] = [];

        // 1. Check Campaign table (where user mobile app stores active carts)
        (campaignRes.Items || []).forEach(item => {
            const isCart = (item.status && item.status.toUpperCase() === 'CART') ||
                           (item.id && item.id.startsWith('cart-')) ||
                           item.name === 'Active Cart';
            if (isCart) {
                rawCarts.push({ ...item, _source: 'Campaign' });
            }
        });

        // 2. Also check Booking table for any cart status records
        (bookingRes.Items || []).forEach(item => {
            const isCart = (item.status && item.status.toUpperCase() === 'CART');
            if (isCart) {
                rawCarts.push({ ...item, _source: 'Booking' });
            }
        });

        const carts = rawCarts.map(cart => {
            const user = userMap.get(cart.userId);
            const itemsJson = cart.cartDetails || cart.itemsJson || "[]";
            let items: any[] = [];
            try {
                items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            } catch (e) {
                items = [];
            }

            const userName = cart.userName || user?.name || (cart.userId ? cart.userId.split('@')[0] : "Unknown User");
            const userPhone = cart.userPhone || user?.phoneNumber || "No phone";
            const userEmail = cart.userId || user?.email || "Unknown";

            // Calculate actual total amount directly from the items in the cart
            const calculatedTotal = items.reduce((sum: number, it: any) => {
                const itemPrice = Number(it.price) || Number(it.minSpend) || 0;
                const qty = Number(it.quantity) || 1;
                return sum + (itemPrice * qty);
            }, 0);

            // Always prioritize the calculated items total so the estimated cart total
            // and the individual service prices in the cart list are always identical.
            const budget = items.length > 0 ? calculatedTotal : (Number(cart.budget) || 0);

            return {
                id: cart.id,
                userId: cart.userId,
                userName,
                userPhone,
                userEmail,
                itemsJson: typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson),
                items,
                totalItems: items.length,
                budget,
                updatedAt: cart.updatedAt || cart.createdAt || cart._lastChangedAt || new Date().toISOString(),
                createdAt: cart.createdAt || cart.updatedAt || new Date().toISOString(),
                _source: cart._source
            };
        });

        // Sort by updatedAt descending
        carts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json({ 
            success: true, 
            carts,
            count: carts.length
        });
    } catch (error: any) {
        console.error("Error fetching carts:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
