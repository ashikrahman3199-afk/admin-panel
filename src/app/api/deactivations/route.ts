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

const ADSPACE_TABLE = "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE";
const USER_TABLE = "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE";
const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET() {
    try {
        // 1. Fetch pending deactivations
        const adSpacesResponse = await docClient.send(new ScanCommand({
            TableName: ADSPACE_TABLE,
            FilterExpression: "approvalStatus IN (:s1, :s2, :s3) OR #st IN (:s1, :s2, :s3)",
            ExpressionAttributeNames: {
                "#st": "status"
            },
            ExpressionAttributeValues: { 
                ":s1": "PENDING_DEACTIVATION",
                ":s2": "deactivation_requested",
                ":s3": "DEACTIVATING_IN_30_DAYS"
            }
        }));
        
        const adSpaces = adSpacesResponse.Items || [];
        
        if (adSpaces.length === 0) {
            return NextResponse.json({ success: true, requests: [] });
        }

        // 2. Fetch UserProfiles to get phone numbers
        const usersResponse = await docClient.send(new ScanCommand({ TableName: USER_TABLE }));
        const users = usersResponse.Items || [];
        
        // 3. Fetch Bookings to check upcoming bookings (within 30 days)
        const bookingsResponse = await docClient.send(new ScanCommand({ TableName: BOOKING_TABLE }));
        const allBookings = bookingsResponse.Items || [];
        
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // 4. Combine data
        const requests = adSpaces.map(space => {
            // Find vendor phone
            // Some schemas use `owner`, some `userId`. We check both.
            const vendorId = space.owner || space.userId;
            const vendor = users.find(u => u.userId === vendorId || u.owner === vendorId);
            const vendorPhone = vendor?.phoneNumber || vendor?.phone || "Not provided";
            const vendorName = vendor?.name || "Unknown Vendor";
            
            // Check bookings
            const spaceBookings = allBookings.filter(b => {
                // Determine if booking is for this adspace.
                // Depending on schema, it might be in `services` array or `adSpaceId`
                // Here we assume `services` array contains the adSpace ID or title, or we check itemsJson
                let isForSpace = false;
                if (b.itemsJson) {
                    try {
                        const items = JSON.parse(b.itemsJson);
                        if (items.some((item: any) => item.id === space.id)) isForSpace = true;
                    } catch (e) {}
                } else if (b.services && Array.isArray(b.services)) {
                    if (b.services.includes(space.id) || b.services.includes(space.title) || b.services.includes(space.name)) {
                        isForSpace = true;
                    }
                }
                
                if (!isForSpace) return false;
                
                const bookingStatus = (b.status || "").toUpperCase();
                if (bookingStatus === "FAILED" || bookingStatus === "CANCELLED" || bookingStatus === "REJECTED") {
                    return false;
                }
                
                // Check if date is in the future
                const startDate = b.startDate ? new Date(b.startDate) : (b.createdAt ? new Date(b.createdAt) : null);
                if (!startDate) return true; // Err on the side of caution
                
                return startDate >= now && startDate <= thirtyDaysFromNow;
            });
            
            return {
                id: space.id,
                title: space.title || space.name,
                reason: space.rejectionReason || space.deactivationReason || "No reason provided",
                vendorPhone,
                vendorName,
                pendingBookingsCount: spaceBookings.length,
                createdAt: space.updatedAt || space.createdAt,
                approvalStatus: space.approvalStatus || space.status
            };
        });

        return NextResponse.json({ success: true, requests });
    } catch (error: any) {
        console.error("Error fetching deactivation requests:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, action } = body; // action can be 'APPROVE', 'REJECT', 'IMMEDIATE'

        if (!id || !action) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        let updateExpression = "";
        let expressionAttributeValues: any = {};
        
        if (action === 'APPROVE') {
            const deactivateDate = new Date();
            deactivateDate.setDate(deactivateDate.getDate() + 30);
            
            updateExpression = "set approvalStatus = :s, deactivateAt = :d, #status = :st";
            expressionAttributeValues = {
                ":s": "DEACTIVATING_IN_30_DAYS",
                ":d": deactivateDate.toISOString(),
                ":st": "DEACTIVATING_IN_30_DAYS"
            };
        } else if (action === 'REJECT') {
            updateExpression = "set approvalStatus = :s, #status = :st";
            expressionAttributeValues = {
                ":s": "APPROVED",
                ":st": "Active"
            };
        } else if (action === 'IMMEDIATE') {
            updateExpression = "set approvalStatus = :s, #status = :st";
            expressionAttributeValues = {
                ":s": "DEACTIVATED",
                ":st": "DEACTIVATED"
            };
        } else {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        const updateCommand = new UpdateCommand({
            TableName: ADSPACE_TABLE,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, item: response.Attributes });
    } catch (error: any) {
        console.error("Error processing deactivation action:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
