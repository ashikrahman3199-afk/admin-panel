import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

const client = new DynamoDBClient({ region: "ap-south-1", credentials });

async function check() {
    for (const suffix of ["5tjz4iiw5zcidoxd6mwnnpepsu", "d6pvakazenfljpsmln4xcmjx6u"]) {
        const table = `AdSpace-${suffix}-NONE`;
        try {
            const data = await client.send(new ScanCommand({ TableName: table }));
            console.log(`Table ${table} has ${data.Count} items`);
        } catch(e) {
            console.log(`Table ${table} error: ${e.message}`);
        }
    }
}
check();
