import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = fromIni({ profile: "amplify-prod" });
const client = new DynamoDBClient({ region: "ap-south-1", credentials });

async function run() {
    const result = await client.send(
        new ScanCommand({
            TableName: "Service-uxp5cmbsczg7ld4jekrlpzyzgu-NONE",
        })
    );
    console.log(JSON.stringify(result.Items, null, 2));
}

run();
