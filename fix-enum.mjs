import { DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

async function run() {
    try {
        const serviceTable = 'Service-nsbiqzdckfe7jabryaawz4tjwe-NONE';
        console.log("Scanning table:", serviceTable);
        const { Items } = await client.send(new ScanCommand({ TableName: serviceTable }));

        for (const item of Items) {
            const id = item.id.S;
            const currentStatus = item.approvalStatus ? item.approvalStatus.S : "MISSING";
            console.log(`Service ${id} currently has status: ${currentStatus}`);

            // We need to match the enum exactly: ['pending', 'approved', 'rejected']
            if (currentStatus !== "pending" && currentStatus !== "approved" && currentStatus !== "rejected") {
                console.log(`Fixing approvalStatus for item ${id}...`);
                await client.send(new UpdateItemCommand({
                    TableName: serviceTable,
                    Key: { id: { S: id } },
                    UpdateExpression: "SET approvalStatus = :status",
                    ExpressionAttributeValues: {
                        ":status": { S: "pending" }
                    }
                }));
                console.log(`Fixed item ${id}`);
            }
        }
        console.log("Done checking and fixing records.");
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
