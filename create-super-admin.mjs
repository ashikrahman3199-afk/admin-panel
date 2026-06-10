import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, ListTablesCommand, ScanCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
const region = outputs.auth.aws_region;
const userPoolId = outputs.auth.user_pool_id;
const targetEmail = "ashikrahman3199@gmail.com";
const targetPassword = "Ashik@3199";

// Use the amplify-prod profile
const credentials = fromIni({ profile: "amplify-prod" });
const cognitoClient = new CognitoIdentityProviderClient({ region, credentials });
const ddbClient = new DynamoDBClient({ region, credentials });

async function run() {
    try {
        console.log(`Setting up super admin: ${targetEmail}`);

        // 1. Create User in Cognito
        try {
            await cognitoClient.send(new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: targetEmail,
                UserAttributes: [
                    { Name: "email", Value: targetEmail },
                    { Name: "email_verified", Value: "true" }
                ],
                MessageAction: "SUPPRESS"
            }));
            console.log("Successfully created user in Cognito.");
        } catch (e) {
            if (e.name === 'UsernameExistsException') {
                console.log("User already exists in Cognito.");
            } else {
                console.error("Failed to create user in Cognito:", e);
                throw e;
            }
        }

        // 2. Set Permanent Password
        try {
            await cognitoClient.send(new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: targetEmail,
                Password: targetPassword,
                Permanent: true
            }));
            console.log("Successfully set permanent password.");
        } catch (e) {
            console.error("Failed to set password:", e);
            throw e;
        }

        // 3. DynamoDB Setup
        const tables = await ddbClient.send(new ListTablesCommand({}));
        const userProfileTable = tables.TableNames?.find(t => t.includes("UserProfile") && t.includes("API-"));
        
        if (userProfileTable) {
            console.log(`Found UserProfile table: ${userProfileTable}`);
            
            const scan = await ddbClient.send(new ScanCommand({
                TableName: userProfileTable,
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": { S: targetEmail }
                }
            }));

            if (scan.Items && scan.Items.length > 0) {
                const userId = scan.Items[0].id.S;
                console.log(`Found existing record, updating ID: ${userId}`);
                await ddbClient.send(new UpdateItemCommand({
                    TableName: userProfileTable,
                    Key: { id: { S: userId } },
                    UpdateExpression: "SET #r = :role, #s = :status",
                    ExpressionAttributeNames: { "#r": "role", "#s": "status" },
                    ExpressionAttributeValues: { ":role": { S: "SUPER_ADMIN" }, ":status": { S: "ACTIVE" } }
                }));
            } else {
                console.log("No record found, creating new SUPER_ADMIN record.");
                const newId = Date.now().toString(); // simple ID generation or UUID
                await ddbClient.send(new PutItemCommand({
                    TableName: userProfileTable,
                    Item: {
                        id: { S: newId },
                        email: { S: targetEmail },
                        name: { S: "Super Admin" },
                        role: { S: "SUPER_ADMIN" },
                        status: { S: "ACTIVE" },
                        createdAt: { S: new Date().toISOString() },
                        updatedAt: { S: new Date().toISOString() }
                    }
                }));
            }
            console.log("DynamoDB successfully configured.");
        } else {
            console.error("Could not find UserProfile table in DynamoDB.");
        }
    } catch (e) {
        console.error("An error occurred:", e);
    }
}

run();
