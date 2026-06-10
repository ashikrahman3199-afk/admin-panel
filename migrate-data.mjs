import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

const client = new DynamoDBClient({ region: "ap-south-1", credentials });

const SHARED_SUFFIX = "d6pvakazenfljpsmln4xcmjx6u";
const VENDOR_SUFFIX = "uxp5cmbsczg7ld4jekrlpzyzgu";

async function migrate() {
    const email = "ashikrahman3199@gmail.com";
    const now = Date.now().toString();
    const iso = new Date().toISOString();

    console.log("Migrating vendor...");
    // 1. Get from old Vendor table
    const oldVendorTable = `Vendor-${VENDOR_SUFFIX}-NONE`;
    const { Item: oldVendor } = await client.send(new GetItemCommand({
        TableName: oldVendorTable,
        Key: { id: { S: email } }
    }));

    if (oldVendor) {
        // 2. Put into new UserProfile table
        const newProfileTable = `UserProfile-${SHARED_SUFFIX}-NONE`;
        await client.send(new PutItemCommand({
            TableName: newProfileTable,
            Item: {
                id: { S: email },
                userId: { S: email },
                email: { S: email },
                name: { S: oldVendor.businessName.S },
                phoneNumber: { S: oldVendor.owner.S },
                role: { S: "VENDOR" },
                status: { S: "ACTIVE" },
                totalEarnings: { N: "0" },
                totalBookings: { N: "0" },
                profileViews: { N: "0" },
                __typename: { S: "UserProfile" },
                _version: { N: "1" },
                _lastChangedAt: { N: now },
                createdAt: { S: iso },
                updatedAt: { S: iso }
            }
        }));
        console.log("Vendor migrated to UserProfile.");
    }

    console.log("Migrating service...");
    // 3. Get from old Service table
    const oldServiceTable = `Service-${VENDOR_SUFFIX}-NONE`;
    const serviceId = "1778564288449"; // anna nagar main Flex
    const { Item: oldService } = await client.send(new GetItemCommand({
        TableName: oldServiceTable,
        Key: { id: { S: serviceId } }
    }));

    if (oldService) {
        // 4. Put into new AdSpace table
        const newAdSpaceTable = `AdSpace-${SHARED_SUFFIX}-NONE`;
        await client.send(new PutItemCommand({
            TableName: newAdSpaceTable,
            Item: {
                id: { S: serviceId },
                title: { S: oldService.name.S },
                category: { S: oldService.category.S },
                location: { S: oldService.details.M.location.S },
                price: { N: oldService.options.L[0].M.price.N },
                priceUnit: { S: "Monthly" },
                rating: { N: "0" },
                image: { S: oldService.image.S },
                description: { S: oldService.description.S },
                reach: { S: oldService.details.M.impression.S + " Impressions" },
                minSpend: { N: oldService.options.L[0].M.price.N },
                features: { L: [{ S: "Premium Location" }, { S: "High Visibility" }] },
                approvalStatus: { S: "PENDING" },
                vendorId: { S: email },
                owner: { S: email },
                __typename: { S: "AdSpace" },
                _version: { N: "1" },
                _lastChangedAt: { N: now },
                createdAt: { S: iso },
                updatedAt: { S: iso }
            }
        }));
        console.log("Service migrated to AdSpace.");
    }
}

migrate().catch(console.error);
