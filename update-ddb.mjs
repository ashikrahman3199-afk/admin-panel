import { DynamoDBClient, ListTablesCommand, ScanCommand, UpdateItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = fromIni({ profile: "amplify-prod" });
const ddbClient = new DynamoDBClient({ region: "ap-south-1", credentials });
const targetEmail = "ashikrahman3199@gmail.com";

async function run() {
    try {
        const tablesResponse = await ddbClient.send(new ListTablesCommand({}));
        const userProfileTables = tablesResponse.TableNames?.filter(t => t.includes("UserProfile")) || [];
        
        console.log("Found UserProfile tables:", userProfileTables);
        
        for (const table of userProfileTables) {
            console.log(`Checking table ${table}...`);
            const scan = await ddbClient.send(new ScanCommand({
                TableName: table,
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": { S: targetEmail }
                }
            }));

            if (scan.Items && scan.Items.length > 0) {
                const userId = scan.Items[0].id.S;
                console.log(`Updating existing record in ${table}, ID: ${userId}`);
                await ddbClient.send(new UpdateItemCommand({
                    TableName: table,
                    Key: { id: { S: userId } },
                    UpdateExpression: "SET #r = :role, #s = :status",
                    ExpressionAttributeNames: { "#r": "role", "#s": "status" },
                    ExpressionAttributeValues: { ":role": { S: "SUPER_ADMIN" }, ":status": { S: "ACTIVE" } }
                }));
            } else {
                console.log(`No record in ${table}, inserting...`);
                const newId = Date.now().toString(); 
                await ddbClient.send(new PutItemCommand({
                    TableName: table,
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
        }
        console.log("Done updating DynamoDB tables.");
    } catch (e) {
        console.error("An error occurred:", e);
    }
}

run();
