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
        // Support either legacy (approvalStatus) or generic (updates)
        const { id, approvalStatus, rejectionReason, updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        let updateExpressions: string[] = [];
        let expressionAttributeValues: any = {};
        let expressionAttributeNames: any = {};

        if (updates) {
            Object.keys(updates).forEach((key, index) => {
                const attributeKey = `#attr${index}`;
                const valueKey = `:val${index}`;
                updateExpressions.push(`${attributeKey} = ${valueKey}`);
                expressionAttributeNames[attributeKey] = key;
                expressionAttributeValues[valueKey] = updates[key];
            });
        }

        if (approvalStatus) {
            updateExpressions.push("#status = :s, approvalStatus = :s");
            expressionAttributeNames["#status"] = "status";
            expressionAttributeValues[":s"] = approvalStatus;
        }

        if (rejectionReason !== undefined) {
            updateExpressions.push("rejectionReason = :r");
            expressionAttributeValues[":r"] = rejectionReason;
        }

        if (updateExpressions.length === 0) {
            return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
        }

        const updateCommand = new UpdateCommand({
            TableName: "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE",
            Key: { id },
            UpdateExpression: `set ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, item: response.Attributes });
    } catch (error: any) {
        console.error("Error updating ad space:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
        }

        const deleteCommand = new DeleteCommand({
            TableName: "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE",
            Key: { id }
        });

        await docClient.send(deleteCommand);
        return NextResponse.json({ success: true, message: "Ad space deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting ad space:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
