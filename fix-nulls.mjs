import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    try {
        const tableName = `Service-uawmybhh3bbpne2x766l2k2sfi-NONE`; // Using my knowledge of table naming conventions, wait I need the real table name.
    } catch(err) {
    }
}
run();
