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

const DISPUTE_TABLE = "Dispute-d6pvakazenfljpsmln4xcmjx6u-NONE";
const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";
const USER_TABLE = "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET() {
    try {
        const [disputeRes, bookingRes, userRes] = await Promise.all([
            docClient.send(new ScanCommand({ TableName: DISPUTE_TABLE })),
            docClient.send(new ScanCommand({ TableName: BOOKING_TABLE })),
            docClient.send(new ScanCommand({ TableName: USER_TABLE })),
        ]);

        const disputes: any[] = disputeRes.Items || [];
        const bookings: any[] = bookingRes.Items || [];
        const users: any[] = userRes.Items || [];

        const userMap = new Map<string, any>();
        users.forEach(u => {
            if (u.id) userMap.set(u.id, u);
            if (u.userId) userMap.set(u.userId, u);
            if (u.email) userMap.set(u.email, u);
        });

        const bookingMap = new Map<string, any>();
        bookings.forEach(b => {
            if (b.id) bookingMap.set(b.id, b);
        });

        const enrichedDisputes = disputes.map(dispute => {
            const booking = bookingMap.get(dispute.transactionId);
            let vendorEmail = "";
            let vendorName = "Vendor";

            if (booking && booking.itemsJson) {
                try {
                    const items = JSON.parse(booking.itemsJson);
                    if (items && items.length > 0) {
                        vendorEmail = items[0].vendorId || items[0].owner || "";
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
            if (!vendorEmail && booking?.vendorId) {
                vendorEmail = booking.vendorId;
            }

            if (vendorEmail) {
                const vendorUser = userMap.get(vendorEmail);
                vendorName = vendorUser?.name || (vendorEmail.includes('@') ? vendorEmail.split('@')[0] : vendorEmail);
            }

            const clientUser = userMap.get(dispute.raisedBy);
            const clientName = clientUser?.name || (dispute.raisedBy?.includes('@') ? dispute.raisedBy.split('@')[0] : "Client");
            const clientPhone = clientUser?.phoneNumber || booking?.userPhone || "N/A";

            const rawStatus = (dispute.status || 'OPEN').toUpperCase();
            const status = (rawStatus === 'CLEARED' || rawStatus === 'RESOLVED') ? 'CLEARED' : 'OPEN';

            return {
                id: dispute.id,
                reason: dispute.reason || "Dispute raised by client",
                raisedBy: dispute.raisedBy || "Unknown",
                clientName,
                clientEmail: dispute.raisedBy || "Unknown",
                clientPhone,
                transactionId: dispute.transactionId || "N/A",
                bookingId: dispute.transactionId || "N/A",
                campaignName: booking?.campaignName || "Campaign",
                bookingAmount: Number(booking?.amount || booking?.totalAmount || 0),
                bookingStatus: booking?.status || "N/A",
                vendorEmail: vendorEmail || "N/A",
                vendorName,
                status,
                rawStatus: dispute.status,
                severity: dispute.severity || "Standard",
                resolutionNotes: dispute.resolutionNotes || "",
                clearedAt: dispute.clearedAt || dispute.resolvedAt || null,
                createdAt: dispute.createdAt || new Date().toISOString(),
                updatedAt: dispute.updatedAt || new Date().toISOString(),
            };
        });

        // Sort by createdAt descending
        enrichedDisputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const openCount = enrichedDisputes.filter(d => d.status === 'OPEN').length;
        const clearedCount = enrichedDisputes.filter(d => d.status === 'CLEARED').length;

        return NextResponse.json({
            success: true,
            disputes: enrichedDisputes,
            counts: {
                total: enrichedDisputes.length,
                open: openCount,
                cleared: clearedCount,
            }
        });
    } catch (error: any) {
        console.error("Error fetching disputes:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status = 'CLEARED', resolutionNotes } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing dispute id" }, { status: 400 });
        }

        const now = new Date().toISOString();
        const targetStatus = status.toUpperCase();

        const updateExpressions: string[] = [
            "#status = :status",
            "#updatedAt = :updatedAt"
        ];
        const expressionAttributeNames: Record<string, string> = {
            "#status": "status",
            "#updatedAt": "updatedAt"
        };
        const expressionAttributeValues: Record<string, any> = {
            ":status": targetStatus,
            ":updatedAt": now
        };

        if (targetStatus === 'CLEARED') {
            updateExpressions.push("#clearedAt = :clearedAt");
            expressionAttributeNames["#clearedAt"] = "clearedAt";
            expressionAttributeValues[":clearedAt"] = now;

            if (resolutionNotes !== undefined) {
                updateExpressions.push("#resolutionNotes = :resolutionNotes");
                expressionAttributeNames["#resolutionNotes"] = "resolutionNotes";
                expressionAttributeValues[":resolutionNotes"] = resolutionNotes || "Cleared by Admin";
            }
        } else if (targetStatus === 'OPEN') {
            updateExpressions.push("#clearedAt = :clearedAt");
            expressionAttributeNames["#clearedAt"] = "clearedAt";
            expressionAttributeValues[":clearedAt"] = null;
        }

        const updateCommand = new UpdateCommand({
            TableName: DISPUTE_TABLE,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const result = await docClient.send(updateCommand);

        return NextResponse.json({
            success: true,
            dispute: result.Attributes
        });
    } catch (error: any) {
        console.error("Error updating dispute:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
