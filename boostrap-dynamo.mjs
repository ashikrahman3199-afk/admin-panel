import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import fs from "fs";

// Read amplify_outputs to find the table name
const outputs = JSON.parse(fs.readFileSync("./amplify_outputs.json", "utf-8"));
const userProfileTable = Object.keys(outputs.data.aws_appsync_graphqlEndpoint).find(key => key.includes("UserProfile")) || "";

const client = new DynamoDBClient({ region: "us-east-1" });

async function makeSuperAdmin(email) {
    console.log(`Searching for UserProfile with email: ${email}`);

    try {
        // Find the user's UserProfile table by querying the API ID from outputs
        const apiIdMatch = outputs.data.url.match(/appsync-api\.us-east-1\.amazonaws\.com\/graphql/);
        // Fallback: Just query all Dynamo tables to find the right one (requires AWS credentials)
        const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
        const listCmd = new ListTablesCommand({});
        const tables = await client.send(listCmd);

        const profileTableName = tables.TableNames?.find(t => t.includes("UserProfile"));

        if (!profileTableName) {
            console.error("Could not find UserProfile table.");
            return;
        }

        console.log(`Found table: ${profileTableName}`);

        // Scan for the user
        const scanCmd = new ScanCommand({
            TableName: profileTableName,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": { S: email }
            }
        });

        const scanResult = await client.send(scanCmd);

        if (!scanResult.Items || scanResult.Items.length === 0) {
            console.error("User not found in database.");
            return;
        }

        const userId = scanResult.Items[0].id.S;
        console.log(`Found User ID: ${userId}. Updating to SUPER_ADMIN...`);

        // Update the user
        const updateCmd = new UpdateItemCommand({
            TableName: profileTableName,
            Key: { id: { S: userId } },
            UpdateExpression: "SET #r = :role",
            ExpressionAttributeNames: { "#r": "role" },
            ExpressionAttributeValues: { ":role": { S: "SUPER_ADMIN" } }
        });

        await client.send(updateCmd);
        console.log("Successfully updated to SUPER_ADMIN!");

    } catch (err) {
        console.error("Error:", err);
    }
}

makeSuperAdmin("ashikrahman3199@gmail.com");
