import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
// We need to find the table name from amplify_outputs.json or just list tables
const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    try {
        const { TableNames } = await client.listTables({});
        const serviceTable = TableNames.find(n => n.includes("Service-"));
        if (!serviceTable) {
            console.error("Service table not found");
            return;
        }
        console.log("Scanning table:", serviceTable);
        const { Items } = await client.send(new ScanCommand({ TableName: serviceTable }));
        console.log(JSON.stringify(Items, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
