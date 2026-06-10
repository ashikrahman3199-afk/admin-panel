import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, ListTablesCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
const region = outputs.auth.aws_region;
const userPoolId = outputs.auth.user_pool_id;
const targetEmail = "ashikrahman3199@gmail.com";

const cognitoClient = new CognitoIdentityProviderClient({ region });
const ddbClient = new DynamoDBClient({ region });

async function run() {
    try {
        console.log(`Setting up master admin for: ${targetEmail} in ${region} (${userPoolId})`);

        // 1. Cognito: Add to ADMIN group
        try {
            const addGroupCmd = new AdminAddUserToGroupCommand({
                UserPoolId: userPoolId,
                Username: targetEmail,
                GroupName: "Admin" // Case sensitive in some setups
            });
            await cognitoClient.send(addGroupCmd);
            console.log("Successfully added user to Cognito Admin group.");
        } catch (e) {
            console.error("Failed to add to Cognito group (user might not exist or group missing):", e.message);
        }

        // 2. DynamoDB: Set role to SUPER_ADMIN
        const tables = await ddbClient.send(new ListTablesCommand({}));
        const userProfileTable = tables.TableNames?.find(t => t.includes("UserProfile") && t.includes("API-"));
        
        if (userProfileTable) {
            console.log(`Found UserProfile table: ${userProfileTable}`);
            
            // Find the item first to get the ID
            const scan = await ddbClient.send(new ScanCommand({
                TableName: userProfileTable,
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": { S: targetEmail }
                }
            }));

            if (scan.Items && scan.Items.length > 0) {
                const userId = scan.Items[0].id.S;
                console.log(`Found UserProfile record with ID: ${userId}`);

                const updateExpr = "SET #r = :role" + (scan.Items[0].status ? ", #s = :status" : "");
                const attrNames = { "#r": "role" };
                if (scan.Items[0].status) attrNames["#s"] = "status";
                
                const attrValues = { ":role": { S: "SUPER_ADMIN" } };
                if (scan.Items[0].status) attrValues[":status"] = { S: "ACTIVE" };

                await ddbClient.send(new UpdateItemCommand({
                    TableName: userProfileTable,
                    Key: { id: { S: userId } },
                    UpdateExpression: updateExpr,
                    ExpressionAttributeNames: attrNames,
                    ExpressionAttributeValues: attrValues
                }));
                console.log("Successfully updated UserProfile in DynamoDB.");
            } else {
                console.log("No UserProfile record found for this email. It will be created upon first login.");
            }
        } else {
            console.error("Could not find UserProfile table in DynamoDB.");
        }

    } catch (e) {
        console.error("An error occurred:", e);
    }
}

run();
