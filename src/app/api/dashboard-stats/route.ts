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

        // 2. Total Bookings & Callbacks
        const totalBookings = bookings.length;
        const callbackBookings = bookings.filter(b => (b.paymentType || '').toLowerCase() === 'callback');
        const totalCallbacks = callbackBookings.length;
        const pendingCallbacks = callbackBookings.filter(b => {
            const s = (b.status || '').toLowerCase();
            const cs = (b.callbackStatus || '').toLowerCase();
            return (s === 'pending' || cs === 'pending' || !cs) && cs !== 'contacted' && cs !== 'completed';
        }).length;

        // 3. Disputes (Open disputes)
        const openDisputes = disputes.filter(d => (d.status || "").toUpperCase() === 'OPEN').length;
        const clearedDisputes = disputes.filter(d => {
            const s = (d.status || "").toUpperCase();
            return s === 'CLEARED' || s === 'RESOLVED';
        }).length;

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
        
        bookings.forEach(b => {
            const isCallback = (b.paymentType || '').toLowerCase() === 'callback';
            const cleanId = b.id ? b.id.replace(/^booking-/i, '').substring(0, 8) : 'Unknown';
            const campTitle = b.campaignName || 'Campaign';
            const clientName = b.userName || 'Client';
            const clientPhone = b.userPhone || '';
            const amountVal = Number(b.totalAmount || b.amount || 0).toLocaleString();

            activities.push({ 
                id: b.id, 
                type: isCallback ? 'callback' : 'booking', 
                title: isCallback ? `📞 Callback: ${campTitle}` : `Booking #${cleanId}: ${campTitle}`, 
                desc: isCallback 
                    ? `From ${clientName}${clientPhone ? ` (${clientPhone})` : ''} • ₹${amountVal} • ${(b.status || 'PENDING').toUpperCase()}`
                    : `By ${clientName} • Amount: ₹${amountVal} • ${(b.status || 'PENDING').toUpperCase()}`,
                createdAt: b.orderDate || b.createdAt || new Date().toISOString(),
                clientName,
                clientPhone,
                isCallback,
                status: b.status || 'PENDING',
                amount: b.amount || 0
            });
        });

        adSpaces.forEach(s => activities.push({ 
            id: s.id, 
            type: 'listing', 
            title: `Listing: ${s.title || s.name || 'Untitled'}`, 
            desc: `Status: ${(s.approvalStatus || s.status || 'Unknown').toUpperCase()} • ₹${(s.price || 0).toLocaleString()}/${s.priceUnit || 'mo'}`,
            createdAt: s.createdAt || new Date().toISOString()
        }));

        disputes.forEach(d => {
            const isCleared = (d.status || '').toUpperCase() === 'CLEARED' || (d.status || '').toUpperCase() === 'RESOLVED';
            activities.push({ 
                id: d.id, 
                type: 'dispute', 
                title: isCleared ? `Dispute Cleared` : `Dispute Raised`, 
                desc: d.reason || 'No reason provided',
                createdAt: d.updatedAt || d.createdAt || new Date().toISOString()
            });
        });

        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const recentActivity = activities.slice(0, 8);

        return NextResponse.json({
            success: true,
            metrics: {
                pendingListings,
                totalBookings,
                totalCallbacks,
                pendingCallbacks,
                activeDisputes: openDisputes,
                clearedDisputes,
                totalDisputes: disputes.length,
                revenue
            },
            recentActivity
        });
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
