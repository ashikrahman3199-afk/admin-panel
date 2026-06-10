"use server";

import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = process.env.NODE_ENV === "development" 
    ? fromIni({ profile: "amplify-prod" }) 
    : undefined;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials,
});

// Find the table name automatically or hardcode
const TABLE_NAME = "Service-uxp5cmbsczg7ld4jekrlpzyzgu-NONE";

export async function getPendingServices() {
    try {
        const result = await client.send(
            new ScanCommand({
                TableName: TABLE_NAME,
            })
        );
        const items = (result.Items || []).map(i => unmarshall(i));
        // Sort: Pending first, then by date
        return items.sort((a, b) => {
            const statusA = a.status || a.approvalStatus;
            const statusB = b.status || b.approvalStatus;
            
            const isPendingA = statusA === 'Pending' || statusA === 'PENDING';
            const isPendingB = statusB === 'Pending' || statusB === 'PENDING';

            if (isPendingA && !isPendingB) return -1;
            if (!isPendingA && isPendingB) return 1;
            return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
        });
    } catch (error) {
        console.error("DynamoDB fetch error:", error);
        return [];
    }
}

export async function updateServiceStatus(id: string, status: "Active" | "Rejected" | "Pending", rejectionReason?: string) {
    try {
        if (rejectionReason) {
            await client.send(
                new UpdateItemCommand({
                    TableName: TABLE_NAME,
                    Key: { id: { S: id } },
                    UpdateExpression: "set #s = :s, approvalStatus = :as, rejectionReason = :r",
                    ExpressionAttributeNames: { "#s": "status" },
                    ExpressionAttributeValues: {
                        ":s": { S: status },
                        ":as": { S: status.toUpperCase() },
                        ":r": { S: rejectionReason }
                    }
                })
            );
        } else {
            await client.send(
                new UpdateItemCommand({
                    TableName: TABLE_NAME,
                    Key: { id: { S: id } },
                    UpdateExpression: "set #s = :s, approvalStatus = :as",
                    ExpressionAttributeNames: { "#s": "status" },
                    ExpressionAttributeValues: {
                        ":s": { S: status },
                        ":as": { S: status.toUpperCase() }
                    }
                })
            );
        }
        return { success: true };
    } catch (error) {
        console.error("Error updating service status:", error);
        return { success: false, error };
    }
}
