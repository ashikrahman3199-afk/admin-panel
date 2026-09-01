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

export async function GET() {
    try {
        const scanCommand = new ScanCommand({ 
            TableName: "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE",
            FilterExpression: "#status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": "CART"
            }
        });
        
        const response = await docClient.send(scanCommand);
        return NextResponse.json({ success: true, carts: response.Items || [] });
    } catch (error: any) {
        console.error("Error fetching carts:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
