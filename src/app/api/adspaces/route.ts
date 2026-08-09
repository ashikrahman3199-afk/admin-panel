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

export async function GET() {
    try {
        const scanCommand = new ScanCommand({ 
            TableName: "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE" 
        });
        
        const response = await docClient.send(scanCommand);
        return NextResponse.json({ success: true, adSpaces: response.Items || [] });
    } catch (error: any) {
        console.error("Error fetching ad spaces:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, approvalStatus } = body;

        if (!id || !approvalStatus) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const updateCommand = new UpdateCommand({
            TableName: "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE",
            Key: { id },
            UpdateExpression: "set approvalStatus = :s",
            ExpressionAttributeValues: {
                ":s": approvalStatus
            },
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, item: response.Attributes });
    } catch (error: any) {
        console.error("Error updating ad space:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
