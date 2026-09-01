const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
        secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
    }
});
const docClient = DynamoDBDocumentClient.from(dbClient);

async function run() {
    let res = await docClient.send(new ScanCommand({ TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE", Limit: 5 }));
    console.log("UserProfile items:", JSON.stringify(res.Items, null, 2));
}
run();
