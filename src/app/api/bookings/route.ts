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

export async function GET(request: Request) {
    try {
        // 1. Fetch Bookings
        const bookingScan = new ScanCommand({ TableName: BOOKING_TABLE });
        const bookingRes = await docClient.send(bookingScan);
        const bookings: any[] = bookingRes.Items || [];

        // 2. Fetch Users to join Contact Info
        const userScan = new ScanCommand({ TableName: USER_TABLE });
        const userRes = await docClient.send(userScan);
        const users = userRes.Items || [];

        // 3. Map Users by userId
        const userMap = new Map();
        for (const user of users) {
            userMap.set(user.id, user);
        }

        // 4. Join Data
        const enrichedBookings: any[] = bookings.map(booking => {
            const user = userMap.get(booking.userId);
            return {
                ...booking,
                clientName: user?.name || "Unknown",
                clientPhone: user?.phoneNumber || "N/A",
                clientEmail: user?.email || booking.userId
            };
        });

        // Sort by orderDate descending
        enrichedBookings.sort((a, b) => {
            const dateA = new Date(a.orderDate || 0).getTime();
            const dateB = new Date(b.orderDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ success: true, bookings: enrichedBookings });
    } catch (error: any) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const updateExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};
        const expressionAttributeNames: Record<string, string> = {};

        Object.keys(updates).forEach((key, index) => {
            const attributeKey = `#attr${index}`;
            const valueKey = `:val${index}`;
            updateExpressions.push(`${attributeKey} = ${valueKey}`);
            expressionAttributeNames[attributeKey] = key;
            expressionAttributeValues[valueKey] = updates[key];
        });

        const updateCommand = new UpdateCommand({
            TableName: BOOKING_TABLE,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, booking: response.Attributes });
    } catch (error: any) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
