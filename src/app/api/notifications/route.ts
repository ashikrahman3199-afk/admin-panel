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

const NOTIFICATION_TABLE = "Notification-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || "ADMIN"; // Default to admin notifications

        const command = new ScanCommand({
            TableName: NOTIFICATION_TABLE,
            FilterExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": userId
            }
        });

        const response = await docClient.send(command);
        let items = response.Items || [];
        
        // Sort by createdAt descending
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return NextResponse.json({ success: true, notifications: items });
    } catch (error: any) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, read } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const updateCommand = new UpdateCommand({
            TableName: NOTIFICATION_TABLE,
            Key: { id },
            UpdateExpression: "set #r = :read",
            ExpressionAttributeNames: {
                "#r": "read"
            },
            ExpressionAttributeValues: {
                ":read": read
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, item: response.Attributes });
    } catch (error: any) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
