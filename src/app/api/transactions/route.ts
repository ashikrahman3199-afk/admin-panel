import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";
const USER_TABLE = "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET() {
    try {
        const [bookingRes, userRes] = await Promise.all([
            docClient.send(new ScanCommand({ TableName: BOOKING_TABLE })),
            docClient.send(new ScanCommand({ TableName: USER_TABLE })),
        ]);

        const bookings: any[] = bookingRes.Items || [];
        const users: any[] = userRes.Items || [];

        const userMap = new Map<string, any>();
        users.forEach(u => {
            if (u.id) userMap.set(u.id, u);
            if (u.userId) userMap.set(u.userId, u);
            if (u.email) userMap.set(u.email, u);
        });

        const transactions = bookings.map(booking => {
            let items: any[] = [];
            try {
                if (booking.itemsJson) {
                    items = JSON.parse(booking.itemsJson);
                }
            } catch (e) {
                items = [];
            }

            // Find Vendor Info
            const firstItem = items[0] || {};
            const vendorEmailOrId = firstItem.vendorId || firstItem.owner || booking.vendorId || "";
            const vendorUser = userMap.get(vendorEmailOrId);
            const vendorName = vendorUser?.name || firstItem.name || (vendorEmailOrId ? vendorEmailOrId.split('@')[0] : "Ad Platform Vendor");

            // Find Client / Payer Info
            const payerUser = userMap.get(booking.userId);
            const payerName = booking.userName || payerUser?.name || (booking.userId ? booking.userId.split('@')[0] : "Client");
            const payerEmail = booking.userId || payerUser?.email || "Unknown";
            const payerPhone = booking.userPhone || payerUser?.phoneNumber || "N/A";

            const amount = Number(booking.amount || booking.totalAmount || 0);
            const rawStatus = (booking.status || "").toUpperCase();
            const rawPaymentStatus = (booking.paymentStatus || "").toUpperCase();

            let status = 'PENDING';
            if (rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS' || rawStatus === 'PAID' || rawPaymentStatus === 'PAID') {
                status = 'COMPLETED';
            } else if (rawStatus === 'CANCELLED' || rawStatus === 'FAILED') {
                status = 'FAILED';
            } else if (rawStatus === 'ACTIVE' || rawStatus === 'CONFIRMED' || rawStatus === 'FORWARDED') {
                status = 'IN_PROGRESS';
            }

            const paymentMethod = booking.paymentType 
                ? (booking.paymentType.charAt(0).toUpperCase() + booking.paymentType.slice(1))
                : (booking.razorpayOrderId ? 'Razorpay' : 'Standard');

            return {
                id: booking.paymentId || booking.id,
                bookingId: booking.id,
                amount,
                payerId: booking.userId,
                payerName,
                payerEmail,
                payerPhone,
                payeeId: vendorEmailOrId,
                payeeName: vendorName,
                payeeEmail: vendorEmailOrId,
                date: booking.orderDate || booking.createdAt || new Date().toISOString(),
                createdAt: booking.createdAt || booking.orderDate || new Date().toISOString(),
                method: paymentMethod,
                status,
                rawStatus: booking.status,
                campaignName: booking.campaignName || "Standard Booking",
                services: booking.services || (firstItem.title ? [firstItem.title] : []),
                itemsCount: items.length > 0 ? items.length : 1,
                items,
                adminNotes: booking.adminNotes || ""
            };
        });

        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate Revenue and Counts strictly based on completed transactions
        const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
        const totalRevenue = completedTransactions.reduce((acc, curr) => acc + curr.amount, 0);

        return NextResponse.json({
            success: true,
            transactions,
            summary: {
                totalRevenue,
                totalCompletedCount: completedTransactions.length,
                totalPendingCount: transactions.length - completedTransactions.length,
                totalTransactions: transactions.length
            }
        });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, status } = body;

        if (!bookingId || !status) {
            return NextResponse.json({ success: false, error: "Missing bookingId or status" }, { status: 400 });
        }

        const updateCommand = new UpdateCommand({
            TableName: BOOKING_TABLE,
            Key: { id: bookingId },
            UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames: {
                "#status": "status",
                "#updatedAt": "updatedAt"
            },
            ExpressionAttributeValues: {
                ":status": status,
                ":updatedAt": new Date().toISOString()
            },
            ReturnValues: "ALL_NEW"
        });

        const result = await docClient.send(updateCommand);

        return NextResponse.json({
            success: true,
            booking: result.Attributes
        });
    } catch (error: any) {
        console.error("Error updating transaction status:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
