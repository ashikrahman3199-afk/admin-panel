import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    const listCmd = new ListTablesCommand({});
    const tables = await client.send(listCmd);
    const profileTables = tables.TableNames?.filter(t => t.includes("UserProfile"));
    console.log("Matching tables:", profileTables);
}

run();
