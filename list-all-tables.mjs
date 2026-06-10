import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

async function list(region) {
    console.log(`--- Tables in ${region} ---`);
    const client = new DynamoDBClient({ region, credentials });
    try {
        const data = await client.send(new ListTablesCommand({}));
        console.log(data.TableNames.filter(n => n.includes("UserProfile") || n.includes("AdSpace") || n.includes("Service")));
    } catch (e) {
        console.error(`Error in ${region}:`, e.message);
    }
}

async function run() {
    await list("ap-south-1");
    await list("us-east-1");
}

run();
