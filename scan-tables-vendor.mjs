import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

async function scan(region, table) {
    console.log(`--- Scanning ${table} in ${region} ---`);
    const client = new DynamoDBClient({ region, credentials });
    try {
        const data = await client.send(new ScanCommand({ TableName: table }));
        console.log(JSON.stringify(data.Items, null, 2));
    } catch (e) {
        console.error(`Error scanning ${table}:`, e.message);
    }
}

async function run() {
    await scan("ap-south-1", "Service-uxp5cmbsczg7ld4jekrlpzyzgu-NONE");
    await scan("ap-south-1", "UserProfile-uxp5cmbsczg7ld4jekrlpzyzgu-NONE");
}

run();
