import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    try {
        const { ListTablesCommand } = await import("@aws-sdk/client-dynamodb");
        const { TableNames } = await client.send(new ListTablesCommand({}));
        
        const vendorTable = TableNames.find(n => n.includes("Vendor") && n.includes("API-"));
        if (!vendorTable) {
            console.error("Vendor table not found");
            return;
        }
        console.log("Scanning table:", vendorTable);
        const { Items } = await client.send(new ScanCommand({ TableName: vendorTable }));
        console.log("Raw Vendors:", JSON.stringify(Items, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
