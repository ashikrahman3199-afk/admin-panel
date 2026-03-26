import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import fs from 'fs';

const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    try {
        const serviceTable = 'Service-nsbiqzdckfe7jabryaawz4tjwe-NONE';
        console.log("Scanning table:", serviceTable);
        const { Items } = await client.send(new ScanCommand({ TableName: serviceTable }));
        
        for (const item of Items) {
             const id = item.id.S;
             // Check if updatedAt is missing or null
             if (!item.updatedAt || item.updatedAt.NULL) {
                 console.log(`Fixing item ${id}...`);
                 await client.send(new UpdateItemCommand({
                     TableName: serviceTable,
                     Key: { id: { S: id } },
                     UpdateExpression: "SET updatedAt = :date",
                     ExpressionAttributeValues: {
                         ":date": { S: new Date().toISOString() }
                     }
                 }));
                 console.log(`Fixed item ${id}`);
             }
             
             // Check if approvalStatus is missing, which might also hide it
             if (!item.approvalStatus || item.approvalStatus.NULL) {
                 console.log(`Fixing approvalStatus for item ${id}...`);
                 await client.send(new UpdateItemCommand({
                     TableName: serviceTable,
                     Key: { id: { S: id } },
                     UpdateExpression: "SET approvalStatus = :status",
                     ExpressionAttributeValues: {
                         ":status": { S: "pending" }
                     }
                 }));
             }
        }
        console.log("Done checking and fixing records.");
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
