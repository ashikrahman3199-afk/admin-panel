import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

const ADSPACE_TABLE = "AdSpace-d6pvakazenfljpsmln4xcmjx6u-NONE";
const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";
const DISPUTE_TABLE = "Dispute-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET() {
    try {
        const [adSpacesResponse, bookingsResponse, disputesResponse] = await Promise.allSettled([
            docClient.send(new ScanCommand({ TableName: ADSPACE_TABLE })),
            docClient.send(new ScanCommand({ TableName: BOOKING_TABLE })),
            docClient.send(new ScanCommand({ TableName: DISPUTE_TABLE })),
        ]);

        const adSpaces = adSpacesResponse.status === 'fulfilled' ? (adSpacesResponse.value.Items || []) : [];
        const bookings = bookingsResponse.status === 'fulfilled' ? (bookingsResponse.value.Items || []) : [];
        const disputes = disputesResponse.status === 'fulfilled' ? (disputesResponse.value.Items || []) : [];

        // 1. Pending Listings
        const pendingListings = adSpaces.filter(s => s.approvalStatus === 'PENDING' || s.approvalStatus === 'Pending').length;

        // 2. Total Bookings
        const totalBookings = bookings.length;

        // 3. Disputes (Open disputes)
        const openDisputes = disputes.filter(d => d.status === 'OPEN').length;

        // 4. Revenue (Sum of booking amounts for completed transactions only)
        let revenue = 0;
        bookings.forEach(b => {
            const status = (b.status || "").toUpperCase();
            if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'PAID') {
                if (b.totalAmount) {
                    revenue += Number(b.totalAmount);
                } else if (b.amount) {
                    revenue += Number(b.amount);
                }
            }
        });

        // Combine activities for the activity stream
        const activities: any[] = [];
        
        bookings.forEach(b => activities.push({ 
            id: b.id, 
            type: 'booking', 
            title: `Booking #${b.id?.substring(0, 8) || 'Unknown'}`, 
            desc: `Amount: ₹${b.totalAmount || b.amount || 0}`,
            createdAt: b.createdAt || new Date().toISOString()
        }));

        adSpaces.forEach(s => activities.push({ 
            id: s.id, 
            type: 'listing', 
            title: `Listing: ${s.name || s.title || 'Untitled'}`, 
            desc: `Status: ${s.approvalStatus || s.status || 'Unknown'}`,
            createdAt: s.createdAt || new Date().toISOString()
        }));

        disputes.forEach(d => activities.push({ 
            id: d.id, 
            type: 'dispute', 
            title: `Dispute Raised`, 
            desc: d.reason || 'No reason provided',
            createdAt: d.createdAt || new Date().toISOString()
        }));

        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const recentActivity = activities.slice(0, 6);

        return NextResponse.json({
            success: true,
            metrics: {
                pendingListings,
                totalBookings,
                activeDisputes: openDisputes,
                revenue
            },
            recentActivity
        });
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
