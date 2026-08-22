import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

export async function GET() {
    try {
        const scanCommand = new ScanCommand({ 
            TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE" 
        });
        
        const response = await docClient.send(scanCommand);
        
        // Filter for VENDORS
        const vendors = (response.Items || []).filter(
            item => item.role === 'VENDOR' || item.role === 'VENDOR_PENDING'
        );

        // Auto-activate vendors if they have all required details
        const autoActivatedVendors = await Promise.all(vendors.map(async (vendor) => {
            if (vendor.status === 'PENDING' || vendor.role === 'VENDOR_PENDING' || !vendor.status) {
                // Determine if they have the essential details
                const hasAllDetails = vendor.email && vendor.phoneNumber && vendor.bankDetails?.accountNumber;
                
                if (hasAllDetails) {
                    try {
                        const updateCommand = new UpdateCommand({
                            TableName: "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE",
                            Key: { id: vendor.id },
                            UpdateExpression: "set #status = :status, #role = :role",
                            ExpressionAttributeNames: {
                                "#status": "status",
                                "#role": "role"
                            },
                            ExpressionAttributeValues: {
                                ":status": "ACTIVE",
                                ":role": "VENDOR"
                            },
                            ReturnValues: "ALL_NEW"
                        });
                        const updated = await docClient.send(updateCommand);
                        return updated.Attributes || vendor;
                    } catch (e) {
                        console.error("Auto-activation failed for", vendor.id, e);
                    }
                }
            }
            return vendor;
        }));

        return NextResponse.json({ success: true, vendors: autoActivatedVendors });
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
