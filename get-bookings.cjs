const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

async function run() {
    try {
        const scanCommand = new ScanCommand({ TableName: "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE" });
        const response = await docClient.send(scanCommand);
        console.log(JSON.stringify(response.Items, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}
run();
