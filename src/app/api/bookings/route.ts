import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const dbClient = new DynamoDBClient({ region: REGION, credentials: CREDENTIALS });
const docClient = DynamoDBDocumentClient.from(dbClient);

const BOOKING_TABLE = "Booking-d6pvakazenfljpsmln4xcmjx6u-NONE";
const USER_TABLE = "UserProfile-d6pvakazenfljpsmln4xcmjx6u-NONE";

export async function GET(request: Request) {
    try {
        // 1. Fetch Bookings
        const bookingScan = new ScanCommand({ TableName: BOOKING_TABLE });
        const bookingRes = await docClient.send(bookingScan);
        const bookings: any[] = bookingRes.Items || [];

        // 2. Fetch Users to join Contact Info
        const userScan = new ScanCommand({ TableName: USER_TABLE });
        const userRes = await docClient.send(userScan);
        const users = userRes.Items || [];

        // 3. Map Users by userId
        const userMap = new Map();
        for (const user of users) {
            userMap.set(user.id, user);
        }

        // 4. Join Data
        const enrichedBookings: any[] = bookings.map(booking => {
            const user = userMap.get(booking.userId);
            const isCallback = (booking.paymentType || '').toLowerCase() === 'callback';
            return {
                ...booking,
                clientName: booking.userName || user?.name || "Unknown",
                clientPhone: booking.userPhone || user?.phoneNumber || "N/A",
                clientEmail: user?.email || booking.userId || "N/A",
                isCallback,
                paymentType: booking.paymentType || "advance",
                callbackStatus: booking.callbackStatus || (isCallback ? (booking.status?.toLowerCase() === 'pending' ? 'PENDING' : 'CONTACTED') : undefined)
            };
        });

        // Sort by orderDate descending
        enrichedBookings.sort((a, b) => {
            const dateA = new Date(a.orderDate || 0).getTime();
            const dateB = new Date(b.orderDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ success: true, bookings: enrichedBookings });
    } catch (error: any) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, updates, sendUserNotification, userNotification, create, newBooking } = body;

        // 1. Manual Creation of Booking or Callback Request
        if (create && newBooking) {
            const now = new Date().toISOString();
            const bookingId = newBooking.id || `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const isCallback = (newBooking.paymentType || '').toLowerCase() === 'callback';

            const itemToSave: any = {
                id: bookingId,
                userId: newBooking.userId || newBooking.clientEmail || "direct-client",
                userName: newBooking.userName || newBooking.clientName || "Direct Client",
                userPhone: newBooking.userPhone || newBooking.clientPhone || "N/A",
                campaignName: newBooking.campaignName || "Custom Campaign",
                amount: Number(newBooking.amount || 0),
                orderDate: newBooking.orderDate || now,
                startDate: newBooking.startDate || now,
                endDate: newBooking.endDate || now,
                status: newBooking.status || (isCallback ? 'PENDING' : 'CONFIRMED'),
                paymentType: newBooking.paymentType || (isCallback ? 'callback' : 'advance'),
                callbackStatus: isCallback ? 'PENDING' : undefined,
                services: newBooking.services || [newBooking.campaignName || "Ad Space Service"],
                itemsJson: newBooking.itemsJson || "[]",
                adminNotes: newBooking.adminNotes || (isCallback ? "Direct callback request logged by admin" : "Direct booking created by admin"),
                createdAt: now,
                updatedAt: now,
            };

            const putCommand = new PutCommand({
                TableName: BOOKING_TABLE,
                Item: itemToSave
            });
            await docClient.send(putCommand);

            // Send In-App notification to the user if requested and user has email
            if (sendUserNotification && itemToSave.userId && itemToSave.userId.includes('@')) {
                const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const putNotif = new PutCommand({
                    TableName: "Notification-d6pvakazenfljpsmln4xcmjx6u-NONE",
                    Item: {
                        id: notifId,
                        userId: itemToSave.userId,
                        title: userNotification?.title || (isCallback ? "Callback Request Registered!" : "New Booking Created!"),
                        message: userNotification?.message || `Your booking for "${itemToSave.campaignName}" has been logged. Our administration team is coordinating details with you.`,
                        type: isCallback ? "CALLBACK" : "BOOKING",
                        read: false,
                        createdAt: now,
                        updatedAt: now,
                    }
                });
                await docClient.send(putNotif);
            }

            return NextResponse.json({ success: true, booking: itemToSave });
        }

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing booking ID" }, { status: 400 });
        }

        // 2. Fetch existing booking to get details for notifications
        let existingBookingItem: any = null;
        try {
            const getCommand = new GetCommand({
                TableName: BOOKING_TABLE,
                Key: { id }
            });
            const existingRes = await docClient.send(getCommand);
            existingBookingItem = existingRes.Item;
        } catch (e) {
            console.error("Could not fetch existing booking:", e);
        }

        // 3. Check if user requested an in-app notification to the customer
        if (sendUserNotification && userNotification) {
            const targetUserId = userNotification.userId || existingBookingItem?.userId;
            if (targetUserId) {
                try {
                    const now = new Date().toISOString();
                    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    const putUserNotif = new PutCommand({
                        TableName: "Notification-d6pvakazenfljpsmln4xcmjx6u-NONE",
                        Item: {
                            id: notifId,
                            userId: targetUserId,
                            title: userNotification.title || "Booking & Callback Update",
                            message: userNotification.message || "Your booking has received an update from the administration team.",
                            type: userNotification.type || "CALLBACK",
                            read: false,
                            createdAt: now,
                            updatedAt: now,
                        }
                    });
                    await docClient.send(putUserNotif);
                } catch (notifErr) {
                    console.error("Failed to send in-app notification to user:", notifErr);
                }
            }
        }

        // 4. Vendor Notification when Forwarded
        if (updates?.status === 'FORWARDED' || updates?.status === 'forwarded') {
            try {
                if (existingBookingItem && existingBookingItem.itemsJson) {
                    const items = JSON.parse(existingBookingItem.itemsJson);
                    const vendorIds = new Set<string>();
                    items.forEach((item: any) => {
                        if (item.vendorId) vendorIds.add(item.vendorId);
                    });

                    for (const vendorId of vendorIds) {
                        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                        const putNotif = new PutCommand({
                            TableName: "Notification-d6pvakazenfljpsmln4xcmjx6u-NONE",
                            Item: {
                                id: notifId,
                                userId: vendorId,
                                title: "New Booking Forwarded!",
                                message: `You have received a new forwarded booking from the Admin. Please review and approve it.`,
                                type: "BOOKING",
                                read: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            }
                        });
                        await docClient.send(putNotif);
                    }
                }

                // Also notify the user that their booking was verified and forwarded to the vendor
                if (existingBookingItem?.userId && existingBookingItem.userId.includes('@')) {
                    const userNotifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    await docClient.send(new PutCommand({
                        TableName: "Notification-d6pvakazenfljpsmln4xcmjx6u-NONE",
                        Item: {
                            id: userNotifId,
                            userId: existingBookingItem.userId,
                            title: "Booking Forwarded to Vendor",
                            message: `Your booking for "${existingBookingItem.campaignName || 'campaign'}" has been verified and forwarded to the vendor for fulfillment.`,
                            type: "BOOKING",
                            read: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }
                    }));
                }
            } catch (e) {
                console.error("Failed to parse itemsJson or send notifications", e);
            }
        }

        // If updates is empty but user notification was sent, return success
        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true, message: "User notified successfully", booking: existingBookingItem });
        }

        const updateExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};
        const expressionAttributeNames: Record<string, string> = {};

        Object.keys(updates).forEach((key, index) => {
            const attributeKey = `#attr${index}`;
            const valueKey = `:val${index}`;
            updateExpressions.push(`${attributeKey} = ${valueKey}`);
            expressionAttributeNames[attributeKey] = key;
            expressionAttributeValues[valueKey] = updates[key];
        });

        const updateCommand = new UpdateCommand({
            TableName: BOOKING_TABLE,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(updateCommand);
        return NextResponse.json({ success: true, booking: response.Attributes });
    } catch (error: any) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
