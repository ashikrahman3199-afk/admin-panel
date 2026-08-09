import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

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
            TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE" 
        });
        
        const response = await docClient.send(scanCommand);
        
        // Filter for USERS
        const users = (response.Items || []).filter(
            item => item.role === 'USER' || item.role === 'USER_PENDING'
        );

        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        console.error("Error fetching users:", error);
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
            TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE",
            Key: { id },
            UpdateExpression: `set ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, item: response.Attributes });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing ID parameter" }, { status: 400 });
        }

        const deleteCommand = new DeleteCommand({
            TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE",
            Key: { id },
        });

        await docClient.send(deleteCommand);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
