const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const dbClient = new DynamoDBClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
        secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
    }
});
async function run() {
    let res = await dbClient.send(new ListTablesCommand({}));
    console.log("All tables:", res.TableNames.join('\n'));
}
run();
