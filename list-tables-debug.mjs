import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = fromIni({ profile: "amplify-prod" });
const ddbClient = new DynamoDBClient({ region: "ap-south-1", credentials });

async function run() {
    const tables = await ddbClient.send(new ListTablesCommand({}));
    console.log("All tables:", tables.TableNames);
}
run();
