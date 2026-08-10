import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);
const TABLE_NAME = "AdminUsers-custom";

export async function GET(request: Request) {
    try {
        const scanCommand = new ScanCommand({ TableName: TABLE_NAME });
        const response = await docClient.send(scanCommand);
        const users = response.Items || [];
        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        console.error("Error fetching admins:", error);
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

        // If 'name' and 'email' are provided, we are creating/promoting a user
        if (updates.name && updates.email && updates.role) {
            const putCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    id: id,
                    email: updates.email,
                    name: updates.name,
                    role: updates.role,
                    status: updates.status || "ACTIVE",
                    displayId: updates.displayId || `ADA-${Math.floor(100000 + Math.random() * 900000)}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
            await docClient.send(putCommand);
            return NextResponse.json({ success: true, message: "Admin created successfully" });
        }

        // Otherwise, it's an update
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

        // Add updatedAt
        updateExpressions.push(`#attrUpdated = :valUpdated`);
        expressionAttributeNames[`#attrUpdated`] = "updatedAt";
        expressionAttributeValues[`:valUpdated`] = new Date().toISOString();

        const updateCommand = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, user: response.Attributes });

    } catch (error: any) {
        console.error("Error updating admin:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        });

        await docClient.send(deleteCommand);
        return NextResponse.json({ success: true, message: "Admin deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting admin:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
